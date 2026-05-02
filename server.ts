import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

// --- Database Setup ---
const DB_PATH = path.join(process.cwd(), "db.json");

interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  rollNumber: string;
  department: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'upi-to-cash' | 'cash-to-upi';
  amount: number;
  totalWithFee: number;
  date: string;
}

interface LoginRecord {
  id: string;
  userId: string;
  loginTime: string;
}

interface DB {
  admins: { email: string; passwordHash: string }[];
  users: User[];
  transactions: Transaction[];
  logins: LoginRecord[];
}

function getDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    const initialDB: DB = {
      admins: [
        { 
          email: "admin@mlops-pipeline.live", 
          passwordHash: bcrypt.hashSync("admin123", 10) 
        }
      ],
      users: [],
      transactions: [],
      logins: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  if (!data.logins) data.logins = [];
  return data;
}

function saveDB(db: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// --- Server Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "sovereign-reserve-secret-key-2026";

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth: Login
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    const db = getDB();
    const admin = db.admins.find(a => a.email === email);

    if (admin && bcrypt.compareSync(password, admin.passwordHash)) {
      const token = jwt.sign({ email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, admin: { email: admin.email } });
    }

    res.status(401).json({ error: "Invalid credentials" });
  });

  // Middleware: Authenticate Admin
  const adminAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      next();
    } catch (err) {
      res.status(403).json({ error: "Invalid token" });
    }
  };

  // Dashboard Stats
  app.get("/api/admin/stats", adminAuth, (req, res) => {
    const db = getDB();
    
    // Login Statistics Calculation
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();

    const loginsToday = db.logins.filter(l => new Date(l.loginTime).getTime() >= today).length;
    const loginsThisWeek = db.logins.filter(l => new Date(l.loginTime).getTime() >= oneWeekAgo).length;
    const loginsThisMonth = db.logins.filter(l => new Date(l.loginTime).getTime() >= oneMonthAgo).length;

    // Daily logins for last 7 days chart
    const dailyLogins = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today - (6 - i) * 24 * 60 * 60 * 1000);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: db.logins.filter(l => {
          const t = new Date(l.loginTime).getTime();
          return t >= dayStart && t < dayEnd;
        }).length
      };
    });

    res.json({
      totalUsers: db.users.length,
      totalTransactions: db.transactions.length,
      totalVolume: db.transactions.reduce((acc, t) => acc + t.amount, 0),
      recentActivity: db.transactions.slice(-5).reverse(),
      loginStats: {
        today: loginsToday,
        week: loginsThisWeek,
        month: loginsThisMonth,
        chart: dailyLogins
      }
    });
  });

  // Recording User Logins
  app.post("/api/users/login-track", (req, res) => {
    const { userId } = req.body;
    const db = getDB();
    db.logins.push({
      id: Math.random().toString(36).substr(2, 9),
      userId,
      loginTime: new Date().toISOString()
    });
    saveDB(db);
    res.json({ success: true });
  });

  // Users Management
  app.get("/api/admin/users", adminAuth, (req, res) => {
    const db = getDB();
    res.json(db.users);
  });

  app.delete("/api/admin/users/:id", adminAuth, (req, res) => {
    const db = getDB();
    db.users = db.users.filter(u => u.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  app.patch("/api/admin/users/:id/status", adminAuth, (req, res) => {
    const { status } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.id === req.params.id);
    if (user) {
      user.status = status;
      saveDB(db);
      return res.json(user);
    }
    res.status(404).json({ error: "User not found" });
  });

  // Transactions Management
  app.get("/api/admin/transactions", adminAuth, (req, res) => {
    const db = getDB();
    res.json(db.transactions);
  });

  // Public: Record User (Mock for App.tsx sync)
  app.post("/api/users/sync", (req, res) => {
    const profile = req.body;
    const db = getDB();
    const existing = db.users.find(u => u.email === profile.email);
    
    if (!existing) {
      db.users.push({
        ...profile,
        id: Math.random().toString(36).substr(2, 9),
        status: 'active',
        createdAt: new Date().toISOString()
      });
      saveDB(db);
    }
    res.json({ success: true });
  });

  // Public: Record Transaction
  app.post("/api/transactions", (req, res) => {
    const transaction = req.body;
    const db = getDB();
    db.transactions.push({
      ...transaction,
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: new Date().toISOString()
    });
    saveDB(db);
    res.json({ success: true });
  });

  // --- Vite / Static Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MLOps Pipeline Server running on http://localhost:${PORT}`);
  });
}

startServer();
