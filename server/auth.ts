import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'package-management-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      console.log('Login endpoint called with body:', req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ message: "Email и пароль обязательны" });
      }

      console.log('Calling validateCredentials with:', email, password);
      const user = await storage.validateCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      // Store user in session
      (req.session as any).user = user;
      
      res.json({ 
        user,
        message: "Успешный вход в систему"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Ошибка входа в систему" });
    }
  });

  // Logout endpoint (supports both GET and POST)
  const logoutHandler = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода из системы" });
      }
      res.json({ message: "Успешный выход из системы" });
    });
  };
  
  app.post('/api/logout', logoutHandler);
  app.get('/api/logout', logoutHandler);

  // Get current user endpoint
  app.get('/api/auth/user', (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req.session as any)?.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  (req as any).user = user;
  next();
};