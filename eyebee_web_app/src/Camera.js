class Camera {
    constructor(navigator) {
        this.navigator = navigator;
        this.stream = null;
    }


    async start(constraints) {
        if ('mediaDevices' in this.navigator && 'getUserMedia' in this.navigator.mediaDevices) {
            
            if(this.stream){
                this.stop();
            }
            
            if (!this.stream) {

                this.stream = await this.navigator.mediaDevices.getUserMedia(constraints || {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    },
                    video: true
                });
                // this.mute();
                this.constraints = constraints;
                return this.stream;
            } else {
                throw "CAMERA_ALREADY_STARTED";
            }

        } else {
            throw "USERMEDIA_NOT_AVAILABLE";
        }
    }

    async hasPermission(){
        try{
            let stream = await this.navigator.mediaDevices.getUserMedia({audio:true,video:true});
            let tracks = stream.getTracks();

            // Or stop all like so:
            tracks.forEach(track => track.stop());

            return true;
        }catch(err){
            return false;
        }
        
        
    }

    async listDevices() {
        let devices = await this.navigator.mediaDevices.enumerateDevices();
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
        console.log("Eanble video");
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


export default Camera;