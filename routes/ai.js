const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

router.post('/align', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        const { vision, mission, tasks, departments } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            // Fake Mock Data for demonstration if NO API KEY IS PROVIDED
            return res.json({
                hasKey: false,
                averageAlignment: 75,
                overallInsight: "Moderate strategic alignment based on deterministic analysis. Add a GROQ_API_KEY in your .env for high-speed Llama-3 AI.",
                departmentScores: departments.map(d => ({
                    dept: d,
                    score: 65 + Math.floor(Math.random() * 25),
                    status: 'Partial',
                    statusClass: 'ai-status-partial',
                    suggestion: 'Provide GROQ_API_KEY to unlock Llama-3 department-specific task alignment suggestions.'
                })),
                keyRecommendations: [
                    'Update your .env file with GROQ_API_KEY to activate high-performance Groq AI.',
                    'The system currently uses a baseline simulation; real AI analysis requires an active Groq key.'
                ]
            });
        }
        
        // Initialize Groq
        const groq = new Groq({ apiKey });
        
        const systemPrompt = `You are an elite Business Strategy Analyst. Evaluate organizational tasks against vision/mission. 
        ALWAYS respond with a valid JSON object only. NO markdown, NO code blocks, NO preamble. 
        The JSON must match this structure exactly:
        {
          "averageAlignment": <number 0-100>,
          "overallInsight": "<summary string>",
          "departmentScores": [{"dept": "string", "score": number, "status": "Aligned|Partial|Misaligned", "statusClass": "ai-status-aligned|ai-status-partial|ai-status-misaligned", "suggestion": "string"}],
          "keyRecommendations": ["string", "string"]
        }`;

        const userPrompt = `Vision: "${vision}" 
        Mission: "${mission}" 
        Current Tasks: ${JSON.stringify(tasks.map(t => ({ name: t.task_name, dept: t.department, desc: t.description }))) }
        Departments: ${departments.join(', ')}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 2048,
        });

        const rawResult = completion.choices[0]?.message?.content || "{}";
        // Final sanity check – remove any potential markdown tags if the model ignored instructions
        const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        data.hasKey = true;
        
        res.json(data);
    } catch (err) {
        console.error("Groq AI Error Detailed:", err);
        res.status(500).json({ 
            error: 'Groq analysis failed', 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// ── POST /chat — AI Chatbot powered by Groq Llama ────────────────────────────
router.post('/chat', async (req, res) => {
    const role = req.headers['x-user-role'];
    if (role !== 'admin' && role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        const { message, chatHistory, tasks, departments } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.json({
                reply: "⚠️ GROQ_API_KEY is not configured on this server. Please add it in your .env file."
            });
        }

        const groq = new Groq({ apiKey });

        // Null-safe defaults
        const safeTasks = Array.isArray(tasks) ? tasks : [];
        const safeDepts = Array.isArray(departments) ? departments : [];

        const systemContext = `You are a high-performance AI assistant integrated into the Growth Hub Management System.
The admin is talking to you. Answer system-specific or general questions helpfully.
Current system state:
- Departments: ${JSON.stringify(safeDepts)}
- Active Tasks: ${safeTasks.length}
- Sample tasks: ${JSON.stringify(safeTasks.slice(0, 10).map(t => ({ name: t.task_name, dept: t.department, status: t.status })))}
Use concise bullet points when listing data.`;

        const messages = [{ role: 'system', content: systemContext }];

        if (chatHistory && Array.isArray(chatHistory)) {
            chatHistory.slice(-8).forEach(msg => {
                messages.push({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text });
            });
        }
        messages.push({ role: 'user', content: message });

        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1200
        });

        const reply = completion.choices[0]?.message?.content || 'No reply generated.';
        res.json({ reply });

    } catch (err) {
        console.error('Chatbot Error:', err.message);
        // Send only the human-readable message, not the full JSON blob
        const msg = err?.error?.error?.message || err?.message || 'AI query failed';
        res.status(500).json({ error: msg });
    }
});

module.exports = router;

