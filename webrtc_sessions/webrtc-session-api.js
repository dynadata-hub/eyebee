
class WebRTCSessionAPI {
    constructor(db,){
        this.db = db;
        
    }

    join(roomId,userId,userData){
        this.socket.emit("join",{userId: userId, roomId: roomId, userData})
    }

    leave(roomId,userId){
        this.socket.emit("leave",{userId: userId, roomId: roomId});
        this.socket.disconnect();
    }
}

export default WebRTCSessionAPI;