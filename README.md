# EyeBee - WebRTC Video Conference Platform

**EyeBee** is a distributed WebRTC-based video conferencing platform with SFU (Selective Forwarding Unit) architecture.

## Components

- **eyebee_web_app**: React frontend for the web application
- **webrtc_sessions**: Backend Node.js signaling server and session management
- **speed_test_server**: Bandwidth testing server
- **eyebee_infrastructure**: Docker deployment configuration

## Quick Start

### Development

```bash
cd eyebee_infrastructure
docker-compose -f dev-docker-compose.yml up
```

### Production

```bash
cd eyebee_infrastructure
docker-compose up
```

## Security Notice

⚠️ **Important**: Never commit Firebase credentials or any sensitive data to the repository.

## License

UNLICENSED - Proprietary Software
