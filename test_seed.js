const http = require('http');

const data = JSON.stringify({
    task_name: 'Finalize Strategy Deck',
    department: 'Product Research',
    priority: 'High',
    status: 'Completed',
    progress: 100,
    due_date: '2026-03-25',
    completed_date: '2026-03-27',
    delay_reason: 'Waiting for stakeholder review',
    description: 'Completed late, so it should show crossed out due date.',
    responsible: ['Admin User']
});

const data2 = JSON.stringify({
    task_name: 'Quick Research Fix',
    department: 'Product Research',
    priority: 'Medium',
    status: 'Completed',
    progress: 100,
    due_date: '2026-03-31',
    completed_date: '2026-03-28',
    description: 'Completed on time, so it should show normal due date.',
    responsible: ['Test User']
});

const post = (d) => {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/tasks',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(d)
        }
    };
    const req = http.request(options, res => console.log('Posted: ' + res.statusCode));
    req.write(d);
    req.end();
};

post(data);
post(data2);
