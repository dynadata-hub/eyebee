class RTCPeerConnectionFactory {
    constructor(){

    }

    createRTCPeerConnection(config){
        return new RTCPeerConnection(config);
    }
}

export default RTCPeerConnectionFactory;