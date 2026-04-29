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
    const p = spawn(pythonCmd, ['-m', 'pip', 'install', '-r', 'requirements.txt'], { 
      cwd: path.join(__dirname, 'django_backend'),
      stdio: 'inherit' 
    });
    p.on('error', (err) => {
      console.warn("Python executable not found or error spawning: ", err.message);
      resolve(false);
    });
    p.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`pip install failed with code ${code}`));
    });
  });

  console.log("Running Django migrations...");
  await new Promise((resolve) => {
    const p = spawn(pythonCmd, ['manage.py', 'migrate'], {
      cwd: path.join(__dirname, 'django_backend'),
      stdio: 'inherit'
    });
    p.on('close', () => resolve(true));
  });

  console.log("Seeding initial users...");
  await new Promise((resolve) => {
    const p = spawn(pythonCmd, ['seed_users.py'], {
      cwd: path.join(__dirname, 'django_backend'),
      stdio: 'inherit'
    });
    p.on('close', () => resolve(true));
  });

  console.log("Starting Django Server...");
  const pythonServer = spawn(pythonCmd, ['manage.py', 'runserver', '127.0.0.1:8000', '--noreload'], {
    cwd: path.join(__dirname, 'django_backend'),
    stdio: 'inherit'
  });

  pythonServer.on('error', (err) => {
    console.error("Python Server failed to start:", err.message);
  });

  pythonServer.on('close', (code) => {
    console.log(`Python server exited with code ${code}`);
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
