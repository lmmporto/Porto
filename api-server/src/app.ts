import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { CONFIG } from './config.js';
import { checkIfAdmin } from './utils/auth.js';
import sdrRegistryRouter from './routes/sdr-registro.js';
import callsRouter from './routes/calls.js';
import statsRouter from './routes/stats.js';

const app: Express = express();
const isDev = process.env.NODE_ENV === 'development';

app.set('trust proxy', 1);

// --- 1. CORS DINÂMICO ---
const allowedOrigins = ['https://sdr-pjt.vercel.app', 'http://localhost:3001', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Cache-Control', 'X-Requested-With', 'Pragma'],
  exposedHeaders: ['set-cookie']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- 2. CONFIGURAÇÃO DE SESSÃO ---
app.use(
  session({
    name: 'sdr.sid',
    secret: CONFIG.SESSION_SECRET as string, // 🚩 Tipagem garantida
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

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

// --- 3. AUTENTICAÇÃO HÍBRIDA (MOCK PARA DESENVOLVIMENTO) ---
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

// --- 4. GOOGLE STRATEGY ---
passport.use(new GoogleStrategy({
    clientID: CONFIG.GOOGLE_CLIENT_ID as string,         // 🚩 Tipagem garantida
    clientSecret: CONFIG.GOOGLE_CLIENT_SECRET as string, // 🚩 Tipagem garantida
    callbackURL: CONFIG.GOOGLE_CALLBACK_URL as string,   // 🚩 Tipagem garantida
  },
  async (_accessToken: string, _refreshToken: string, profile: Profile, done: (err: any, user?: any) => void) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(null, false);
      return done(null, { 
        id: profile.id, 
        email, 
        name: profile.displayName || email, 
        picture: profile.photos?.[0]?.value 
      });
    } catch (error) {
      return done(error);
    }
  }
));

// --- 5. ROTAS ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: `${CONFIG.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    req.session.save(() => res.redirect(`${CONFIG.FRONTEND_URL}/dashboard`));
  }
);

app.get('/auth/me', async (req: any, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const isAdmin = await checkIfAdmin(req.user.email);
    return res.json({ authenticated: true, user: req.user, isAdmin });
  }
  return res.status(401).json({ authenticated: false });
});

app.post('/auth/logout', (req: any, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('sdr.sid', { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ success: true });
    });
  });
});

app.use('/api/calls', callsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/sdr-registry', sdrRegistryRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 [SERVER ERROR]:', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

export default app;