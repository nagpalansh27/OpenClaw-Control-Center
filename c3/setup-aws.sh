#!/bin/bash
# C3 OpenClaw AWS Setup Script
# Run this on the EC2 instance after uploading the project

set -e
echo "🚀 Setting up C3 OpenClaw on AWS..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools for better-sqlite3
sudo apt install -y build-essential python3

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Create project directories
mkdir -p ~/openclaw/data ~/openclaw/logs

# Copy project files (already uploaded via SCP)
cd ~/openclaw

# Install dependencies
npm install

# Install server dependencies
npm install express better-sqlite3

# Build the Vite frontend
npm run build

# Configure Nginx
sudo tee /etc/nginx/sites-available/c3 > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/c3 /etc/nginx/sites-enabled/c3
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash

echo ""
echo "✅ C3 OpenClaw deployed!"
echo "📊 Dashboard: http://$(curl -s ifconfig.me)"
echo "🤖 Agent scheduler running (first task in 2 min)"
echo "📋 Logs: pm2 logs c3-server"
echo "📈 Monitor: pm2 monit"
