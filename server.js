import { createServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  
  console.log("Installing Python dependencies...");
  await new Promise((resolve, reject) => {
    // Adding uv / pip command here
    const p = spawn(pythonCmd, ['-m', 'pip', 'install', '-r', 'requirements.txt'], { 
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit' 
    });
    p.on('error', (err) => {
      console.error("CRITICAL ERROR: Python executable not found or error spawning pip.");
      console.error("Ensure Python 3 is installed and in your PATH.");
      console.error("System error message: ", err.message);
      resolve(false);
    });
    p.on('close', (code) => {
      if (code === 0) {
        console.log("Python dependencies installed successfully.");
        resolve(true);
      }
      else {
        console.error(`pip install failed with code ${code}. Check the output above for errors.`);
        resolve(false);
      }
    });
  });

  console.log("Starting Python FastAPI Server...");
  const pythonServer = spawn(pythonCmd, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
  });

  pythonServer.on('error', (err) => {
    console.error("CRITICAL ERROR: Python Server failed to start.");
    console.error("Error message:", err.message);
    if (err.code === 'ENOENT') {
      console.error("The python command was not found. Please install Python 3.");
    }
  });

  pythonServer.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Python server crashed or exited with error code ${code}`);
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  const PORT = 3000;

  if (isProd) {
    const app = express();
    const distPath = path.join(__dirname, 'dist');
    
    // In production we just serve the frontend statically,
    // and rely on a reverse proxy or same node server for /api.
    // We proxy /api to the python server
    const { createProxyMiddleware } = await import('http-proxy-middleware');
    app.use('/api', createProxyMiddleware({ target: 'http://127.0.0.1:8000', changeOrigin: true }));

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Production server running on port ${PORT}`);
    });
  } else {
    // In dev mode, we start Vite's dev server locally
    console.log("Starting Vite Server...");
    const viteServer = await createServer({
      root: __dirname,
      server: { host: '0.0.0.0', port: PORT }
    });
    await viteServer.listen();
    viteServer.printUrls();
  }
}

start().catch(console.error);
