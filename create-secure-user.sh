#!/bin/bash
set -e

echo "=================================================="
echo "🔒 Creating Secure User Setup"
echo "=================================================="
echo ""

# Variables
NEW_USER="algol"
SSH_PORT=22

echo "👤 Step 1/5: Creating user '$NEW_USER'..."
# Create user with home directory
adduser --gecos "" --disabled-password $NEW_USER

echo ""
echo "🔑 Step 2/5: Setting up SSH key for $NEW_USER..."
# Create .ssh directory for new user
mkdir -p /home/$NEW_USER/.ssh
chmod 700 /home/$NEW_USER/.ssh

# Copy authorized_keys from root
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/$NEW_USER/.ssh/authorized_keys
    chmod 600 /home/$NEW_USER/.ssh/authorized_keys
    chown -R $NEW_USER:$NEW_USER /home/$NEW_USER/.ssh
    echo "✅ SSH key copied from root"
else
    echo "⚠️  No SSH keys found in root, you'll need to add them manually"
fi

echo ""
echo "🔧 Step 3/5: Installing and configuring sudo..."
apt update
apt install -y sudo

# Add user to sudo group
usermod -aG sudo $NEW_USER

# Configure sudo to not require password for Docker commands (opcional)
echo "$NEW_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose" > /etc/sudoers.d/$NEW_USER
chmod 440 /etc/sudoers.d/$NEW_USER

echo ""
echo "🛡️  Step 4/5: Configuring SSH security..."
# Backup original sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Configure SSH
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Ensure these settings are present
grep -q "^PermitRootLogin no" /etc/ssh/sshd_config || echo "PermitRootLogin no" >> /etc/ssh/sshd_config
grep -q "^PasswordAuthentication no" /etc/ssh/sshd_config || echo "PasswordAuthentication no" >> /etc/ssh/sshd_config
grep -q "^PubkeyAuthentication yes" /etc/ssh/sshd_config || echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config

echo ""
echo "✅ SSH configured with:"
echo "   - Root login: DISABLED"
echo "   - Password authentication: DISABLED"
echo "   - Public key authentication: ENABLED"

echo ""
echo "🔐 Step 5/5: Adding user to docker group (when installed)..."
# This will work after Docker is installed
echo "# User $NEW_USER will be added to docker group after Docker installation"

echo ""
echo "=================================================="
echo "✅ Secure User Setup Complete!"
echo "=================================================="
echo ""
echo "📋 Summary:"
echo "   User created:      $NEW_USER"
echo "   Sudo access:       ✅ Yes"
echo "   SSH key:           ✅ Copied from root"
echo "   Root SSH login:    ❌ Disabled (will apply after SSH restart)"
echo "   Password login:    ❌ Disabled"
echo ""
echo "⚠️  IMPORTANTE - Antes de cerrar esta sesión:"
echo ""
echo "1. Abre una NUEVA terminal y prueba conectarte:"
echo "   ssh $NEW_USER@164.92.212.133"
echo ""
echo "2. Verifica que puedes usar sudo:"
echo "   sudo whoami"
echo "   (debe responder: root)"
echo ""
echo "3. SOLO DESPUÉS de verificar, cierra esta sesión root"
echo ""
echo "4. Para aplicar cambios SSH (opcional ahora):"
echo "   systemctl restart sshd"
echo "   (Esto deshabilitará el login de root)"
echo ""
echo "=================================================="
echo ""
echo "¿Quieres reiniciar SSH ahora para aplicar cambios?"
echo "Escribe 'yes' para reiniciar SSH (asegúrate de haber probado la conexión con $NEW_USER primero)"
echo "O presiona ENTER para hacerlo después manualmente"
read -p "Reiniciar SSH? (yes/ENTER): " RESTART_SSH

if [ "$RESTART_SSH" = "yes" ]; then
    echo ""
    echo "🔄 Restarting SSH service..."
    systemctl restart sshd
    echo "✅ SSH restarted. Root login now disabled."
    echo ""
    echo "⚠️  Esta sesión root seguirá activa, pero nuevas conexiones root fallarán."
    echo "   Usa: ssh $NEW_USER@164.92.212.133 desde ahora."
else
    echo ""
    echo "ℹ️  SSH no reiniciado. Root login aún funciona."
    echo "   Para aplicar cambios más tarde: sudo systemctl restart sshd"
fi

echo ""
echo "=================================================="
