import http from 'node:http';
import crypto from 'node:crypto';

const {
    AMO_SUBDOMAIN,
    AMO_TOKEN,
    AMO_PIPELINE_ID,
    AMO_RESPONSIBLE_USER_ID,
    AMO_PIPELINE_ID_UZ,
    AMO_RESPONSIBLE_USER_ID_UZ,
    META_PIXEL_ID = '2113481812884524',
    META_CAPI_TOKEN,
    META_TEST_EVENT_CODE,
    PORT = '3001',
    ALLOWED_ORIGINS = 'https://4you.4hands.ru,https://franchbeaty.ru,https://www.franchbeaty.ru',
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

        const { name, phone, format, budget, messenger, source, ads_consent, market } = data;
        const resolvedFormat = format || budget || 'франшиза';

        // UZ leads go to their own pipeline once it's configured; falls back
        // to the default (KZ) pipeline so leads never get silently dropped.
        const useUzPipeline = market === 'uz' && AMO_PIPELINE_ID_UZ;
        const pipelineId = useUzPipeline ? Number(AMO_PIPELINE_ID_UZ) : Number(AMO_PIPELINE_ID);
        const responsibleUserId = useUzPipeline
            ? Number(AMO_RESPONSIBLE_USER_ID_UZ || AMO_RESPONSIBLE_USER_ID)
            : Number(AMO_RESPONSIBLE_USER_ID);

        // Server-side validation
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return json(res, 400, { ok: false, error: 'invalid_name' }, origin);
        }
        const phoneDigits = (phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return json(res, 400, { ok: false, error: 'invalid_phone' }, origin);
        }

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
