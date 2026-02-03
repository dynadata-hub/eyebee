#!/bin/bash
set -e

# Make all operations non-interactive
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

echo "=================================================="
echo "🚀 EyeBee Server Setup Script"
echo "=================================================="
echo ""

# Variables
DOMAIN="164.92.212.133"
APP_DIR="/opt/eyebee"
GITHUB_REPO="https://github.com/dynadata-hub/eyebee.git"

echo "📦 Step 1/7: Updating system packages..."
apt-get update
apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

echo ""
echo "🔧 Step 2/7: Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

echo ""
echo "🐳 Step 3/7: Installing Docker..."
# Remove old Docker versions
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo ""
echo "✅ Docker installed successfully!"
docker --version
docker compose version

echo ""
echo "🔒 Step 4/7: Configuring firewall..."
# Configure UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow WebRTC signaling
ufw allow 5000/tcp

# Allow WebRTC media (UDP range)
ufw allow 10000:20000/udp

# Enable firewall
ufw --force enable

echo ""
echo "✅ Firewall configured!"
ufw status

echo ""
echo "📁 Step 5/7: Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

echo ""
echo "📥 Step 6/7: Cloning repository from GitHub..."
git clone $GITHUB_REPO .

# Set proper ownership
chown -R algol:algol $APP_DIR

echo ""
echo "🔑 Step 7/7: Configuring environment..."

# Create secrets directory
mkdir -p secrets

echo ""
echo "=================================================="
echo "⚠️  PASO MANUAL REQUERIDO"
echo "=================================================="
echo ""
echo "Ahora necesitas copiar el archivo de credenciales de Firebase."
echo ""
echo "Desde TU MÁQUINA LOCAL, ejecuta:"
echo ""
echo "scp secrets/firebase-credentials.json algol@164.92.212.133:/opt/eyebee/secrets/"
echo ""
echo "Después de copiar el archivo, presiona ENTER para continuar..."
read -p ""

# Verify credentials exist
if [ ! -f "secrets/firebase-credentials.json" ]; then
    echo ""
    echo "❌ Error: Firebase credentials not found in secrets/"
    echo ""
    echo "Por favor copia el archivo y ejecuta el siguiente comando:"
    echo ""
    echo "cd /opt/eyebee && bash -c 'bash setup-docker-compose.sh'"
    echo ""
    exit 1
fi

echo ""
echo "✅ Firebase credentials found!"

# Create setup-docker-compose.sh script for next step
cat > setup-docker-compose.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "🏗️  Creating production docker-compose.yml..."

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy:alpine
    container_name: nginx-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./nginx/vhost.d:/etc/nginx/vhost.d
      - ./nginx/html:/usr/share/nginx/html
    networks:
      - eyebee

  webrtc-sessions:
    image: node:20-alpine
    container_name: webrtc-sessions
    restart: always
    working_dir: /app
    volumes:
      - ./webrtc_sessions:/app
      - ./secrets:/app/secrets:ro
    environment:
      - NODE_ENV=production
      - PORT=5000
      - SERVICE_NAME=webrtc_sessions
      - FIREBASE_CREDENTIALS_PATH=/app/secrets/firebase-credentials.json
      - FIREBASE_PROJECT_ID=eyebee-718a0
      - FIREBASE_STORAGE_BUCKET=eyebee-718a0.appspot.com
      - LOG_LEVEL=info
      - VIRTUAL_HOST=api.164.92.212.133.nip.io
      - VIRTUAL_PORT=5000
    command: sh -c "npm ci --only=production && node index.js"
    expose:
      - "5000"
    networks:
      - eyebee
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  speed-test:
    image: node:20-alpine
    container_name: speed-test
    restart: always
    working_dir: /app
    volumes:
      - ./speed_test_server:/app
    environment:
      - PORT=5100
      - SERVICE_NAME=speed_test_server
    command: sh -c "npm ci --only=production && node index.js"
    expose:
      - "5100"
    networks:
      - eyebee

  web-app:
    image: nginx:alpine
    container_name: eyebee-web
    restart: always
    volumes:
      - ./eyebee_web_app/build:/usr/share/nginx/html:ro
    environment:
      - VIRTUAL_HOST=164.92.212.133
      - VIRTUAL_PORT=80
    expose:
      - "80"
    networks:
      - eyebee
    depends_on:
      - webrtc-sessions

networks:
  eyebee:
    driver: bridge
EOF

echo ""
echo "📦 Installing backend dependencies..."
cd webrtc_sessions
npm ci --only=production
cd ..

echo ""
echo "🏗️  Building frontend..."
cd eyebee_web_app
npm install
CI=false npm run build
cd ..

echo ""
echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "=================================================="
echo "✅ Installation Complete!"
echo "=================================================="
echo ""
echo "📊 Service Status:"
docker compose ps
echo ""
echo "🌐 Your application URLs:"
echo "   Frontend:  http://164.92.212.133"
echo "   API:       http://164.92.212.133:5000"
echo "   Health:    http://164.92.212.133:5000/health"
echo ""
echo "🔍 Check health endpoint:"
curl -s http://localhost:5000/health | head -20
echo ""
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   View API logs:    docker compose logs -f webrtc-sessions"
echo "   Restart all:      docker compose restart"
echo "   Restart API:      docker compose restart webrtc-sessions"
echo "   Stop all:         docker compose down"
echo "   Update code:      git pull && docker compose restart"
echo ""
echo "=================================================="
EOFSCRIPT

chmod +x setup-docker-compose.sh

echo ""
echo "=================================================="
echo "✅ Server Setup Complete!"
echo "=================================================="
echo ""
echo "Siguiente paso: Ejecuta el script de Docker Compose:"
echo ""
echo "  cd /opt/eyebee && ./setup-docker-compose.sh"
echo ""
echo "=================================================="
