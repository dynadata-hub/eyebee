# Deployment Guide for eyebee

Este documento describe cómo desplegar eyebee en producción usando el dominio `live.eyebee.com`.

## Configuración de DNS

Asegúrate de que los siguientes registros DNS estén configurados:

| Dominio | Tipo | Valor |
|---------|------|-------|
| live.eyebee.com | A | 164.92.212.133 |
| api.live.eyebee.com | A | 164.92.212.133 |
| speedtest.live.eyebee.com | A | 164.92.212.133 |

Puedes verificar con:
```bash
dig live.eyebee.com +short
dig api.live.eyebee.com +short
dig speedtest.live.eyebee.com +short
```

## Archivos de Configuración

### 1. docker-compose.production.yml
Plantilla de Docker Compose para producción con:
- nginx-proxy para enrutamiento basado en dominio
- acme-companion para certificados SSL automáticos de Let's Encrypt
- Variables de entorno para dominios configurables

### 2. .env.production.example
Plantilla de variables de entorno. Incluye:
- Configuración de dominios
- Email para Let's Encrypt
- Configuración de Firebase

## Deployment Automatizado

### Opción 1: Usando el script de deployment (Recomendado)

```bash
# Desde tu máquina local
./deploy-to-production.sh
```

El script hará:
1. ✅ Verificar conexión SSH
2. ✅ Crear backup de la configuración actual
3. ✅ Desplegar código (vía git pull o rsync)
4. ✅ Configurar archivos de entorno
5. ✅ Corregir permisos
6. ✅ Generar package-lock.json si es necesario
7. ✅ Reiniciar contenedores Docker

### Opción 2: Deployment Manual

#### Paso 1: Conectarse al servidor
```bash
ssh algol@164.92.212.133
cd /opt/eyebee
```

#### Paso 2: Actualizar código
```bash
git pull origin main
```

#### Paso 3: Configurar archivos
```bash
# Copiar plantilla de docker-compose si no existe
cp docker-compose.production.yml docker-compose.yml

# Crear archivo .env
cp .env.production.example .env

# Editar con tus valores
nano .env
```

#### Paso 4: Configurar permisos
```bash
# Corregir permisos de node_modules
sudo chown -R $USER:$USER webrtc_sessions/node_modules
sudo chown -R $USER:$USER speed_test_server/node_modules

# Generar package-lock.json
cd speed_test_server
npm install
cd ..

# Crear directorios para nginx
mkdir -p nginx/vhost.d nginx/html nginx/certs nginx/acme
```

#### Paso 5: Iniciar servicios
```bash
# Detener contenedores anteriores
docker compose down

# Iniciar nuevos contenedores
docker compose up -d

# Verificar estado
docker compose ps
```

## Verificación del Deployment

### 1. Verificar contenedores
```bash
docker compose ps
```

Deberías ver:
- nginx-proxy (running)
- nginx-proxy-acme (running)
- eyebee-web (running)
- webrtc-sessions (running, healthy)
- speed-test (running)

### 2. Verificar logs
```bash
# Todos los servicios
docker compose logs -f

# Servicio específico
docker compose logs -f eyebee-web
docker compose logs -f webrtc-sessions
docker compose logs -f nginx-proxy
```

### 3. Verificar SSL
Los certificados SSL se generan automáticamente. Verifica los logs:
```bash
docker compose logs nginx-proxy-acme
```

### 4. Probar endpoints
```bash
# Desde tu máquina local
curl -I https://live.eyebee.com
curl -I https://api.live.eyebee.com
curl -I https://speedtest.live.eyebee.com
```

## Configuración de Variables de Entorno

Edita `/opt/eyebee/.env` en el servidor con los valores correctos:

```bash
# Dominios
DOMAIN=live.eyebee.com
API_DOMAIN=api.live.eyebee.com
SPEEDTEST_DOMAIN=speedtest.live.eyebee.com

# Let's Encrypt
LETSENCRYPT_EMAIL=tu-email@eyebee.com

# Firebase (ajusta según tu configuración)
FIREBASE_PROJECT_ID=eyebee-718a0
FIREBASE_STORAGE_BUCKET=eyebee-718a0.appspot.com
```

## Troubleshooting

### SSL no funciona
1. Verifica logs de acme-companion: `docker compose logs nginx-proxy-acme`
2. Verifica que los puertos 80 y 443 estén abiertos
3. Verifica que DNS esté correctamente configurado
4. Espera unos minutos (Let's Encrypt puede tardar)

### Contenedor en estado "Restarting"
```bash
# Ver logs del contenedor
docker compose logs [nombre-contenedor]

# Ejemplos comunes:
# - speed-test: verifica que package-lock.json exista
# - webrtc-sessions: verifica permisos y credenciales de Firebase
```

### Error 503 en nginx-proxy
1. Verifica que el contenedor de la app esté corriendo
2. Verifica las variables VIRTUAL_HOST y VIRTUAL_PORT
3. Revisa logs: `docker compose logs nginx-proxy`

### Permisos de node_modules
```bash
sudo chown -R $USER:$USER webrtc_sessions/node_modules
sudo chown -R $USER:$USER speed_test_server/node_modules
```

## Comandos Útiles

```bash
# Ver estado de todos los contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar un servicio específico
docker compose restart webrtc-sessions

# Reiniciar todos los servicios
docker compose restart

# Detener todos los servicios
docker compose down

# Iniciar servicios
docker compose up -d

# Reconstruir y reiniciar
docker compose up -d --build

# Limpiar contenedores e imágenes no usadas
docker system prune -a
```

## Actualizaciones

Para actualizar el código en producción:

```bash
# Opción 1: Script automático
./deploy-to-production.sh

# Opción 2: Manual
ssh algol@164.92.212.133
cd /opt/eyebee
git pull origin main
docker compose up -d --build
```

## Rollback

Si necesitas volver a una versión anterior:

```bash
ssh algol@164.92.212.133
cd /opt/eyebee

# Restaurar desde backup
BACKUP_DIR="/tmp/eyebee-backup-YYYYMMDD-HHMMSS"
cp "$BACKUP_DIR/docker-compose.yml" .
cp "$BACKUP_DIR/.env" .

# O volver a un commit anterior
git log --oneline  # Ver commits
git checkout [commit-hash]
docker compose up -d
```

## Monitoreo

### Health checks
El servicio webrtc-sessions tiene un health check configurado:
```bash
docker inspect webrtc-sessions --format='{{.State.Health.Status}}'
```

### Logs
Los logs están limitados a 50MB por servicio. Los archivos de log se encuentran en:
```bash
/var/lib/docker/containers/[container-id]/[container-id]-json.log
```

## Seguridad

- ✅ Los certificados SSL se renuevan automáticamente
- ✅ Los secrets están en `/opt/eyebee/secrets` (no en git)
- ✅ Las variables sensibles están en `.env` (no en git)
- ⚠️ Asegúrate de mantener actualizados los contenedores
- ⚠️ Configura fail2ban para proteger SSH

## Soporte

Para problemas o preguntas, consulta:
- DEPLOYMENT_REPORT.md - Reporte del deployment inicial
- README.md - Documentación general del proyecto
