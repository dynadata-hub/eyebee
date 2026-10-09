/**
 * Centralized configuration for Eyebee Web App.
 * Values are read from environment variables at build time (REACT_APP_* prefix).
 * Defaults are provided for local development.
 */

const config = {
    // Socket/API endpoint — in production, uses relative path "/"
    // In development, points to local backend
    socketEndpoint: process.env.REACT_APP_SOCKET_ENDPOINT || "/",

    // Base URL for generating room links (admin panel)
    appBaseUrl: process.env.REACT_APP_BASE_URL || window.location.origin,

    // TURN server configuration
    turnServer: {
        urls: process.env.REACT_APP_TURN_URL || "turn:livelatency.com",
        username: process.env.REACT_APP_TURN_USERNAME || "immersiveclass",
        credential: process.env.REACT_APP_TURN_CREDENTIAL || "1mm3r51v3c1455",
    },

    // Speed test endpoints
    speedTest: {
        testFile: process.env.REACT_APP_SPEEDTEST_DOWNLOAD || "/speedtest/download/500mb.bin",
        uploadEndpoint: process.env.REACT_APP_SPEEDTEST_UPLOAD || "/speedtest/upload",
        pingEndpoint: process.env.REACT_APP_SPEEDTEST_PING || "/speedtest/ping",
    },

    // ICE servers for WebRTC
    getIceServers() {
        return [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            {
                urls: this.turnServer.urls,
                username: this.turnServer.username,
                credential: this.turnServer.credential,
            },
        ];
    },
};

export default config;
