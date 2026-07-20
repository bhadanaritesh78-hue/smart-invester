import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = 3000;

// Initialize Gemini SDK lazily to avoid crashing on start if the key is missing in local dev
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment. Please add it via Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route: AI Schema Assistant
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, schemaContext } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Invalid messages array provided.' });
        return;
      }

      const client = getAIClient();

      // Construct a detailed database system instruction prompt
      const systemInstruction = `You are an expert Database Architect and Database Administrator specialized in modern investment and trading systems.
Your job is to assist users in understanding, extending, and optimizing their ERD and database schema.

The schema has the following entities and relations already defined:
${JSON.stringify(schemaContext, null, 2)}

Provide clear, highly detailed, professional, and practical advice.
- When generating SQL, prefer PostgreSQL syntax. Use best practices: explicit types, PK/FK constraints, indexes on foreign keys, CHECK constraints (e.g. balance >= 0), partition advice, and transaction blocks (BEGIN / COMMIT) for financial security.
- Avoid low-quality filler. Speak directly as a senior DB engineer.
- Do not mention paths like "/src/initialSchema.ts" or code-level filenames unless asked. Keep context focused on the database schema and architecture.
- If the user asks for help normalising or creating a table, write high-quality DDL with explanation.
- Speak in a professional, clear, and objective tone. Use bold key terms and clean markdown blocks.`;

      // Transform messages into contents format for the SDK
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      res.json({ content: response.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        error: error.message || 'An error occurred while contacting the AI Schema Assistant.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Loading Vite middleware for development...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
