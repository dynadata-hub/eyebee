class Screen {
    constructor(navigator){
        this.navigator = navigator;
        this.stream = null;
        this.displayOptions = null;
    }


    async start(displayOptions){
        if ('mediaDevices' in this.navigator && 'getDisplayMedia' in this.navigator.mediaDevices) {
            if(!this.stream){
               
                this.stream = await this.navigator.mediaDevices.getDisplayMedia(displayOptions || {
                    audio: {
                        echoCancellation: true, 
                        noiseSuppression: true
                    },
                    video:{
                        width:{
                            max: 1280
                        },
                        height:{
                            max:720
                        },
                        frameRate:{
                            max:5
                        }
                    }
                });
                this.mute();
                this.displayOptions = displayOptions;
                return this.stream;
            }else{
                throw "SCREEN_ALREADY_STARTED";
            }
            
        }else{
            throw "USERMEDIA_NOT_AVAILABLE";
        }
    }


    mute(){
        if(this.stream && this.stream.getAudioTracks()[0]){
            this.stream.getAudioTracks()[0].enabled = false;
        }
        
    }

    unmute(){
        if(this.stream && this.stream.getAudioTracks()[0]){
            this.stream.getAudioTracks()[0].enabled = true;
        }
    }

    disableVideo(){
        if(this.stream && this.stream.getVideoTracks()[0]){
            this.stream.getVideoTracks()[0].enabled = false;
        }
        
    }

    enableVideo(){
        if(this.stream && this.stream.getVideoTracks()[0]){
            this.stream.getVideoTracks()[0].enabled = true;
        }
    }

    isVideoEnabled(){
        if(this.stream && this.stream.getVideoTracks()[0]){
            return this.stream.getVideoTracks()[0].enabled;
        }else{
            return false;
        }
        
    }

    isAudioEnabled(){
        if(this.stream && this.stream.getAudioTracks()[0]){
            return this.stream.getAudioTracks()[0].enabled;
        }else{
            return false;
        }
        
    }

    stop(){

        // Through the MediaStream, you can get the MediaStreamTracks with getTracks():
        if(this.stream){
            const tracks = this.stream.getTracks();

            // Or stop all like so:
            tracks.forEach(track => track.stop());
            this.stream = null;  
        }
       
        
        return true;
    }

    getStream() {
        return this.stream;
    }

}


export default Screen;