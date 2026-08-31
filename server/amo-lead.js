import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const {
    AMO_SUBDOMAIN,
    AMO_TOKEN,
    AMO_PIPELINE_ID,
    AMO_RESPONSIBLE_USER_ID,
    AMO_PIPELINE_ID_UZ,
    AMO_RESPONSIBLE_USER_ID_UZ,
    AMO_PIPELINE_ID_RU,
    AMO_RESPONSIBLE_USER_ID_RU,
    META_PIXEL_ID = '2113481812884524',
    META_CAPI_TOKEN,
    META_TEST_EVENT_CODE,
    PORT = '3001',
    ALLOWED_ORIGINS = 'https://4you.4hands.ru,https://franchbeaty.ru,https://www.franchbeaty.ru',
    LEADS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'leads.jsonl'),
    LEADS_EXPORT_TOKEN,
} = process.env;

const allowedOrigins = ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);

const required = ['AMO_SUBDOMAIN', 'AMO_TOKEN', 'AMO_PIPELINE_ID', 'AMO_RESPONSIBLE_USER_ID'];
for (const key of required) {
    if (!process.env[key]) {
        console.error(`Missing env: ${key}`);
        process.exit(1);
    }
}

const AMO_BASE = `https://${AMO_SUBDOMAIN}.amocrm.ru/api/v4`;

// Rate limiting: max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };

    if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + RATE_WINDOW_MS;
    }

    entry.count += 1;
    rateLimitMap.set(ip, entry);

    // Cleanup old entries periodically
    if (rateLimitMap.size > 10000) {
        for (const [k, v] of rateLimitMap) {
            if (now > v.resetAt) rateLimitMap.delete(k);
        }
    }

    return entry.count <= RATE_LIMIT;
}

async function amoPost(path, body) {
    const resp = await fetch(`${AMO_BASE}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${AMO_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`AMO ${path} → ${resp.status}: ${text}`);
    }
    return resp.json();
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

// Persist every lead to a local JSONL file, independent of AMO/Sheets —
// so a lead is never lost if an external service is down or unreachable.
async function appendLead(record) {
    try {
        await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true });
        await fs.appendFile(LEADS_FILE, JSON.stringify(record) + '\n');
    } catch (err) {
        console.error('appendLead failed:', err.message);
    }
}

async function readLeads({ since } = {}) {
    let raw;
    try {
        raw = await fs.readFile(LEADS_FILE, 'utf8');
    } catch {
        return [];
    }
    const sinceDate = since ? new Date(since) : null;
    const leads = [];
    for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        try {
            const record = JSON.parse(line);
            if (sinceDate && new Date(record.timestamp) < sinceDate) continue;
            leads.push(record);
        } catch (err) {
            console.error('Skipping malformed lead line:', err.message);
        }
    }
    return leads;
}

function leadsToCsv(leads) {
    const columns = ['timestamp', 'source', 'market', 'site', 'name', 'phone', 'format', 'messenger', 'ads_consent', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'amo_status', 'ip'];
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [columns.join(',')];
    for (const lead of leads) {
        rows.push(columns.map(c => escape(lead[c])).join(','));
    }
    return rows.join('\n');
}

// Fire-and-forget: send Lead event to Meta Conversions API (server-side,
// bypasses ad-blockers and page-navigation timing issues on the client).
async function sendMetaLead({ phoneDigits, ip, userAgent, sourceUrl }) {
    if (!META_CAPI_TOKEN) return;
    try {
        const payload = {
            data: [{
                event_name: 'Lead',
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                event_source_url: sourceUrl || 'https://franchbeaty.ru/',
                user_data: {
                    ph: [sha256(phoneDigits)],
                    client_ip_address: ip,
                    client_user_agent: userAgent,
                },
            }],
            access_token: META_CAPI_TOKEN,
        };
        if (META_TEST_EVENT_CODE) payload.test_event_code = META_TEST_EVENT_CODE;

        const resp = await fetch(`https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) {
            console.error('Meta CAPI error:', resp.status, await resp.text());
        }
    } catch (err) {
        console.error('Meta CAPI request failed:', err.message);
    }
}

