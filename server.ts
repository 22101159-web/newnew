import express from "express";
import { createServer as createViteServer } from "vite";
import { spawn, execSync, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting Python Backend...");

  // Install dependencies if needed (optional, could be slow)
  try {
     console.log("Installing Python dependencies...");
     execSync("pip3 install -r backend/requirements.txt", { stdio: 'inherit' });
  } catch (err) {
     console.error("Failed to install python dependencies:", err);
  }

  // Start Python Backend
  const pythonProcess: ChildProcess = spawn("python3", [
      "-m", "uvicorn", 
      "backend.app.main:app", 
      "--port", "8000", 
      "--host", "127.0.0.1",
      "--reload"
  ]);
  
  pythonProcess.stdout?.on("data", (data) => console.log(`Python: ${data.toString()}`));
  pythonProcess.stderr?.on("data", (data) => console.error(`Python Error: ${data.toString()}`));

  // Vite middleware for development
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    pythonProcess.kill();
    process.exit();
  });

  process.on('SIGTERM', () => {
    pythonProcess.kill();
    process.exit();
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
