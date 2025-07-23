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
      const { login, email, password } = req.body;
      const loginField = login || email;
      
      if (!loginField || !password) {
        console.log('Missing login or password');
        return res.status(400).json({ message: "Логин и пароль обязательны" });
      }

      console.log('Calling validateCredentials with:', loginField, password);
      const user = await storage.validateCredentials(loginField, password);
      
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
  const logoutHandler = (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода из системы" });
      }
      res.json({ message: "Успешный выход из системы" });
    });
  };
  
  app.post('/api/logout', logoutHandler);
  app.get('/api/logout', logoutHandler);

  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      console.log('Registration endpoint called with body:', req.body);
      const { email, login, password, firstName, lastName, role = 'client' } = req.body;
      
      if (!email || !login || !password) {
        return res.status(400).json({ message: "Email, логин и пароль обязательны" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Пользователь с таким email уже существует" });
      }

      // Create new user with plain password (no hashing as requested)
      const newUser = await storage.createUser({
        id: `${role}-${Date.now()}`,
        email,
        login,
        firstName,
        lastName,
        role: role as any,
        passwordHash: password, // Store password as plain text
        isActive: true,
      });

      // Store user in session
      (req.session as any).user = newUser;
      
      res.status(201).json({ 
        user: newUser,
        message: "Пользователь успешно зарегистрирован"
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Ошибка регистрации" });
    }
  });

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