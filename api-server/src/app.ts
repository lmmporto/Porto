import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import router from './routes/index.js';

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

function healthHandler(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    version: 'MONOLITHIC-NO-ROLE-V1',
    timestamp: new Date().toISOString(),
  });
}

app.get('/health', healthHandler);
app.get('/api/healthz', healthHandler);

app.use('/api', router);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', new Date().toISOString(), err.message);
  res.status(500).json({ success: false, error: err.message });
});

export default app;
