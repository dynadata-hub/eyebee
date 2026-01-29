class RTCIceCandidateFactory {
    constructor(){

    }

    create(candidate){
        return new RTCIceCandidate(candidate);
    }
}

export default RTCIceCandidateFactory;