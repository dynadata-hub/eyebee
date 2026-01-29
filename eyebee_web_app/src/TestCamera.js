class TestCamera {
    constructor(canvasElem,videoElem) {
     
        this.canvasElem = canvasElem;
        this.videoElem = videoElem;
        this.stream = null;
    }


    async start(cameraConfig) {
        if(this.canvasElem){
            
                if(this.stream){
                    this.stop();
                }
                
                if (!this.stream) {
    
                    this.stream = this.canvasElem.captureStream(2);

                    if(this.videoElem){
                        
                    }
                  
                    return this.stream;
                } else {
                    throw "TESTCAMERA_ALREADY_STARTED";
                }
    
        }else{
            throw "TESTCAMERA_CANVAS_ELEM_NOT_FOUND";
        }       

    }

    async hasPermission(){
       return true;
    }

    async listDevices() {
        let devices = [{
            deviceId:0,
            kind:"videoinput",
            label:"test-video"
        }];
        return devices;
    }

    mute() {
        if (this.stream && this.stream.getAudioTracks()[0]) {
            this.stream.getAudioTracks()[0].enabled = false;
        }

    }

    unmute() {
        if (this.stream && this.stream.getAudioTracks()[0]) {
            this.stream.getAudioTracks()[0].enabled = true;
        }
    }

    disableVideo() {
        if (this.stream && this.stream.getVideoTracks()[0]) {
            this.stream.getVideoTracks()[0].enabled = false;
        }

    }

    enableVideo() {
        if (this.stream && this.stream.getVideoTracks()[0]) {
            this.stream.getVideoTracks()[0].enabled = true;
        }
    }

    isVideoEnabled() {
        if (this.stream && this.stream.getVideoTracks()[0]) {
            return this.stream.getVideoTracks()[0].enabled;
        } else {
            return false;
        }

    }

    isAudioEnabled() {
        if (this.stream && this.stream.getAudioTracks()[0]) {
            return this.stream.getAudioTracks()[0].enabled;
        } else {
            return false;
        }

    }

    stop() {

        // Through the MediaStream, you can get the MediaStreamTracks with getTracks():
        const tracks = this.stream.getTracks();

        // Or stop all like so:
        tracks.forEach(track => track.stop());
        this.stream = null;

        return true;
    }

    getStream() {
        return this.stream;
    }

}


export default TestCamera;