function setCors(res, origin) {
    // Only allow requests from our own domains
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data, origin) {
    setCors(res, origin);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    const origin = req.headers['origin'] || '';
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

    setCors(res, origin);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Local leads export — bearer-token protected, no CORS/origin needed
    // since it's only ever called manually (curl), not from the browser.
    if (req.method === 'GET' && req.url.startsWith('/api/leads')) {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!LEADS_EXPORT_TOKEN || token !== LEADS_EXPORT_TOKEN) {
            return json(res, 404, { ok: false, error: 'not_found' }, origin);
        }
        const reqUrl = new URL(req.url, 'http://localhost');
        const leads = await readLeads({ since: reqUrl.searchParams.get('since') });
        if (reqUrl.searchParams.get('format') === 'csv') {
            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8' });
            return res.end(leadsToCsv(leads));
        }
        return json(res, 200, { ok: true, count: leads.length, leads }, origin);
    }

    if (req.method !== 'POST' || req.url !== '/api/lead') {
        return json(res, 404, { ok: false, error: 'not_found' }, origin);
    }

    // Block requests from unknown origins (direct API calls from other sites)
    if (origin && !allowedOrigins.includes(origin)) {
        return json(res, 403, { ok: false, error: 'forbidden' }, origin);
    }

    // Rate limit
    if (!checkRateLimit(ip)) {
        return json(res, 429, { ok: false, error: 'too_many_requests' }, origin);
    }

    // Body size limit (prevent memory attacks)
    let body = '';
    req.on('data', chunk => {
        body += chunk;
        if (body.length > 4096) {
            req.destroy();
        }
    });

    req.on('end', async () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            return json(res, 400, { ok: false, error: 'invalid_json' }, origin);
        }

        const { name, phone, format, budget, messenger, source, ads_consent, market, site,
                utm_source, utm_medium, utm_campaign, utm_content, utm_term } = data;

        // Site-specific tags (only for sites that opt in via the `site` field —
        // KZ/UZ landings don't send it, so they're untouched).
        const SITE_TAGS = { franch: 'franch', 'salon-krasoty': 'salon krasoty' };
        const resolvedFormat = format || budget || 'франшиза';

        // Per-market pipeline routing. Each market falls back to the default
        // pipeline until its own AMO_PIPELINE_ID_* secret is set, so leads
        // never get silently dropped while a new market is being wired up.
        const MARKET_PIPELINES = {
            uz: { pipeline: AMO_PIPELINE_ID_UZ, responsible: AMO_RESPONSIBLE_USER_ID_UZ },
            ru: { pipeline: AMO_PIPELINE_ID_RU, responsible: AMO_RESPONSIBLE_USER_ID_RU },
        };
        const marketRoute = MARKET_PIPELINES[market];
        const pipelineId = marketRoute?.pipeline ? Number(marketRoute.pipeline) : Number(AMO_PIPELINE_ID);
        const responsibleUserId = marketRoute?.pipeline
            ? Number(marketRoute.responsible || AMO_RESPONSIBLE_USER_ID)
            : Number(AMO_RESPONSIBLE_USER_ID);

        // Server-side validation
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return json(res, 400, { ok: false, error: 'invalid_name' }, origin);
        }
        const phoneDigits = (phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return json(res, 400, { ok: false, error: 'invalid_phone' }, origin);
        }

        // Persist locally first — a lead must survive even if AMO is down.
        const leadRecord = {
            timestamp: new Date().toISOString(),
            source: source || 'franch-landing',
            market: market || null,
            site: site || null,
            name: name.trim(),
            phone: phoneDigits,
            format: resolvedFormat,
            messenger: messenger || null,
            ads_consent: !!ads_consent,
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            utm_content: utm_content || null,
            utm_term: utm_term || null,
            ip,
        };
        await appendLead({ ...leadRecord, amo_status: 'pending' });

        try {
            // 1. Create contact
            const contactResp = await amoPost('/contacts', [{
                name: name.trim(),
                custom_fields_values: [
                    { field_code: 'PHONE', values: [{ value: phoneDigits, enum_code: 'WORK' }] },
                ],
            }]);
            const contactId = contactResp._embedded.contacts[0].id;

            // 2. Create lead
            const tags = [{ name: source || 'franch-landing' }];
            if (messenger) tags.push({ name: `messenger:${messenger}` });
            if (ads_consent) tags.push({ name: 'ads_consent' });
            if (market) tags.push({ name: `market:${market}` });
            if (SITE_TAGS[site]) {
                tags.push({ name: 'ИИ Сайты' });
                tags.push({ name: SITE_TAGS[site] });
            }
            if (utm_source)   tags.push({ name: `utm_source:${utm_source}` });
            if (utm_medium)   tags.push({ name: `utm_medium:${utm_medium}` });
            if (utm_campaign) tags.push({ name: `utm_campaign:${utm_campaign}` });
            if (utm_content)  tags.push({ name: `utm_content:${utm_content}` });
            if (utm_term)     tags.push({ name: `utm_term:${utm_term}` });

            await amoPost('/leads', [{
                name: `Заявка — ${resolvedFormat}`,
                pipeline_id: pipelineId,
                responsible_user_id: responsibleUserId,
                _embedded: {
                    contacts: [{ id: contactId }],
                    tags,
                },
            }]);

            sendMetaLead({ phoneDigits, ip, userAgent: req.headers['user-agent'], sourceUrl: origin }).catch(() => {});

            return json(res, 200, { ok: true }, origin);
        } catch (err) {
            console.error('AMO error:', err.message);
            return json(res, 502, { ok: false, error: 'amo_error' }, origin);
        }
    });
});

server.listen(Number(PORT), '127.0.0.1', () => {
    console.log(`AMO lead server → http://127.0.0.1:${PORT}`);
});
