# CI/CD Setup Guide

Este documento describe cómo configurar el pipeline de CI/CD con GitHub Actions para deployments automáticos a producción.

## Workflow Overview

El workflow `deploy-production.yml` se ejecuta automáticamente en cada push a `main` y realiza:

1. **Test** - Ejecuta tests de backend (webrtc_sessions y speed_test_server)
2. **Build** - Compila el frontend (React app)
3. **Deploy** - Despliega código y reinicia servicios en el servidor de producción
4. **Notify** - Notifica el resultado del deployment

## Configuración de GitHub Secrets

Para que el workflow funcione, necesitas configurar los siguientes secrets en GitHub:

### Paso 1: Ir a GitHub Settings

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**

### Paso 2: Configurar Secrets Requeridos

Agrega los siguientes secrets uno por uno:

#### Secrets de Servidor SSH

| Secret Name | Descripción | Ejemplo |
|-------------|-------------|---------|
| `SSH_PRIVATE_KEY` | Clave SSH privada para acceder al servidor | Contenido completo de tu archivo `~/.ssh/id_rsa` o clave dedicada |
| `SSH_USER` | Usuario SSH del servidor | `algol` |
| `PRODUCTION_SERVER_IP` | IP del servidor de producción | `164.92.212.133` |

#### Secrets de Dominio

| Secret Name | Valor |
|-------------|-------|
| `DOMAIN` | `live.eyebee.com` |
| `API_DOMAIN` | `api.live.eyebee.com` |
| `SPEEDTEST_DOMAIN` | `speedtest.live.eyebee.com` |
| `LETSENCRYPT_EMAIL` | Tu email para Let's Encrypt (ej: `admin@eyebee.com`) |

#### Secrets de Firebase

| Secret Name | Valor |
|-------------|-------|
| `FIREBASE_PROJECT_ID` | `eyebee-718a0` |
| `FIREBASE_STORAGE_BUCKET` | `eyebee-718a0.appspot.com` |

## Generación de SSH Key para Deployment

### Opción 1: Usar clave existente (menos seguro)

```bash
# En tu máquina local
cat ~/.ssh/id_rsa
```

Copia el contenido completo (incluyendo `-----BEGIN...` y `-----END...`) y pégalo en el secret `SSH_PRIVATE_KEY`.

### Opción 2: Crear clave dedicada (recomendado)

```bash
# En tu máquina local
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Ver la clave privada (para GitHub Secret)
cat ~/.ssh/github_deploy_key

# Ver la clave pública (para agregar al servidor)
cat ~/.ssh/github_deploy_key.pub
```

#### Agregar clave pública al servidor:

```bash
# En el servidor de producción
ssh algol@164.92.212.133
echo "PEGA_AQUI_EL_CONTENIDO_DE_github_deploy_key.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Configuración del Environment en GitHub

Para mayor seguridad, configura un environment de producción:

1. Ve a **Settings** → **Environments**
2. Click en **New environment**
3. Nombre: `production`
4. (Opcional) Agrega **Required reviewers** para aprobar deployments manualmente
5. (Opcional) Agrega **Deployment branches** para limitar a `main`

## Verificar Configuración

### Test de SSH desde GitHub Actions

Crea un workflow temporal para verificar:

```yaml
name: Test SSH
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test SSH Connection
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.PRODUCTION_SERVER_IP }} >> ~/.ssh/known_hosts
          ssh -i ~/.ssh/deploy_key ${{ secrets.SSH_USER }}@${{ secrets.PRODUCTION_SERVER_IP }} "echo 'SSH connection successful'"
```

## Uso del Workflow

### Deployment Automático

El workflow se ejecuta automáticamente cuando haces push a `main`:

```bash
git add .
git commit -m "feat: add new feature

Co-Authored-By: Warp <agent@warp.dev>"
git push origin main
```

GitHub Actions automáticamente:
1. Ejecutará tests
2. Compilará el frontend
3. Desplegará al servidor de producción
4. Reiniciará los servicios

### Deployment Manual

También puedes ejecutar el workflow manualmente:

1. Ve a **Actions** en GitHub
2. Selecciona **Deploy to Production**
3. Click en **Run workflow**
4. Selecciona la rama `main`
5. Click en **Run workflow**

## Monitoreo del Deployment

### Ver Logs en Tiempo Real

1. Ve a **Actions** en tu repositorio
2. Click en el workflow en ejecución
3. Expande cada job para ver los logs detallados

### Verificar Deployment Exitoso

Después de que el workflow termine:

1. Verifica el estado final (✅ verde = éxito)
2. Visita https://live.eyebee.com para confirmar
3. Revisa los logs del servidor si es necesario:

```bash
ssh algol@164.92.212.133
cd /opt/eyebee
docker compose logs -f
```

## Troubleshooting

### Error: "Permission denied (publickey)"

**Problema**: La clave SSH no está configurada correctamente.

**Solución**:
1. Verifica que `SSH_PRIVATE_KEY` contenga la clave privada completa
2. Verifica que la clave pública esté en `~/.ssh/authorized_keys` del servidor
3. Verifica permisos: `chmod 600 ~/.ssh/authorized_keys`

### Error: "Host key verification failed"

**Problema**: El servidor no está en known_hosts.

**Solución**: El workflow ya incluye `ssh-keyscan`, pero si persiste:
```bash
ssh-keyscan -H 164.92.212.133 >> ~/.ssh/known_hosts
```

### Error: Tests Failing

**Problema**: Los tests no pasan en GitHub Actions.

**Solución**:
1. Ejecuta los tests localmente primero
2. Asegúrate de que `package-lock.json` esté commiteado
3. Verifica las dependencias en `package.json`

### Error: Build Failing

**Problema**: El build del frontend falla.

**Solución**:
1. Ejecuta `npm run build` localmente
2. Corrige warnings/errores
3. Verifica variables de entorno necesarias

### Error: Deployment Timeout

**Problema**: El deployment toma demasiado tiempo.

**Solución**:
1. Verifica la conexión SSH al servidor
2. Revisa los logs del servidor: `docker compose logs`
3. Incrementa los timeouts en el workflow si es necesario

## Rollback

Si necesitas hacer rollback después de un deployment problemático:

### Opción 1: Via GitHub Actions

1. Ve a **Actions** → **Deploy to Production**
2. Encuentra el último deployment exitoso
3. Click en **Re-run all jobs**

### Opción 2: Manual

```bash
ssh algol@164.92.212.133
cd /opt/eyebee
git log --oneline  # Encuentra el commit anterior
git checkout <commit-hash>
docker compose down
docker compose up -d
```

## Mejoras Futuras

Considera agregar:

- [ ] Notificaciones de Slack/Discord en deployments
- [ ] Smoke tests después del deployment
- [ ] Deployment a staging environment primero
- [ ] Automated rollback en caso de fallos
- [ ] Performance monitoring post-deployment
- [ ] Database migrations automation

## Seguridad

### Buenas Prácticas

✅ **DO**:
- Usa claves SSH dedicadas para deployment
- Habilita required reviewers para production
- Rota las claves SSH periódicamente
- Limita los permisos del usuario SSH en el servidor
- Usa GitHub Environments para protección adicional

❌ **DON'T**:
- No commitas secrets en el código
- No uses la misma clave SSH para múltiples propósitos
- No deshabilites la verificación de host key
- No des acceso root al usuario de deployment

## Soporte

Para problemas:
1. Revisa los logs de GitHub Actions
2. Revisa los logs del servidor: `docker compose logs`
3. Consulta `DEPLOYMENT.md` para comandos útiles
4. Revisa `DEPLOYMENT_REPORT.md` para problemas conocidos
