#!/bin/bash

# Script to display your existing SSH private key for GitHub Actions
# Usage: ./show-ssh-key-for-github.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 SSH Private Key for GitHub Actions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy the ENTIRE content below (including BEGIN and END lines)"
echo "and paste it as the GitHub Secret: SSH_PRIVATE_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try to find the private key
if [ -f ~/.ssh/id_ed25519 ]; then
    cat ~/.ssh/id_ed25519
elif [ -f ~/.ssh/id_rsa ]; then
    cat ~/.ssh/id_rsa
else
    echo "❌ No SSH private key found in ~/.ssh/"
    echo "Expected: ~/.ssh/id_ed25519 or ~/.ssh/id_rsa"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 GitHub Secrets to Configure:"
echo ""
echo "Go to: https://github.com/YOUR_ORG/eyebee/settings/secrets/actions"
echo ""
echo "Add these secrets (click 'New repository secret' for each):"
echo ""
echo "1. SSH_PRIVATE_KEY"
echo "   → Paste the content shown above"
echo ""
echo "2. SSH_USER"
echo "   → algol"
echo ""
echo "3. PRODUCTION_SERVER_IP"
echo "   → 164.92.212.133"
echo ""
echo "4. DOMAIN"
echo "   → live.eyebee.com"
echo ""
echo "5. LETSENCRYPT_EMAIL"
echo "   → admin@eyebee.com (or your preferred email)"
echo ""
echo "6. FIREBASE_PROJECT_ID"
echo "   → eyebee-718a0"
echo ""
echo "7. FIREBASE_STORAGE_BUCKET"
echo "   → eyebee-718a0.appspot.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ After adding all secrets, your CI/CD will be ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
