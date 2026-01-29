class WebRTCConnectionTest {
    constructor(){

    }

    checkTurnOrStun(ICEServer, timeout){ 
        return new Promise(function(resolve, reject){

            var promiseResolved = false
            , myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection   //compatibility for firefox and chrome
            , pc = new myPeerConnection({iceServers:[ICEServer]})
            , noop = function(){};

            setTimeout(function(){
                if(promiseResolved){
                    if (promiseResolved == 'STUN') resolve('STUN');
                    return;
                }
                resolve(false);
                pc.close();
                promiseResolved = true;
            }, timeout || 5000);

           
            pc.createDataChannel("");    //create a bogus data channel
            pc.createOffer(function(sdp){
            if(sdp.sdp.indexOf('typ relay') > -1){ // sometimes sdp contains the ice candidates...
                promiseResolved = 'TURN'; 
                resolve(true);
            }
            pc.setLocalDescription(sdp, noop, noop);
            }, noop);    // create offer and set local description
            pc.onicecandidate = function(ice){  //listen for candidate events
            if( !ice || !ice.candidate || !ice.candidate.candidate)  return;
            if (ice.candidate.candidate.indexOf('typ relay')!=-1) { promiseResolved = 'TURN'; resolve('TURN'); }
            else if (!promiseResolved && (ice.candidate.candidate.indexOf('typ prflx')!=-1 || ice.candidate.candidate.indexOf('typ srflx')!=-1)){
                promiseResolved = 'STUN';
                if (ICEServer.url.indexOf('turn:')!==0) resolve('STUN');
            }
            else return;
            };
        });   

    }
    
}

export default WebRTCConnectionTest;