class RoomManager {
    constructor(socketClient, roomEventCallbacks) {
        this.socket = socketClient;
        this.roomEventCallbacks = roomEventCallbacks;
        this.users = {};
        this.chatMessages = [];
        this.publicSubRooms = [];
        this.localUser = null;
    }

    addRoomEventCallbacks(cbs) {
        //console.debug("va a setear los callbacks", { cbs: cbs });
        Object.keys(cbs).forEach(c => {
            this.roomEventCallbacks[c] = cbs[c];
        });
    }

    removeRoomEventCallbacks() {
        Object.keys(this.roomEventCallbacks).forEach(c => {
            delete this.roomEventCallbacks[c]
        });
    }

    setUsers(users) {
        this.users = users;
    }

    setLocalUser(user) {
        this.localUser = user;
    }

    getLocalUser() {
        return this.localUser;
    }

    init() {
        this.socket.on("users", data => {
            console.log("los users actuales");
            console.log(data);
            this.users = data || {};

            if (this.roomEventCallbacks["onUsers"]) {
                this.roomEventCallbacks["onUsers"](data || {});
            }
        });

        this.socket.on("user_joined", data => {
            console.log("(roomManager) user joined", { user: data });

            this.users[data.id] = data;

            if (this.roomEventCallbacks["onUserJoined"]) {
                this.roomEventCallbacks["onUserJoined"]({
                    newUser: data,
                    users: this.users
                });
            }

        });

        this.socket.on("user_presentation_request", data => {
            console.log("(roomManager) user_presentation_request! ", { data: data, users: this.users });


            this.users[data.userId].presentationRequested = true;

            if (this.roomEventCallbacks["onUserPresentationRequest"]) {
                this.roomEventCallbacks["onUserPresentationRequest"](data, this.users);
            }

        });

        this.socket.on("user_presentation_cancelled", data => {
            console.log("(roomManager) user_presentation_cancelled! ", { data: data });

            if (this.users[data.userId]) {
                this.users[data.userId].presentationRequested = false;
                this.users[data.userId].presenter = false;
            }

            if (!this.users[this.localUser.userId].owner &&
                !this.users[this.localUser.userId].presenter &&
                data.target !== this.localUser.userId) {

                delete this.users[data.target];
            }

            if (this.roomEventCallbacks["onUserPresentationCancelled"]) {
                this.roomEventCallbacks["onUserPresentationCancelled"](data, this.users);
            }

        });

        this.socket.on("user_presentation_granted", data => {
            console.log("(roomManager) user_presentation_granted! ", { data: data });

            if (this.users[data.userId]) {
                this.users[data.userId].presentationRequested = false;
                this.users[data.userId].presenter = true;
            }


            if (this.roomEventCallbacks["onUserPresentationGranted"]) {
                this.roomEventCallbacks["onUserPresentationGranted"](data, this.users);
            }

            this.socket.emit("users", { roomId: data.roomId, userId: data.target });

        });

        this.socket.on("user_presentation_removed", data => {
            console.log("(roomManager) al presentador se le revocó la presentacion", { data: data });

            if (this.users[data.target]) {
                this.users[data.target].presenter = false;
                this.users[data.target].presentationRequested = false;

            }

            if (!this.users[this.localUser.userId].owner &&
                !this.users[this.localUser.userId].presenter &&
                data.target !== this.localUser.userId) {

                delete this.users[data.target];
            }

            if (this.roomEventCallbacks["onUserPresentationRemoved"]) {
                this.roomEventCallbacks["onUserPresentationRemoved"](data, this.users);
            }


        });

        this.socket.on("new_presenter", data => {
            console.log("(roomManager) presentador se unió", { data: data });

            this.users[data.id] = data;

            if (this.roomEventCallbacks["onNewPresenter"]) {
                this.roomEventCallbacks["onNewPresenter"](data, this.users);
            }

        });

        this.socket.on("user_left", data => {
            console.debug("on_user_left -- user left the room",{data:data});

            delete this.users[data.userId];

            if(this.users[this.localUser.userId] && this.users[this.localUser.userId].assignedSFU === data.userId ){
                delete this.users[this.localUser.userId].assignedSFU;
            }

            console.log("on_user_left -- new users list",{users:this.users});

            if (this.roomEventCallbacks["onUserLeft"]) {
                this.roomEventCallbacks["onUserLeft"](data);
            }

            // if (this.roomEventCallbacks["onUsers"]) {
            //     this.roomEventCallbacks["onUsers"](this.users);
            // }

            

        });

        this.socket.on("new_main_presenter", data => {
            console.log("la sala tiene nuevo presentador principal");
            console.log(data);

            if (this.users[data.mainPresenterId]) {

                this.users[data.mainPresenterId].mainPresenter = true;

                console.log("como queda la lista de usuarios en new_main_presenter", { users: this.users });
                console.log(this.users);

                if (this.roomEventCallbacks["onNewMainPresenter"]) {
                    this.roomEventCallbacks["onNewMainPresenter"](data.mainPresenterId, this.users);
                }

            }



        });

        this.socket.on("message", data => {

            this.chatMessages.push(data);

            if (this.roomEventCallbacks["onChatMessage"]) {
                this.roomEventCallbacks["onChatMessage"](data, this.chatMessages);
            }

        });

        this.socket.on("create_sub_room", data => {

            if (data.roomType == "public")//show only public rooms
                this.publicSubRooms.push(data);

            if (this.roomEventCallbacks["onNewSubRoom"]) {
                this.roomEventCallbacks["onNewSubRoom"](data, this.publicSubRooms);
            }

        });

        this.socket.on("room_info", data => {
            console.log("recibiendo en room manager el room info", { data: data });
            if (this.roomEventCallbacks["onRoomInfo"]) {
                console.log("esta definido el callback...llamando", { data: data });
                this.roomEventCallbacks["onRoomInfo"](data);
            }

        });

        this.socket.on("peer_camera_state_changed", data => {
            console.log("peer changed camera state", { data: data, users: this.users });

            if (this.users[data.peerId]) {

                this.users[data.peerId].camera = data.enabled;

                console.log("como queda la lista de usuarios en peer_camera_state_changed", { users: this.users });

                if (this.roomEventCallbacks["onUsers"]) {
                    this.roomEventCallbacks["onUsers"](this.users);
                }

            }

        });

        this.socket.on("peer_mic_state_changed", data => {
            console.log("peer changed mic state", { data: data, users: this.users });

            if (this.users[data.peerId]) {

                this.users[data.peerId].mic = data.enabled;

                console.log("como queda la lista de usuarios en peer_mic_state_changed", { users: this.users });

                if (this.roomEventCallbacks["onUsers"]) {
                    this.roomEventCallbacks["onUsers"](this.users);
                }

            }

        });

        this.socket.on("sfu_assigned", data => {
            console.log("sfu_assigned", { data: data, users: this.users });

            if (this.users[data.userId]) {

                this.users[data.userId].assignedSFU = data.assignedSFU;

                console.log("como queda la lista de usuarios en sfu_assigned", { users: this.users });

                if (this.roomEventCallbacks["onSFUAssigned"]) {
                    this.roomEventCallbacks["onSFUAssigned"](this.users[data.userId],this.users);
                }

            }else{
                console.warn("sfu_assigned -- userId not found in users list ",{roomId:data.roomId,userId:data.userId,users:this.users});
            }

        });

        this.socket.on("peer_media_changed", data => {
            console.log("peer media changed", { data: data, users: this.users });

            if (this.users[data.from]) {

                let updated = false;

                switch(data.type){
                    case "added":
                        if( !this.users[data.from].localStreams ) {
                            this.users[data.from].localStreams = {};
                        }
            
                        this.users[data.from].localStreams[data.streamId] = {
                            label: data.label
                        }
                        updated = true;
                    break;
                    case "deleted": 
                        delete this.users[data.from].localStreams[data.streamId];
                        updated = true;
                    break;
                    default: console.log("Unknown peer media changed type: "+data.type,{data:data});
                }

                if(updated){
                    console.log("Peer updated with media change",{peer:this.users[data.from],data:data});
                    if (this.roomEventCallbacks["onPeerMediaChanged"]) {
                        this.roomEventCallbacks["onPeerMediaChanged"](data,this.users[data.from]);
                    }
                }

            }

        });

        this.socket.on("peer_score", data => {
            console.log("peer_score", { data: data});

            if (this.roomEventCallbacks["onPeerScore"]) {
                this.roomEventCallbacks["onPeerScore"](data);
            }

        });

    }

