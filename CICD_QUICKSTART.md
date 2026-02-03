# CI/CD Quickstart Guide

## ✅ Lo que ya está configurado

✅ GitHub Actions workflow creado (`.github/workflows/deploy-production.yml`)  
✅ Documentación completa en `.github/CICD_SETUP.md`  
✅ Script helper para mostrar tu SSH key  
✅ Todo commiteado y listo para push  

## 🚀 Pasos para activar CI/CD (5 minutos)

### Paso 1: Obtener tu clave SSH privada

```bash
./.github/show-ssh-key-for-github.sh
```

Esto mostrará tu clave SSH privada. **Cópiala completa** (incluyendo las líneas BEGIN y END).

### Paso 2: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Agrega estos 9 secrets:

| Secret Name | Valor |
|-------------|-------|
| `SSH_PRIVATE_KEY` | [Pega la clave del paso 1] |
| `SSH_USER` | `algol` |
| `PRODUCTION_SERVER_IP` | `164.92.212.133` |
| `DOMAIN` | `live.eyebee.com` |
| `API_DOMAIN` | `api.live.eyebee.com` |
| `SPEEDTEST_DOMAIN` | `speedtest.live.eyebee.com` |
| `LETSENCRYPT_EMAIL` | `admin@eyebee.com` |
| `FIREBASE_PROJECT_ID` | `eyebee-718a0` |
| `FIREBASE_STORAGE_BUCKET` | `eyebee-718a0.appspot.com` |

### Paso 3: Push y listo!

```bash
git push origin main
```

🎉 **¡Eso es todo!** El deployment se ejecutará automáticamente.

## 📊 Monitorear el Deployment

Ve a: `https://github.com/TU_ORG/eyebee/actions`

Verás el workflow ejecutándose en tiempo real con estos pasos:
1. ⚙️ **Test** - Tests de backend
2. 🏗️ **Build** - Compilación del frontend
3. 🚀 **Deploy** - Deployment al servidor
4. 📢 **Notify** - Resultado del deployment

## ✨ Deployment Automático

Cada vez que hagas push a `main`, el CI/CD:
1. Ejecutará tests
2. Compilará el frontend
3. Desplegará al servidor de producción
4. Reiniciará los servicios
5. Verificará que todo esté funcionando

## 🔧 Deployment Manual

Si necesitas deployar sin hacer push:

1. Ve a **Actions** → **Deploy to Production**
2. Click en **Run workflow**
3. Selecciona `main`
4. Click en **Run workflow**

## 📚 Documentación Completa

Para más detalles, troubleshooting, y opciones avanzadas:
- `.github/CICD_SETUP.md` - Guía completa de CI/CD
- `DEPLOYMENT.md` - Guía de deployment manual
- `DEPLOYMENT_SUMMARY.md` - Resumen de configuración

## ❓ ¿Necesitas ayuda?

**SSH key no funciona?**
- Verifica que tu clave pública esté en el servidor: `ssh algol@164.92.212.133`
- Si no puedes conectar, agrega tu clave: `ssh-copy-id algol@164.92.212.133`

**Workflow falla?**
- Verifica que todos los 9 secrets estén configurados
- Revisa los logs en GitHub Actions
- Consulta `.github/CICD_SETUP.md` sección Troubleshooting
