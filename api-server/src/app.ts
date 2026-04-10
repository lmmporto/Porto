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

// 🚩 1. CONFIGURAÇÃO VITAL PARA PROXIES (Render exige isso para cookies HTTPS)
app.set('trust proxy', true);

// 🚩 2. AJUSTE DE CORS: Suporte a múltiplos ambientes
const allowedOrigins = [
  'https://sdr-pjt.vercel.app',
  'http://localhost:3001',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como apps mobile ou curl)
    if (!origin) return callback(null, true);
    
    // Verifica se a URL está na lista oficial ou se é um preview da Vercel
    const isAllowed = allowedOrigins.includes(origin) || 
                     (origin.endsWith('.vercel.app') && origin.includes('sdr'));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🚫 [CORS REJECTED]: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie', 
    'Cache-Control', // 🚩 Resolve o erro do navegador
    'X-Requested-With',
    'Pragma'
  ],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400 // Cache de 24h para evitar requisições OPTIONS repetitivas
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

if (!CONFIG.SESSION_SECRET || !CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_CLIENT_SECRET || !CONFIG.GOOGLE_CALLBACK_URL || !CONFIG.ALLOWED_EMAIL_DOMAIN || !CONFIG.FRONTEND_URL) {
  throw new Error('Variáveis de ambiente de configuração (Auth/URL) faltando.');
}

// --- 3. CONFIGURAÇÃO DE SESSÃO DINÂMICA ---
app.use(
  session({
    name: 'sdr.sid',
    secret: CONFIG.SESSION_SECRET,
    resave: true, // 🚩 Força a persistência
    saveUninitialized: true, // 🚩 Garante que o cookie seja criado
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true, // HTTPS é obrigatório para SameSite: 'none'
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    },
  })
);

// --- 4. PASSPORT (OBRIGATORIAMENTE DEPOIS DA SESSION) ---
app.use(passport.initialize());
app.use(passport.session());

// --- 5. SERIALIZAÇÃO ---
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// --- 6. AUTENTICAÇÃO HÍBRIDA (MOCK PARA DESENVOLVIMENTO) ---
if (isDev) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const impersonateEmail = req.query.ownerEmail as string;
    if (!req.user || impersonateEmail) {
      (req as any).user = { 
        id: impersonateEmail ? `simulated-${impersonateEmail}` : 'dev-user-id',
        email: impersonateEmail || 'lucas.porto@nibo.com.br', 
        name: impersonateEmail ? `Simulando: ${impersonateEmail}` : 'Lucas Porto (Dev Mode)' 
      };
      (req as any).isAuthenticated = () => true;
    }
    next();
  });
}

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
        if (email.split('@')[1]?.toLowerCase() !== CONFIG.ALLOWED_EMAIL_DOMAIN.toLowerCase()) {
          return done(null, false, { message: 'Domínio não autorizado.' });
        }
        return done(null, { id: profile.id, email, name: profile.displayName || email, picture: profile.photos?.[0]?.value });
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// --- ROTAS ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: `${CONFIG.FRONTEND_URL}/login?error=google_auth_failed`,
    session: true,
  }),
  (req: any, res) => {
    req.session.save(() => res.redirect(`${CONFIG.FRONTEND_URL}/dashboard`));
  }
);

app.get('/auth/me', async (req: any, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    try {
      const userEmail = req.user.email;
      const { db } = await import('./firebase.js');
      const doc = await db.collection("configuracoes").doc("gerais").get();
      const admins = doc.data()?.admins || [];
      return res.status(200).json({ authenticated: true, user: req.user, isAdmin: admins.includes(userEmail) });
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
      res.clearCookie('sdr.sid', { httpOnly: true, secure: true, sameSite: 'none' });
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