    getUsers() {
        return this.users;
    }

    join(roomId, userId, userData) {
        this.socket.emit("join", { userId: userId, roomId: roomId, userData }, response => {
            if (response.result === "ok") {
                this.users = response.peers;
                this.localUser = {
                    userId: userId,
                    roomId: roomId,
                    presenter: userData.presenter,
                    owner: userData.owner
                }

                if (this.roomEventCallbacks["onJoined"]) {
                    this.roomEventCallbacks["onJoined"](this.users);
                }
                //this.socket.emit("users",{userId:userId, roomId: roomId});
            }

            if (response.result === "error") {
                if (this.roomEventCallbacks["onError"]) {
                    this.roomEventCallbacks["onError"](response);
                }
            }
        });
    }

    getRoomInfo(roomId) {
        this.socket.emit("room_info", { roomId: roomId });
    }

    requestPresentation(userId, roomId) {
        this.users[userId].presentationRequested = true;
        this.socket.emit("user_presentation_request", { userId: userId, roomId: roomId });
    }

    cancelPresentation(roomId, userId) {
        this.users[userId].presentationRequested = false;
        this.socket.emit("user_presentation_cancelled", { userId: userId, roomId: roomId });
    }

    grantPresentation(roomId, userId, reqUserId) {
        this.users[reqUserId].presentationRequested = false;
        this.users[reqUserId].presenter = true;
        this.users[reqUserId].canStream = true;
        this.socket.emit("user_presentation_granted", { from: userId, target: reqUserId, roomId: roomId });
    }

