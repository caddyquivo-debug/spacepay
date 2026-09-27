import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.ts';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// JSON and urlencoded parser with generous limit for PDF and video uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static uploads serving for direct assets
app.use('/uploads', express.static(uploadsDir));

// Mount API routes
app.use('/api', apiRouter);

// STRICT: Any /api/* request not handled by apiRouter MUST return JSON 404, never fallback to index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint de API '${req.method} ${req.originalUrl}' não encontrado.` });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.originalUrl.startsWith('/api')) {
    console.error('[SpacePay API Error]:', err);
    return res.status(500).json({ error: err?.message || 'Erro interno no servidor de API.' });
  }
  next(err);
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback to index.html for SPA client-side routing
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return res.status(404).json({ error: `Endpoint de API '${req.method} ${url}' não encontrado.` });
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: `Endpoint de API '${req.method} ${req.originalUrl}' não encontrado.` });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[SpacePay] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[SpacePay] Erro ao iniciar servidor:', err);
  process.exit(1);
});
