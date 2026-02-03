# Resumen de Configuración de Dominio

## ✅ Cambios Realizados

Se han agregado al repositorio los archivos necesarios para desplegar eyebee con el dominio `live.eyebee.com`:

### 1. **docker-compose.production.yml**
- Configuración de producción con nginx-proxy
- Soporte para múltiples dominios mediante variables de entorno
- SSL automático con Let's Encrypt (acme-companion)
- Dominios configurables:
  - `live.eyebee.com` → Aplicación web principal
  - `api.live.eyebee.com` → API WebRTC Sessions
  - `speedtest.live.eyebee.com` → Servidor de speed test

### 2. **.env.production.example**
Plantilla de variables de entorno que incluye:
```bash
DOMAIN=live.eyebee.com
API_DOMAIN=api.live.eyebee.com
SPEEDTEST_DOMAIN=speedtest.live.eyebee.com
LETSENCRYPT_EMAIL=admin@eyebee.com
```

### 3. **deploy-to-production.sh**
Script automatizado de deployment que:
- Verifica conexión SSH
- Crea backups automáticos
- Despliega código (git pull o rsync)
- Configura permisos
- Reinicia servicios Docker

### 4. **DEPLOYMENT.md**
Documentación completa con:
- Instrucciones paso a paso
- Verificación de DNS
- Troubleshooting
- Comandos útiles

### 5. **.gitignore actualizado**
- Excluye archivos de configuración sensibles (.env.production)
- Excluye docker-compose.yml (se genera desde el template)
- Excluye directorio nginx/ (certificados SSL)

## 🚀 Próximos Pasos

### Paso 1: Push al repositorio
```bash
git push origin main
```

### Paso 2: Desplegar al servidor
```bash
# Opción A: Automático (recomendado)
./deploy-to-production.sh

# Opción B: Manual
ssh algol@164.92.212.133
cd /opt/eyebee
git pull origin main
cp docker-compose.production.yml docker-compose.yml
cp .env.production.example .env
nano .env  # Editar con valores reales
docker compose down
docker compose up -d
```

### Paso 3: Verificar DNS
Asegúrate de que estos subdominios apunten a `164.92.212.133`:
```bash
dig live.eyebee.com +short
dig api.live.eyebee.com +short
dig speedtest.live.eyebee.com +short
```

✅ **Ya verificado**: `live.eyebee.com` → `164.92.212.133`

### Paso 4: Probar la aplicación
Después del deployment, verifica:
```bash
curl -I https://live.eyebee.com
curl -I https://api.live.eyebee.com
curl -I https://speedtest.live.eyebee.com
```

## 📝 Notas Importantes

1. **SSL Automático**: Los certificados se generan automáticamente con Let's Encrypt
2. **Variables de Entorno**: Edita `/opt/eyebee/.env` en el servidor con valores reales
3. **Backups**: El script crea backups automáticos antes de cada deployment
4. **Rollback**: Puedes volver a una versión anterior usando git checkout

## 🔧 Diferencias con Configuración Anterior

### Antes (IP directa):
```yaml
VIRTUAL_HOST=164.92.212.133
```

### Ahora (Dominio):
```yaml
VIRTUAL_HOST=${DOMAIN:-live.eyebee.com}
LETSENCRYPT_HOST=${DOMAIN:-live.eyebee.com}
```

## 📚 Documentación

- `DEPLOYMENT.md` - Guía completa de deployment
- `DEPLOYMENT_REPORT.md` - Reporte del deployment inicial (30 enero 2026)
- `README.md` - Documentación general del proyecto

## ✅ Commit Realizado

```
feat: add production deployment configuration for live.eyebee.com

- Add docker-compose.production.yml with domain-based routing
- Add nginx-proxy with automatic SSL via Let's Encrypt
- Add environment variable template (.env.production.example)
- Add automated deployment script (deploy-to-production.sh)
- Add comprehensive deployment documentation (DEPLOYMENT.md)
- Update .gitignore to exclude production config files

Co-Authored-By: Warp <agent@warp.dev>
```

Commit hash: b4f294b
