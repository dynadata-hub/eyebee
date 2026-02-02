#!/bin/bash
set -e

# Deployment script for eyebee production server
# Usage: ./deploy-to-production.sh [server-ip] [ssh-user]

SERVER_IP="${1:-164.92.212.133}"
SSH_USER="${2:-algol}"
DEPLOY_DIR="/opt/eyebee"
REPO_URL="git@github.com:your-org/eyebee.git"  # Update this with your actual repo URL

echo "🚀 Deploying eyebee to production server..."
echo "   Server: $SSH_USER@$SERVER_IP"
echo "   Deploy directory: $DEPLOY_DIR"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we can connect to the server
echo "🔍 Checking SSH connection..."
if ! ssh -o ConnectTimeout=5 "$SSH_USER@$SERVER_IP" "echo 'SSH connection successful'" &>/dev/null; then
    echo -e "${RED}❌ Error: Cannot connect to $SSH_USER@$SERVER_IP${NC}"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"
echo ""

# Create backup on server
echo "📦 Creating backup on server..."
ssh "$SSH_USER@$SERVER_IP" << 'ENDSSH'
    cd /opt/eyebee
    BACKUP_DIR="/tmp/eyebee-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup current docker-compose and .env files
    if [ -f docker-compose.yml ]; then
        cp docker-compose.yml "$BACKUP_DIR/"
    fi
    if [ -f .env ]; then
        cp .env "$BACKUP_DIR/"
    fi
    
    echo "Backup created in: $BACKUP_DIR"
ENDSSH
echo ""

# Option 1: Deploy via git pull (recommended)
echo "📥 Deploying via git..."
read -p "Do you want to deploy via git pull? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh "$SSH_USER@$SERVER_IP" << 'ENDSSH'
        cd /opt/eyebee
        
        # Pull latest changes
        echo "Pulling latest changes from git..."
        git fetch origin
        git pull origin main
        
        # Copy production docker-compose if it doesn't exist
        if [ ! -f docker-compose.yml ]; then
            echo "Creating docker-compose.yml from production template..."
            cp docker-compose.production.yml docker-compose.yml
        fi
        
        # Copy .env if it doesn't exist
        if [ ! -f .env ]; then
            echo "Creating .env from example..."
            cp .env.production.example .env
            echo "⚠️  Please edit /opt/eyebee/.env with your actual values"
        fi
ENDSSH
else
    # Option 2: Deploy via rsync
    echo "📤 Deploying via rsync..."
    
    # Files to sync
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'secrets' \
        --exclude '.env' \
        docker-compose.production.yml \
        .env.production.example \
        webrtc_sessions/ \
        speed_test_server/ \
        eyebee_web_app/ \
        "$SSH_USER@$SERVER_IP:$DEPLOY_DIR/"
    
    # Rename files on server
    ssh "$SSH_USER@$SERVER_IP" << 'ENDSSH'
        cd /opt/eyebee
        
        if [ ! -f docker-compose.yml ]; then
            mv docker-compose.production.yml docker-compose.yml
        fi
        
        if [ ! -f .env ]; then
            cp .env.production.example .env
            echo "⚠️  Please edit /opt/eyebee/.env with your actual values"
        fi
ENDSSH
fi

echo ""
echo "🔧 Setting up production environment..."

# Setup on server
ssh "$SSH_USER@$SERVER_IP" << 'ENDSSH'
    cd /opt/eyebee
    
    # Fix permissions
    echo "Fixing permissions..."
    if [ -d webrtc_sessions/node_modules ]; then
        sudo chown -R $USER:$USER webrtc_sessions/node_modules
    fi
    
    if [ -d speed_test_server/node_modules ]; then
        sudo chown -R $USER:$USER speed_test_server/node_modules
    fi
    
    # Generate package-lock.json if needed
    if [ ! -f speed_test_server/package-lock.json ]; then
        echo "Generating package-lock.json for speed_test_server..."
        cd speed_test_server
        npm install
        cd ..
    fi
    
    # Create necessary directories
    mkdir -p nginx/vhost.d nginx/html nginx/certs nginx/acme
    
    echo "✅ Setup complete"
ENDSSH

echo ""
echo "🐳 Restarting Docker containers..."

ssh "$SSH_USER@$SERVER_IP" << 'ENDSSH'
    cd /opt/eyebee
    
    # Stop old containers
    docker compose down
    
    # Pull latest images
    docker compose pull
    
    # Start containers
    docker compose up -d
    
    echo ""
    echo "Waiting for containers to start..."
    sleep 10
    
    # Show container status
    docker compose ps
ENDSSH

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🌐 Your services should be available at:"
echo "   • Main app: https://live.eyebee.com"
echo "   • API: https://api.live.eyebee.com"
echo "   • Speed test: https://speedtest.live.eyebee.com"
echo ""
echo "⚠️  Note: SSL certificates may take a few minutes to provision"
echo ""
echo "📋 Useful commands:"
echo "   ssh $SSH_USER@$SERVER_IP 'cd /opt/eyebee && docker compose logs -f'"
echo "   ssh $SSH_USER@$SERVER_IP 'cd /opt/eyebee && docker compose ps'"
echo "   ssh $SSH_USER@$SERVER_IP 'cd /opt/eyebee && docker compose restart'"
echo ""
