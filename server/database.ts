import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('database.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const ensureUser = (name: string, email: string, pass: string, role: string) => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
  const hashedPassword = bcrypt.hashSync(pass, 10);
  if (!existing) {
    console.log(`Seeding user: ${name} (${email})...`);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      name, email, hashedPassword, role
    );
  } else {
    // Sync name, role and PASSWORD to match the latest request
    db.prepare('UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?').run(
      name, role, hashedPassword, existing.id
    );
  }
};

// Seed users exactly as requested
ensureUser('Admin123', 'Admin123@gmail.com', 'Admin123', 'admin');
ensureUser('Staff', 'staff@example.com', 'Staff123', 'staff');

console.log('Database initialized and seeded.');

export default db;
