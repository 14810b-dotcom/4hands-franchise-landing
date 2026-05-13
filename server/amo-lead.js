import http from 'node:http';

const {
    AMO_SUBDOMAIN,
    AMO_TOKEN,
    AMO_PIPELINE_ID,
    AMO_RESPONSIBLE_USER_ID,
    PORT = '3001',
    ALLOWED_ORIGIN = 'https://4you.4hands.ru',
} = process.env;

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

function setCors(res, origin) {
    // Only allow requests from our own domain
    if (origin === ALLOWED_ORIGIN) {
        res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
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
    if (origin && origin !== ALLOWED_ORIGIN) {
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

        const { name, phone, city, format, messenger, source, ads_consent } = data;

        // Server-side validation
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return json(res, 400, { ok: false, error: 'invalid_name' }, origin);
        }
        const phoneDigits = (phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 11) {
            return json(res, 400, { ok: false, error: 'invalid_phone' }, origin);
        }
        if (!city || typeof city !== 'string' || city.trim().length < 2) {
            return json(res, 400, { ok: false, error: 'invalid_city' }, origin);
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

            await amoPost('/leads', [{
                name: `Заявка ${city.trim()} — ${format || 'франшиза'}`,
                pipeline_id: Number(AMO_PIPELINE_ID),
                responsible_user_id: Number(AMO_RESPONSIBLE_USER_ID),
                _embedded: {
                    contacts: [{ id: contactId }],
                    tags,
                },
            }]);

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
