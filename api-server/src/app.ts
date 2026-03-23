import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import router from './routes/index.js';
import { CONFIG } from './config.js';
// Importação da função de processamento (ajustada para ESM)
import { processCall } from './services/processCall.js';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const app: Express = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: CONFIG.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

if (!CONFIG.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required.');
}

if (!CONFIG.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID environment variable is required.');
}

if (!CONFIG.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET environment variable is required.');
}

if (!CONFIG.GOOGLE_CALLBACK_URL) {
  throw new Error('GOOGLE_CALLBACK_URL environment variable is required.');
}

if (!CONFIG.ALLOWED_EMAIL_DOMAIN) {
  throw new Error('ALLOWED_EMAIL_DOMAIN environment variable is required.');
}

if (!CONFIG.FRONTEND_URL) {
  throw new Error('FRONTEND_URL environment variable is required.');
}

app.use(
  session({
    name: 'sdr.sid',
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: CONFIG.NODE_ENV === 'production',
      sameSite: CONFIG.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: CONFIG.GOOGLE_CLIENT_ID,
      clientSecret: CONFIG.GOOGLE_CLIENT_SECRET,
      callbackURL: CONFIG.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        console.log('[GOOGLE AUTH] profile recebido', {
          id: profile.id,
          displayName: profile.displayName,
          email,
        });

        if (!email) {
          return done(new Error('Google não retornou e-mail.'));
        }

        const emailDomain = email.split('@')[1]?.toLowerCase();
        const allowedDomain = CONFIG.ALLOWED_EMAIL_DOMAIN.toLowerCase();

        if (emailDomain !== allowedDomain) {
          return done(null, false, { message: 'Domínio não autorizado.' });
        }

        const user: AuthUser = {
          id: profile.id,
          email,
          name: profile.displayName || email,
          picture: profile.photos?.[0]?.value,
        };

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

app.use('/auth', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

function healthHandler(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    version: 'MONOLITHIC-DEBUG-V1',
    timestamp: new Date().toISOString(),
  });
}

app.get('/', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/health', healthHandler);
app.get('/api/healthz', healthHandler);

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
    prompt: 'select_account',
    hd: CONFIG.ALLOWED_EMAIL_DOMAIN,
  })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${CONFIG.FRONTEND_URL}/login?error=google_auth_failed`,
    session: true,
  }),
  (_req, res) => {
    res.redirect(`${CONFIG.FRONTEND_URL}/dashboard`);
  }
);

app.get('/auth/me', (req: any, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.status(200).json({
      authenticated: true,
      user: req.user,
    });
  }
  return res.status(401).json({ authenticated: false });
});

app.post('/auth/logout', (req: any, res: Response) => {
  req.logout((logoutErr: any) => {
    if (logoutErr) return res.status(500).json({ success: false });
    req.session.destroy(() => {
      res.clearCookie('sdr.sid');
      return res.status(200).json({ success: true });
    });
  });
});

/**
 * ROTA DE DEBUG - FORÇA BRUTA (Ignora erros de tipo do VS Code)
 */
app.get('/api/debug-reprocess/:id', async (req: any, res: any) => {
  try {
    const callId = req.params.id;
    console.log(`[DEBUG] Reprocessando call: ${callId}`);

    // @ts-ignore
    const result = await processCall(callId);

    res.json({
      message: "Processamento concluído com sucesso!",
      result
    });
  } catch (error: any) {
    console.error(`[DEBUG] Falha:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api', router);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, error: err.message });
});

export default app;