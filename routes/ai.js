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

// ── POST /chat — AI Chatbot assistant for system & general questions ────────
router.post('/chat', async (req, res) => {
    // Allow both admin and super_admin roles
    const role = req.headers['x-user-role'];
    if (role !== 'admin' && role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    try {
        const { message, chatHistory, tasks, departments } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.json({
                reply: "⚠️ GROQ_API_KEY is not set on this server. Please add it in Vercel environment variables under Settings → Environment Variables."
            });
        }

        const groq = new Groq({ apiKey });

        // Build context with current system state
        const systemContext = `You are a high-performance AI assistant integrated into the Growth Hub Management System.
The admin is talking to you. You can answer system-specific questions or general questions not related to the system.
Here is the current state of the system for reference:
- Current Registered Departments: ${JSON.stringify(departments)}
- Active Tasks count: ${tasks.length}
- Sample active tasks: ${JSON.stringify(tasks.slice(0, 15).map(t => ({ name: t.task_name, dept: t.department, status: t.status, assignees: t.responsible })))}

Answer helpful, clearly formatted responses. Use concise bullet points if explaining complex data.`;

        const messages = [
            { role: "system", content: systemContext }
        ];

        // Add history (max 8 messages)
        if (chatHistory && Array.isArray(chatHistory)) {
            chatHistory.slice(-8).forEach(msg => {
                messages.push({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text });
            });
        }

        // Add current query
        messages.push({ role: "user", content: message });

        const completion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1500
        });

        const reply = completion.choices[0]?.message?.content || "No reply generated.";
        res.json({ reply });
    } catch (err) {
        console.error("AI Chatbot Error:", err);
        res.status(500).json({ error: 'Chatbot model query failed', details: err.message });
    }
});

module.exports = router;
