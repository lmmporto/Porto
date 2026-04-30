import cors from 'cors';
import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import callsRouter from './routes/calls.js';
import sdrRegistryRouter from './routes/sdr-registro.js';
import statsRouter from './routes/stats.js';
import { CONFIG } from './config.js';
import { checkIfAdmin } from './utils/auth.js';
import { initializeWorkers } from './services/worker.service.js';
import helpChatRouter from './routes/help-chat.routes.js';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      picture?: string;
    }
  }
}

interface ErrorWithStatus extends Error {
  status?: number;
}

function requireConfigValue(value: string | undefined, key: string): string {
  if (!value) throw new Error(`Missing required config: ${key}`);
  return value;
}

const app: Express = express();
app.set('trust proxy', 1); //
const isDev = process.env.NODE_ENV === 'development';

app.set('trust proxy', 1);

const allowedOrigins = [
  'https://sdr-pjt.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'sdr.sid',
    secret: requireConfigValue(CONFIG.SESSION_SECRET, 'SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

// 🏛️ CORREÇÃO DA LINHA 95: Mock de Desenvolvimento
if (isDev) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const ownerEmailParam = req.query.ownerEmail;
    const impersonateEmail = typeof ownerEmailParam === 'string' ? ownerEmailParam : null;

    if (!req.user || impersonateEmail) {
      req.user = {
        id: impersonateEmail ? `simulated-${impersonateEmail}` : 'dev-user-id',
        email: impersonateEmail || 'lucas.porto@nibo.com.br',
        name: impersonateEmail ? `Simulando: ${impersonateEmail}` : 'Lucas Porto (Dev Mode)',
      };

      // Realizamos o cast para any para permitir a sobrescrita do predicado de tipo
      (req as any).isAuthenticated = () => true;
    }
    next();
  });
}

passport.use(
  new GoogleStrategy(
    {
      clientID: requireConfigValue(CONFIG.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
      clientSecret: requireConfigValue(CONFIG.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET'),
      callbackURL: requireConfigValue(CONFIG.GOOGLE_CALLBACK_URL, 'GOOGLE_CALLBACK_URL'),
    },
    async (_at, _rt, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false);

        return done(null, {
          id: profile.id,
          email,
          name: profile.displayName || email,
          picture: profile.photos?.[0]?.value,
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${CONFIG.FRONTEND_URL}/login?error=auth_failed` }),
  async (req: Request, res: Response) => {
    const userEmail = (req.user as any)?.email || '';
    const isAdmin = await checkIfAdmin(userEmail);
    const destination = isAdmin ? '/dashboard' : '/dashboard/me';
    req.session.save(() => res.redirect(`${CONFIG.FRONTEND_URL}${destination}`));
  }
);

app.get('/auth/me', async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const user = req.user;
  const isAdmin = await checkIfAdmin(user.email);

  res.set('Cache-Control', 'no-store');

  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    isAdmin
  });
});

app.post('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);

    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);

      res.clearCookie('sdr.sid', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });
      res.json({ success: true });
    });
  });
});

app.use('/api/calls', callsRouter);

app.use('/api/sdr-registry', sdrRegistryRouter);
app.use('/api/help-chat', helpChatRouter);
app.use('/api', statsRouter); // Alinhado para que /api/stats funcione diretamente
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Inicializa os workers (Cron/Retry)
initializeWorkers();

app.use((err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]:', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

export default app;