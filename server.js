import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `Sen BRSKO AI adında, dünyanın en iyi yapay zeka destekli kişisel finans asistanısın.
Görevin:
- Kullanıcının finansal sorularına net, zeki ve motive edici yanıtlar vermek
- Bütçe analizi, tasarruf planları, yatırım tavsiyeleri sunmak
- Sıcak ve samimi ama profesyonel bir dil kullanmak
- Her zaman Türkçe konuşmak
- Kısa, öz ve anlaşılır olmak
- Her finansal tavsiyede kısa bir risk uyarısı eklemek
Asla robot gibi konuşma. Gerçek bir Wall Street finans koçu gibi davran.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const API_KEY = process.env.VITE_OPENROUTER_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const payload = {
      model: 'google/gemma-4-26b-a4b-it:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content || m.text || ''
        }))
      ]
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5181',
        'X-Title': 'BRSKO AI Finance'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('OpenRouter response status:', response.status);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.json({ reply: data.choices[0].message.content });
    }

    // Log full error for debugging
    console.error('Unexpected response:', JSON.stringify(data, null, 2));
    return res.status(500).json({ error: 'Unexpected AI response', detail: JSON.stringify(data) });

  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-2.0-flash via OpenRouter' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`✅ BRSKO AI Proxy → http://localhost:${PORT}`);
  console.log(`🔒 API key hidden server-side`);
});