    removePresentation(roomId, userId, targetUserId) {
        this.users[targetUserId].presentationRequested = false;
        this.users[targetUserId].presenter = false;
        this.users[targetUserId].canStream = false;
        this.socket.emit("user_presentation_removed", { from: userId, target: targetUserId, roomId: roomId });
    }

    sendMessage(roomId, userId, target, message) {
        console.log("sending message", { roomId: roomId, userId: userId, target: target, message: message });
        this.socket.emit("message", { from: userId, target: target, roomId: roomId, message: message });
    }

    createSubRoom(roomId, roomName, roomMax, roomType) {
        console.log("create subRoom", { roomId: roomId, roomName: roomName, roomMax: roomMax, roomType: roomType });
        this.socket.emit("create_sub_room", { roomId: roomId, roomName: roomName, roomMax: roomMax, roomType: roomType });
    }

    sendCameraState(roomId, userId, cameraEnabled) {
        this.users[userId].camera = cameraEnabled;
        console.log("sending camera state", { roomId: roomId, userId: userId, enabled: cameraEnabled });
        this.socket.emit("peer_camera_state_changed", { peerId: userId, enabled: cameraEnabled, roomId: roomId });
    }

    sendMicState(roomId, userId, micEnabled) {
        this.users[userId].mic = micEnabled;
        console.log("sending mic state", { roomId: roomId, userId: userId, enabled: micEnabled });
        this.socket.emit("peer_mic_state_changed", { peerId: userId, enabled: micEnabled, roomId: roomId });
    }

    requestTargetSFU(userId, roomId) {
        this.socket.emit("get_target_sfu", { userId: userId, roomId: roomId });
    }

    requestPeerScore(results) {
       
        this.socket.emit("peer_score_requested", results);
    }

    checkUsernameAvailability(username) {
        let prom = new Promise((resolve,reject) => {
            this.socket.emit("username", {
                userName:username
            },result => {

                resolve(result);
                return result;

            });
        });
        return prom;
        
    }

    leave(roomId, userId) {
        let prom = new Promise((resolve,reject) => {
            console.log("emitting leave", { roomId: roomId, userId: userId });
            this.socket.emit("leave", { userId: userId, roomId: roomId },response => {
                this.socket.disconnect();
                this.chatMessages = [];
                resolve(true);
            });
        
        });
        return prom;
        
    }
}

export default RoomManager;