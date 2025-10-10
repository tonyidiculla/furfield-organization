# VS Code Remote Development Setup Guide

## Configuration Summary

Your VS Code is now configured to work with:
- **Local Development**: MacBook (codebase)
- **Remote Server**: 13.204.36.83 (Node.js + Supabase)

## What Was Configured

### 1. VS Code Settings (`.vscode/settings.json`)
- Remote SSH configuration for server 13.204.36.83
- Supabase environment variables
- Auto-save enabled for better sync
- Node.js debugging enabled

### 2. SSH Config (`~/.ssh/config`)
- Created SSH alias: `supabase-server`
- Configured connection settings

### 3. Debug Configuration (`.vscode/launch.json`)
- Next.js local debugging
- Remote Node.js debugging
- Full-stack debugging

### 4. Tasks (`.vscode/tasks.json`)
- Quick SSH connection to server
- Supabase status check
- Deploy to server
- Test Supabase connection

## How to Use

### Option 1: Develop Locally, Connect to Remote Supabase (Current Setup)
This is what you're already doing - works great!

```bash
# On your MacBook
npm run dev  # Runs on localhost:3000
# Uses remote Supabase at http://13.204.36.83:8000
```

### Option 2: SSH into Server for Direct Development

```bash
# Connect via terminal
ssh supabase-server

# Or use VS Code's Remote-SSH extension
# Cmd+Shift+P > "Remote-SSH: Connect to Host" > "supabase-server"
```

### Option 3: VS Code Remote-SSH (Recommended for Server Development)

1. **Install Remote-SSH Extension** (if not installed):
   - Press `Cmd+Shift+X`
   - Search for "Remote - SSH"
   - Install it

2. **Connect to Server**:
   - Press `Cmd+Shift+P`
   - Type: "Remote-SSH: Connect to Host"
   - Select: "supabase-server"
   - VS Code will open a new window connected to the server

3. **Open Project on Server**:
   - File > Open Folder
   - Navigate to your project on the server

### Quick Commands

**VS Code Command Palette (Cmd+Shift+P):**
- `Remote-SSH: Connect to Host` - Connect to server
- `Tasks: Run Task` - Run predefined tasks
- `Debug: Start Debugging` - Start debugging

**Available Tasks (Cmd+Shift+P > "Tasks: Run Task"):**
- `SSH: Connect to Supabase Server`
- `SSH: Check Supabase Status`
- `SSH: Restart Supabase Docker`
- `Test Supabase Connection`
- `Deploy to Server`

## Setting Up Node.js on Server

### 1. Install Node.js on 13.204.36.83

```bash
# Connect to server
ssh supabase-server

# Install Node.js via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18  # or latest LTS
nvm use 18

# Or via apt (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Deploy Your App to Server

```bash
# On your MacBook
npm run build

# Deploy to server (update paths as needed)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /Users/tonyidiculla/Developer/organization/ \
  supabase-server:/opt/organization/

# Or use the VS Code task: "Deploy to Server"
```

### 3. Run on Server

```bash
# SSH into server
ssh supabase-server

# Navigate to project
cd /opt/organization

# Install dependencies
npm install

# Run production build
npm run build
npm start

# Or run in development mode
npm run dev
```

### 4. Run as a Service (Production)

```bash
# On server, install PM2
npm install -g pm2

# Start your app
pm2 start npm --name "organization" -- start

# Save PM2 configuration
pm2 save

# Enable startup on boot
pm2 startup

# Check status
pm2 status
```

## Sync Workflow Options

### A. Local Development with Remote Supabase (Current)
✅ Already working - no changes needed!

### B. Develop on Server via VS Code Remote-SSH
1. Install Remote-SSH extension
2. Connect to `supabase-server`
3. Open your project folder on the server
4. Develop directly on the server

### C. Hybrid: Sync Changes to Server
```bash
# Watch for changes and auto-deploy
npm install -g nodemon
nodemon --watch src --exec "npm run build && rsync -avz .next/ supabase-server:/opt/organization/.next/"
```

## Troubleshooting

### Can't Connect via SSH
```bash
# Generate SSH key if needed
ssh-keygen -t rsa -b 4096

# Copy key to server
ssh-copy-id root@13.204.36.83
```

### VS Code Remote-SSH Not Working
1. Check SSH config: `~/.ssh/config`
2. Test connection: `ssh supabase-server`
3. Check VS Code settings for `remote.SSH.remotePlatform`

### Supabase Connection Issues
```bash
# Test connection
curl http://13.204.36.83:8000/auth/v1/settings

# Check if Supabase is running on server
ssh supabase-server 'docker ps | grep supabase'
```

## Next Steps

1. **If you want to develop on the server:**
   - Install Remote-SSH extension
   - Connect to `supabase-server`
   - Clone/copy your project to the server

2. **If you want to deploy production build:**
   - Build locally: `npm run build`
   - Deploy: Use the "Deploy to Server" task
   - Run on server with PM2

3. **For continuous deployment:**
   - Set up GitHub Actions
   - Or use `rsync` with watch mode

Your current setup already works perfectly for local development with remote Supabase! 🎉
