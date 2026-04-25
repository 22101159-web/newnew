import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './server/database.ts';
import { generateToken, authenticateToken, isAdmin } from './server/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- API ROUTES ---

  // Auth: Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    const identifier = username;

    try {
      // Allow login by email OR name
      const user = db.prepare('SELECT * FROM users WHERE email = ? OR name = ?').get(identifier, identifier) as any;
      
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ detail: "Incorrect email or password" });
      }

      const token = generateToken(user);
      res.json({ access_token: token, token_type: "bearer" });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ detail: "Internal server error" });
    }
  });

  // Auth: Register (Protected: Only Admin can add users/staff)
  app.post("/api/auth/register", authenticateToken, isAdmin, (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    console.log(`Registration attempt by admin. Payload:`, { name, email, role, passwordLength: password?.length });
    
    if (!name || !email || !password) {
      console.warn('Registration failed: Missing fields');
      return res.status(400).json({ detail: "Missing required fields (name, email, password)" });
    }

    try {
      const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (exists) {
        console.warn(`Registration failed: User ${email} already exists`);
        return res.status(400).json({ detail: "Username or Email already exists" });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
        name, email, hashedPassword, role || 'staff'
      );

      console.log('Insert result:', result);

      if (!result.lastInsertRowid) {
        throw new Error("Failed to retrieve last insert row ID");
      }

      const newUser = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(result.lastInsertRowid);
      console.log(`Registration successful for: ${email}`);
      res.json(newUser);
    } catch (err: any) {
      console.error("Registration error details:", err.message, err.stack);
      res.status(500).json({ detail: "Failed to register user. System error." });
    }
  });

  // Users: Me
  app.get("/api/users/me", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user;
    const dbUser = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(user.id);
    if (!dbUser) return res.status(404).json({ detail: "User not found" });
    res.json(dbUser);
  });

  // Users: List (Admin only)
  app.get("/api/users", authenticateToken, isAdmin, (req: Request, res: Response) => {
    const users = db.prepare('SELECT id, name, email, role, createdAt FROM users').all();
    console.log(`Fetching user list for admin: ${users.length} users found`);
    res.json(users);
  });

  // Users: Update (Admin only)
  app.put("/api/users/:id", authenticateToken, isAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    try {
      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      if (!existing) return res.status(404).json({ detail: "User not found" });

      let sql = 'UPDATE users SET name = ?, email = ?, role = ?';
      const params = [name || existing.name, email || existing.email, role || existing.role];

      if (password) {
        sql += ', password = ?';
        params.push(bcrypt.hashSync(password, 10));
      }

      sql += ' WHERE id = ?';
      params.push(id);

      db.prepare(sql).run(...params);
      const updated = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ detail: "Update failed" });
    }
  });

  // Users: Delete (Admin only)
  app.delete("/api/users/:id", authenticateToken, isAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ detail: "Delete failed" });
    }
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
