import http from 'node:http';

const {
    AMO_SUBDOMAIN,
    AMO_TOKEN,
    AMO_PIPELINE_ID,
    AMO_RESPONSIBLE_USER_ID,
    PORT = '3001',
} = process.env;

const required = ['AMO_SUBDOMAIN', 'AMO_TOKEN', 'AMO_PIPELINE_ID', 'AMO_RESPONSIBLE_USER_ID'];
for (const key of required) {
    if (!process.env[key]) {
        console.error(`Missing env: ${key}`);
        process.exit(1);
    }
}

const AMO_BASE = `https://${AMO_SUBDOMAIN}.amocrm.ru/api/v4`;

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

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
    cors(res);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    cors(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method !== 'POST' || req.url !== '/api/lead') {
        return json(res, 404, { ok: false, error: 'not_found' });
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            return json(res, 400, { ok: false, error: 'invalid_json' });
        }

        const { name, phone, city, format, messenger, source } = data;

        // Server-side validation
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return json(res, 400, { ok: false, error: 'invalid_name' });
        }
        const phoneDigits = (phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 11) {
            return json(res, 400, { ok: false, error: 'invalid_phone' });
        }
        if (!city || typeof city !== 'string' || city.trim().length < 2) {
            return json(res, 400, { ok: false, error: 'invalid_city' });
        }

        try {
            // 1. Create/find contact
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

            await amoPost('/leads', [{
                name: `Заявка ${city.trim()} — ${format || 'франшиза'}`,
                pipeline_id: Number(AMO_PIPELINE_ID),
                responsible_user_id: Number(AMO_RESPONSIBLE_USER_ID),
                _embedded: {
                    contacts: [{ id: contactId }],
                    tags,
                },
            }]);

            return json(res, 200, { ok: true });
        } catch (err) {
            console.error('AMO error:', err.message);
            return json(res, 502, { ok: false, error: 'amo_error' });
        }
    });
});

server.listen(Number(PORT), () => {
    console.log(`AMO lead server → http://localhost:${PORT}`);
});
