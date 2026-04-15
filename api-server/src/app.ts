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
  if (!value) {
    throw new Error(`Missing required config: ${key}`);
  }

  return value;
}

const app: Express = express();
const isDev = process.env.NODE_ENV === 'development';

app.set('trust proxy', 1);

app.use(
  cors({
    origin: ['https://sdr-pjt.vercel.app', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
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
      maxAge: 86400000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

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
      req.isAuthenticated = () => true;
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
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (err: unknown, user?: Express.User | false) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(null, false);
        }

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
  (req: Request, res: Response) => {
    req.session.save(() => res.redirect(`${CONFIG.FRONTEND_URL}/dashboard`));
  }
);

app.get('/auth/me', async (req: Request, res: Response) => {
  if (req.isAuthenticated?.() && req.user) {
    const isAdmin = await checkIfAdmin(req.user.email);
    return res.json({ authenticated: true, user: req.user, isAdmin });
  }

  return res.status(401).json({ authenticated: false });
});

app.post('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((logoutError) => {
    if (logoutError) {
      next(logoutError);
      return;
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        next(sessionError);
        return;
      }

      res.clearCookie('sdr.sid', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      res.json({ success: true });
    });
  });
});

app.use('/api/calls', callsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/sdr-registry', sdrRegistryRouter);
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.use((err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]:', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

export default app;
