const { spawn } = require('child_process');
const path = require('path');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

// Function to create formatted output
const formatOutput = (name, data) => {
  const timestamp = new Date().toLocaleTimeString();
  const lines = data.toString().trim().split('\n');
  return lines.map(line => {
    let color = colors.blue;
    if (name === 'backend') color = colors.green;
    return `${colors.bright}[${timestamp}] ${color}[${name}]${colors.reset} ${line}`;
  }).join('\n');
};

// Start backend server
console.log(`${colors.bright}${colors.green}Starting backend server...${colors.reset}`);
const backend = spawn('npm', ['start'], { 
  cwd: path.join(__dirname, 'backend'),
  shell: true 
});

// Start frontend development server
console.log(`${colors.bright}${colors.blue}Starting frontend development server...${colors.reset}`);
const frontend = spawn('npm', ['run', 'dev'], { 
  shell: true 
});

// Handle backend output
backend.stdout.on('data', (data) => {
  console.log(formatOutput('backend', data));
});

backend.stderr.on('data', (data) => {
  console.error(formatOutput('backend', data));
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  console.log(formatOutput('frontend', data));
});

frontend.stderr.on('data', (data) => {
  console.error(formatOutput('frontend', data));
});

// Handle process exit
backend.on('close', (code) => {
  console.log(`${colors.bright}${colors.red}Backend process exited with code ${code}${colors.reset}`);
});

frontend.on('close', (code) => {
  console.log(`${colors.bright}${colors.red}Frontend process exited with code ${code}${colors.reset}`);
});

// Handle main process exit (Ctrl+C)
process.on('SIGINT', () => {
  console.log(`${colors.bright}${colors.yellow}Shutting down servers...${colors.reset}`);
  backend.kill();
  frontend.kill();
});

console.log(`${colors.bright}${colors.yellow}Delivery tracking system is starting up!${colors.reset}`);
console.log(`${colors.bright}${colors.yellow}Open http://localhost:3000 in your browser${colors.reset}`); 