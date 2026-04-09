import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { CONFIG } from './config.js';
import { processCall } from './services/processCall.js';
import sdrRegistryRouter from './routes/sdr-registro.js';
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
const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// 🚩 Configuração vital para proxies (Render/Heroku/Cloudflare)
app.set('trust proxy', 1);

// 🚩 AJUSTE DE CORS: Suporte a múltiplos ambientes
app.use(
  cors({
    origin: [
      'http://localhost:3001',      // Seu Front local (porta 3001)
      'http://localhost:3000',      // Seu Front local (porta 3000)
      'https://sdr-pjt.vercel.app'  // Seu Front produção
    ],
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

// --- 1. CONFIGURAÇÃO DE SESSÃO DINÂMICA (COOKIES) ---
app.use(
  session({
    name: 'sdr.sid',
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: isProduction, 
      sameSite: isProduction ? 'none' : 'lax', 
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- 2. AUTENTICAÇÃO HÍBRIDA (MOCK COM PRIORIDADE DE SIMULAÇÃO) ---
if (isDev) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 🚩 PRIORIDADE: Se o front mandar um e-mail via query, ele manda no sistema
    const impersonateEmail = req.query.ownerEmail as string;

    if (impersonateEmail && impersonateEmail.includes('@')) {
      (req as any).user = { 
        id: `simulated-${impersonateEmail}`,
        email: impersonateEmail, 
        name: `Simulando: ${impersonateEmail}` 
      };
      console.log(`🛠️ [DEV AUTH]: Agindo como SDR Simulado: ${impersonateEmail}`);
    } else if (!req.user) {
      // Fallback padrão para você não precisar logar localmente
      (req as any).user = { 
        id: 'dev-user-id',
        email: 'lucas.porto@nibo.com.br', 
        name: 'Lucas Porto (Dev Mode)' 
      };
      console.log("🛠️ [DEV AUTH]: Usuário Admin Mock injetado.");
    }
    
    (req as any).isAuthenticated = () => true;
    next();
  });
}

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
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
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