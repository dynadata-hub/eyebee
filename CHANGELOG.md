# Changelog — Eyebee v1.0

## [Unreleased] — feature/library-upgrade-v1

### Auditoría inicial (2026-09-03)

#### Estado de vulnerabilidades

| Proyecto | Low | Moderate | High | Critical | Total |
|----------|-----|----------|------|----------|-------|
| eyebee_web_app | 9 | 115 | 52 | 9 | **185** |
| webrtc_sessions | 2 | 13 | 15 | 3 | **33** |

#### Dependencias desactualizadas — Frontend (eyebee_web_app)

| Paquete | Actual | Objetivo | Tipo de cambio |
|---------|--------|----------|----------------|
| react | 17.0.1 | 18+ | **MAJOR** — createRoot API |
| react-dom | 17.0.1 | 18+ | **MAJOR** |
| @material-ui/core | 4.12.3 | @mui/material 5+ | **MAJOR** — nuevo sistema de estilos |
| @material-ui/icons | 4.11.2 | @mui/icons-material 5+ | **MAJOR** |
| react-scripts | 4.0.3 | 5.0.1 | **MAJOR** — Webpack 5 |
| react-router-dom | 5.2.0 | 6+ | **MAJOR** — Routes API |
| @testing-library/react | 11.2.5 | 16+ | **MAJOR** |
| @testing-library/jest-dom | 5.11.9 | 7+ | **MAJOR** |
| @testing-library/user-event | 12.8.3 | 14+ | **MAJOR** |
| query-string | 6.14.1 | 9+ (o eliminar) | MAJOR |
| web-vitals | 1.1.0 | 6+ | MAJOR |
| axios | 1.13.4 | 1.20.0 | minor |
| react-window | 1.8.6 | 1.8.11 | patch |
| react-virtualized-auto-sizer | 1.0.5 | 1.0.26 | patch |

#### Dependencias desactualizadas — Backend (webrtc_sessions)

| Paquete | Actual | Objetivo | Tipo de cambio |
|---------|--------|----------|----------------|
| mocha | 9.2.2 | 12.0.0 | **MAJOR** |
| chai | 4.3.4 | 6+ (ESM-only) | **MAJOR** |
| uuid | 8.3.2 | 14+ | **MAJOR** |
| firebase-admin | 13.6.0 | 14+ | **MAJOR** |
| body-parser | 1.20.4 | eliminar (Express 5 built-in) | deprecar |
| cors | 2.8.5 | 2.8.6 | patch |
| dotenv | 17.2.3 | 17.4.2 | patch |
| helmet | 8.1.0 | 8.3.0 | minor |
| multer | 2.0.2 | 2.3.0 | minor |

#### Tests existentes

- **Backend**: 7/7 passing (mocha)
  - session.js: removePeerStreamReferences, electNewMainPresenter, getUpstreamPeerIds
  - peer.js: streamAlreadyLoaded
- **Frontend**: react-scripts test (requiere entorno interactivo)

#### Archivos afectados por migración MUI v4→v5

29 archivos usan `makeStyles`/`withStyles`:

1. AfterSessionView.js
2. Authentication/login.js
3. Authentication/NewUser.js
4. ChatItem.js
5. FilledTabsWidget.js
6. HexagonalAvatarWidget.js
7. JoinRoomView.js
8. LandingPage/DemoRoomForm.js
9. LandingPage/LandingPage.js
10. LocalPeerWidget.js
11. MediaPlayerWidget.js
12. NotFoundView.js
13. PeerListItem.js
14. peerTest/PeerTestWidget.js
15. RemotePeerWidget.js
16. Room/ChatWidget.js
17. Room/CreateNewSubRoom.js
18. Room/Room.js
19. Room/RoomActionsWidget.js
20. Room/RoomOld.js
21. Room/RoomPeers.js
22. Room/SideBoxWidget.js
23. Room/SubRooms.js
24. RoomGrid.js
25. Rooms/LinksRooms.js
26. Rooms/NewRoom.js
27. Rooms/Rooms.js
28. ScreenView.js
29. VideoConference.js

#### Archivos afectados por migración React Router v5→v6

4 archivos usan Switch/Route/useHistory:

1. App.js
2. LandingPage/DemoRoomForm.js
3. Rooms/LinksRooms.js
4. Rooms/NewRoom.js
