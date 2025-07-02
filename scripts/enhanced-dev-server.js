#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

console.log('🚀 Starting Enhanced Flash Audit Development Environment...\n');

// Enhanced logging with colors and timestamps
const log = {
  info: (msg) => console.log(`\x1b[36m[${new Date().toLocaleTimeString()}] ℹ️  ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m[${new Date().toLocaleTimeString()}] ✅ ${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m[${new Date().toLocaleTimeString()}] ⚠️  ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m[${new Date().toLocaleTimeString()}] ❌ ${msg}\x1b[0m`),
  api: (msg) => console.log(`\x1b[35m[${new Date().toLocaleTimeString()}] 🔌 API: ${msg}\x1b[0m`),
  frontend: (msg) => console.log(`\x1b[34m[${new Date().toLocaleTimeString()}] 🎨 Frontend: ${msg}\x1b[0m`)
};

// Configuration
const config = {
  frontend: {
    port: 5174,
    dir: './frontend',
    command: 'npm run dev'
  },
  api: {
    port: 3001,
    dir: './api',
    command: 'npm run dev'
  },
  proxy: {
    port: 8080
  }
};

// Process management
const processes = new Map();

// Enhanced process spawner with better error handling
function spawnProcess(name, command, cwd, options = {}) {
  log.info(`Starting ${name}...`);
  
  const [cmd, ...args] = command.split(' ');
  const child = spawn(cmd, args, {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    ...options
  });

  processes.set(name, child);

  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      if (name === 'Frontend') {
        log.frontend(output);
      } else if (name === 'API') {
        log.api(output);
      } else {
        log.info(`${name}: ${output}`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('ExperimentalWarning')) {
      log.warning(`${name}: ${output}`);
    }
  });

  child.on('close', (code) => {
    if (code !== 0) {
      log.error(`${name} exited with code ${code}`);
    } else {
      log.info(`${name} stopped gracefully`);
    }
    processes.delete(name);
  });

  child.on('error', (err) => {
    log.error(`${name} error: ${err.message}`);
  });

  return child;
}

// Enhanced file watcher with intelligent reloading
function setupFileWatcher() {
  log.info('Setting up enhanced file watcher...');

  // Watch API files for changes
  const apiWatcher = chokidar.watch('./api/**/*.js', {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
  });

  apiWatcher.on('change', (filePath) => {
    log.api(`File changed: ${filePath}`);
    log.api('Restarting API server...');
    
    const apiProcess = processes.get('API');
    if (apiProcess) {
      apiProcess.kill();
      setTimeout(() => {
        spawnProcess('API', config.api.command, config.api.dir);
      }, 1000);
    }
  });

  // Watch environment files
  const envWatcher = chokidar.watch(['.env*', 'frontend/.env*', 'api/.env*'], {
    persistent: true,
    ignoreInitial: true
  });

  envWatcher.on('change', (filePath) => {
    log.warning(`Environment file changed: ${filePath}`);
    log.warning('Consider restarting the development server for changes to take effect');
  });

  // Watch configuration files
  const configWatcher = chokidar.watch(['package.json', 'vercel.json', 'frontend/package.json', 'api/package.json'], {
    persistent: true,
    ignoreInitial: true
  });

  configWatcher.on('change', (filePath) => {
    log.warning(`Configuration file changed: ${filePath}`);
    log.warning('You may need to restart the development server');
  });

  log.success('File watchers initialized');
}

// Health check system
async function performHealthChecks() {
  log.info('Performing health checks...');

  const checks = [
    {
      name: 'Frontend Dependencies',
      check: () => fs.existsSync('./frontend/node_modules')
    },
    {
      name: 'API Dependencies', 
      check: () => fs.existsSync('./api/node_modules')
    },
    {
      name: 'Environment Files',
      check: () => fs.existsSync('./frontend/.env') || fs.existsSync('./api/.env')
    },
    {
      name: 'Vercel Configuration',
      check: () => fs.existsSync('./vercel.json')
    }
  ];

  let allPassed = true;
  for (const check of checks) {
    const passed = check.check();
    if (passed) {
      log.success(`✓ ${check.name}`);
    } else {
      log.error(`✗ ${check.name}`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    log.warning('Some health checks failed. The development server may not work correctly.');
  }

  return allPassed;
}

// Enhanced startup sequence
async function startDevelopmentEnvironment() {
  try {
    // Perform health checks
    await performHealthChecks();

    // Setup file watchers
    setupFileWatcher();

    // Start API server
    if (fs.existsSync(config.api.dir)) {
      spawnProcess('API', config.api.command, config.api.dir);
      log.success('API server starting...');
    } else {
      log.warning('API directory not found, skipping API server');
    }

    // Start frontend server
    if (fs.existsSync(config.frontend.dir)) {
      spawnProcess('Frontend', config.frontend.command, config.frontend.dir);
      log.success('Frontend server starting...');
    } else {
      log.warning('Frontend directory not found, skipping frontend server');
    }

    // Display startup information
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      log.success('🎉 Enhanced Development Environment Ready!');
      console.log('='.repeat(60));
      console.log(`🎨 Frontend: http://localhost:${config.frontend.port}`);
      console.log(`🔌 API: http://localhost:${config.api.port}`);
      console.log(`📊 Health: http://localhost:${config.api.port}/api/health`);
      console.log(`🔍 Status: http://localhost:${config.api.port}/api/functions/v1/status`);
      console.log('='.repeat(60));
      console.log('💡 Features:');
      console.log('  • Hot reloading for API changes');
      console.log('  • Environment file monitoring');
      console.log('  • Configuration change detection');
      console.log('  • Enhanced logging with timestamps');
      console.log('  • Health check system');
      console.log('='.repeat(60));
      console.log('🛠️  Press Ctrl+C to stop all servers\n');
    }, 3000);

  } catch (error) {
    log.error(`Failed to start development environment: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
function setupGracefulShutdown() {
  const shutdown = () => {
    log.info('Shutting down development environment...');
    
    for (const [name, process] of processes) {
      log.info(`Stopping ${name}...`);
      process.kill('SIGTERM');
    }

    setTimeout(() => {
      log.success('Development environment stopped');
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGQUIT', shutdown);
}

// Main execution
async function main() {
  setupGracefulShutdown();
  await startDevelopmentEnvironment();
}

// Check if required dependencies are available
const requiredDeps = ['chokidar'];
const missingDeps = requiredDeps.filter(dep => {
  try {
    require.resolve(dep);
    return false;
  } catch {
    return true;
  }
});

if (missingDeps.length > 0) {
  log.warning(`Missing dependencies: ${missingDeps.join(', ')}`);
  log.info('Installing missing dependencies...');
  
  exec(`npm install ${missingDeps.join(' ')}`, (error) => {
    if (error) {
      log.error(`Failed to install dependencies: ${error.message}`);
      log.info('Falling back to basic development server...');
      // Fallback to basic server
      spawnProcess('Frontend', config.frontend.command, config.frontend.dir);
    } else {
      log.success('Dependencies installed successfully');
      main();
    }
  });
} else {
  main();
}
