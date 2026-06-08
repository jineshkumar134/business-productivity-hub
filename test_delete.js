const http = require('http');

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: path,
            method: method,
            headers: {}
        };
        
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data || '{}') }));
        });
        
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    console.log('Fetching documents...');
    const listRes = await makeRequest('GET', '/api/documents');
    console.log('GET /api/documents:', listRes);
    
    if (listRes.data && listRes.data.length > 0) {
        const firstId = listRes.data[0]._id;
        console.log(`\nFetching document details for ${firstId}...`);
        const detailRes = await makeRequest('GET', `/api/documents/${firstId}`);
        console.log(`GET /api/documents/${firstId}:`, {
            statusCode: detailRes.statusCode,
            name: detailRes.data.name,
            hasData: !!detailRes.data.data
        });
        
        console.log(`\nDeleting document ${firstId}...`);
        const delRes = await makeRequest('DELETE', `/api/documents/${firstId}`);
        console.log('DELETE result:', delRes);
    }
}

run().catch(console.error);
