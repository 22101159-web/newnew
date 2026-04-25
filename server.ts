import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import cors from 'cors';
import { exec, spawn } from "child_process";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- PYTHON BACKEND MANAGER ---
function startPythonBackend() {
  console.log("Setting up Python backend...");
  
  // Detect if we should use 'python' or 'python3'
  const isWindows = process.platform === "win32";
  const pythonCmd = isWindows ? "python" : "python3";

  console.log(`Using python command: ${pythonCmd}`);
  
  // Install requirements
  exec(`${pythonCmd} -m pip install -r backend/requirements.txt`, (err, stdout, stderr) => {
    if (err) {
      console.error("Failed to install Python dependencies. Ensure Python is in your PATH:", stderr);
    } else {
      console.log("Python dependencies checked/installed.");
    }
    
    // Start Uvicorn
    console.log("Starting FastAPI server...");
    const pythonProcess = spawn(pythonCmd, ["-m", "uvicorn", "backend.app.main:app", "--port", "8000", "--host", "0.0.0.0"], {
      stdio: "inherit",
      shell: isWindows // Windows needs shell for some command resolutions
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start FastAPI server:", err);
    });

    pythonProcess.on("close", (code) => {
      console.log(`FastAPI server exited with code ${code}`);
    });
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Start Python backend in background
  startPythonBackend();

  // API Proxy Middleware
  app.all("/api/*", async (req, res) => {
    try {
      const targetUrl = `http://localhost:8000${req.originalUrl}`;
      console.log(`Proxying ${req.method} ${req.originalUrl} -> ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          ...Object.fromEntries(Object.entries(req.headers).filter(([k]) => k !== 'host')),
          'Content-Type': 'application/json'
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
      });
      
      const status = response.status;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.status(status).json(data);
      } else {
        const text = await response.text();
        res.status(status).send(text);
      }
    } catch (err: any) {
      console.error("Proxy error:", err.message);
      res.status(502).json({ detail: "Backend unresponsive. Please wait for FastAPI to initialize." });
    }
  });

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
    console.log(`Manager server running on http://localhost:${PORT}`);
  });
}

startServer();
