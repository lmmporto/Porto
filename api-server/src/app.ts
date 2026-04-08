import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { CONFIG } from './config.js';
import { processCall } from './services/processCall.js';
import sdrRegistryRouter from './routes/sdr-registro.js'; // Verifique o nome exato do arquivo
import callsRouter from './routes/calls.js';
import statsRouter from './routes/stats.js';
import healthRouter from './routes/health.js';

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

// 🚩 Configuração vital para proxies (Render/Heroku/Cloudflare)
app.set('trust proxy', 1);

app.use(
  cors({
    origin: CONFIG.FRONTEND_URL, // 🚩 Certifique-se que não tem "/" no final no .env
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

if (!CONFIG.SESSION_SECRET || !CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_CLIENT_SECRET || !CONFIG.GOOGLE_CALLBACK_URL || !CONFIG.ALLOWED_EMAIL_DOMAIN || !CONFIG.FRONTEND_URL) {
  throw new Error('Variáveis de ambiente de configuração (Auth/URL) faltando.');
}

// --- CONFIGURAÇÃO DE SESSÃO BLINDADA PARA CROSS-ORIGIN ---
app.use(
  session({
    name: 'sdr.sid',
    secret: CONFIG.SESSION_SECRET,
    resave: false, // 🚩 Recomendado: evita salvar sessões sem alteração
    saveUninitialized: false,
    rolling: true,
    proxy: true, // 🚩 Informa ao session que ele está atrás de um proxy
    cookie: {
      httpOnly: true,
      secure: true, // 🚩 Obrigatório para sameSite: 'none'
      sameSite: 'none', // 🚩 Permite envio de cookies entre domínios diferentes (Vercel -> Render)
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
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
        if (!email) return done(new Error('Google não retornou e-mail.'));

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

// --- ROTAS DE AUTENTICAÇÃO ---

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
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

app.get('/auth/me', async (req: any, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    try {
      const userEmail = req.user.email;
      const { db } = await import('./firebase.js');
      const doc = await db.collection("configuracoes").doc("gerais").get();
      const admins = doc.data()?.admins || [];
      const isAdmin = admins.includes(userEmail);

      return res.status(200).json({
        authenticated: true,
        user: req.user,
        isAdmin: isAdmin
      });
    } catch (error) {
      return res.status(200).json({ authenticated: true, user: req.user, isAdmin: false });
    }
  }
  return res.status(401).json({ authenticated: false });
});

app.post('/auth/logout', (req: any, res: Response) => {
  req.logout((logoutErr: any) => {
    if (logoutErr) return res.status(500).json({ success: false });
    req.session.destroy(() => {
      res.clearCookie('sdr.sid', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });
      return res.status(200).json({ success: true });
    });
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/calls', callsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/sdr-registry', sdrRegistryRouter); 
app.use('/api/health', healthRouter);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 [GLOBAL ERROR HANDLER]:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

export default app;