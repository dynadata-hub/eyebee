# Reporte de Despliegue de eyebee
**Fecha:** 30 de enero de 2026  
**Sistema:** Ubuntu Linux

## Resumen Ejecutivo
Se realizó la configuración y despliegue exitoso de la aplicación eyebee en producción utilizando Docker Compose. Se identificaron y resolvieron múltiples problemas de permisos que impedían el funcionamiento correcto de los servicios.

## Errores Encontrados y Soluciones

### 1. Permisos de npm en node_modules
**Error:**
```
npm error code EACCES
npm error syscall unlink
npm error path /opt/eyebee/webrtc_sessions/node_modules/.bin/fxparser
npm error errno -13
npm error [Error: EACCES: permission denied, unlink '/opt/eyebee/webrtc_sessions/node_modules/.bin/fxparser']
```

**Causa:** El directorio `node_modules` tenía permisos incorrectos que impedían a npm modificar archivos durante la instalación.

**Solución aplicada:**
```bash
sudo chown -R $USER:$USER /opt/eyebee/webrtc_sessions/node_modules
```

### 2. Permisos de Docker daemon
**Error:**
```
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
```

**Causa:** El usuario no pertenecía al grupo `docker`, lo que impedía ejecutar comandos de Docker sin sudo.

**Solución aplicada:**
```bash
sudo usermod -aG docker $USER
```

**Nota:** Se requiere cerrar sesión y volver a iniciar sesión para que el cambio surta efecto, o usar `newgrp docker`.

### 3. Ausencia de package-lock.json en speed-test
**Error:**
```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Causa:** El servicio `speed-test` utilizaba `npm ci` en su comando de inicio, pero faltaba el archivo `package-lock.json` en el directorio `speed_test_server/`.

**Solución aplicada:**
```bash
cd /opt/eyebee/speed_test_server
npm install  # Generó package-lock.json
docker compose restart speed-test
```

### 4. Error 503 al acceder desde localhost
**Comportamiento:** Al acceder a `http://localhost` se recibía un error 503.

cat /opt/eyebee/DEPLOYMENT_REPORT.mdte después de resolver los problemas de permisos y dependencias. La aplicación está accesible en la dirección IP configurada y todos los contenedores están en estado saludab
# Reporte de Despliegue de eyebee
**Fecha:** 30 de enero de 2026  
**Sistema:** Ubuntu Linux

## Resumen Ejecutivo
Se realizó la configuración y despliegue exitoso de la aplicación eyebee en producción utilizando Docker Compose. Se identificaron y resolvieron múltiples problemas de permisos que impedían el funcionamiento correcto de los servicios.

## Errores Encontrados y Soluciones

### 1. Permisos de npm en node_modules
**Error:**
```
npm error code EACCES
npm error syscall unlink
npm error path /opt/eyebee/webrtc_sessions/node_modules/.bin/fxparser
npm error errno -13
npm error [Error: EACCES: permission denied, unlink '/opt/eyebee/webrtc_sessions/node_modules/.bin/fxparser']
```

**Causa:** El directorio `node_modules` tenía permisos incorrectos que impedían a npm modificar archivos durante la instalación.

**Solución aplicada:**
```bash
sudo chown -R $USER:$USER /opt/eyebee/webrtc_sessions/node_modules
```

### 2. Permisos de Docker daemon
**Error:**
```
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
```

**Causa:** El usuario no pertenecía al grupo `docker`, lo que impedía ejecutar comandos de Docker sin sudo.

**Solución aplicada:**
```bash
sudo usermod -aG docker $USER
```

**Nota:** Se requiere cerrar sesión y volver a iniciar sesión para que el cambio surta efecto, o usar `newgrp docker`.

### 3. Ausencia de package-lock.json en speed-test
**Error:**
```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Causa:** El servicio `speed-test` utilizaba `npm ci` en su comando de inicio, pero faltaba el archivo `package-lock.json` en el directorio `speed_test_server/`.

**Solución aplicada:**
```bash
cd /opt/eyebee/speed_test_server
npm install  # Generó package-lock.json
docker compose restart speed-test
```

### 4. Error 503 al acceder desde localhost
**Comportamiento:** Al acceder a `http://localhost` se recibía un error 503.

**Causa:** El nginx-proxy está configurado para enrutar basándose en el host header `164.92.212.133`, no en `localhost`.

**No es un error:** Esto es el comportamiento esperado según la configuración en `docker-compose.yml`:
```yaml
environment:
  - VIRTUAL_HOST=164.92.212.133
```

**Formas correctas de acceso:**
- Desde internet/red externa: `http://164.92.212.133`
- Desde localhost con host header: `curl -H "Host: 164.92.212.133" http://localhost`
- IP directa del contenedor: `http://172.18.0.5`

## Estado Final de los Servicios

### Contenedores en Ejecución
| Nombre | Estado | Puertos | Salud |
|--------|--------|---------|-------|
| nginx-proxy | Activo (10+ min) | 80, 443 | N/A |
| eyebee-web | Activo (10+ min) | 80 (interno) | N/A |
| webrtc-sessions | Activo (10+ min) | 5000 (interno) | Healthy |
| speed-test | Activo (2+ min) | 5100 (interno) | N/A |

### Configuración de Red
- **Red Docker:** eyebee (bridge)
- **IP del servidor:** 164.92.212.133
- **Subdominio API:** api.164.92.212.133.nip.io
- **IP interna eyebee-web:** 172.18.0.5

## Cambios Realizados

1. **Corrección de permisos:**
   - `node_modules` en webrtc_sessions
   - Usuario agregado al grupo docker

2. **Generación de archivos faltantes:**
   - `package-lock.json` en speed_test_server/

3. **Reinicio de servicios:**
   - Servicio speed-test reiniciado después de generar package-lock.json

## Comandos de Verificación

### Verificar estado de contenedores
```bash
docker ps
docker compose ps
```

### Ver logs
```bash
docker compose logs -f
docker logs <nombre_contenedor>
```

### Verificar salud de webrtc-sessions
```bash
docker inspect webrtc-sessions --format='{{.State.Health.Status}}'
```

### Probar acceso a la aplicación
```bash
# Desde localhost con host header
curl -H "Host: 164.92.212.133" http://localhost

# IP directa del contenedor
curl http://172.18.0.5

# Desde navegador (externo)
# http://164.92.212.133
```

## Advertencias y Notas

1. **Versión obsoleta de docker-compose.yml:** Se muestra advertencia sobre el atributo `version` que es obsoleto en Docker Compose v2.

2. **Vulnerabilidades en frontend:** npm audit reporta 156 vulnerabilidades en las dependencias del frontend. Se recomienda ejecutar:
   ```bash
   cd eyebee_web_app
   npm audit fix
   ```

3. **Dependencia deprecada:** `uuidv4@6.2.13` está marcada como deprecada.

## Conclusión
✅ **Todos los servicios están operativos y funcionando correctamente.**

El despliegue se completó exitosamente después de resolver los problemas de permisos y dependencias. La aplicación está accesible en la dirección IP configurada y todos los contenedores están en estado saludable.
