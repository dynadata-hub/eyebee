import { BrokenImage } from "@material-ui/icons";

class WebRTCManager {

    constructor(peerId,sessionId,rtcPeerConnFactory,rtcIceCandidateFactory,signalingManager,rtcPeerConfig,eventCallbacks){
        this.peerId = peerId;
        this.turn = false;
        this.sessionId = sessionId;
        this.sfu = false;
        this.assignedSFU = null;
        //this.isHost = isHost;
        this.rtcPeerConfig = rtcPeerConfig;
        this.rtcPeerConnFactory = rtcPeerConnFactory;
        this.rtcIceCandidateFactory = rtcIceCandidateFactory;
        this.localStreams = {};
        this.signalingManager = signalingManager;
        this.localMediaObjects = {};
        this.remoteMediaObjects = {};
        this.eventCallbacks = eventCallbacks;
        this.webrtcConnectionTest = null;
        this.remotePeers = {};
        this.constraints = null;
        this.assignedSFU = null;
        this.listening = false;
        this.clonedStreams = {};
    }

    setEventCallbacks(cbs){
        this.eventCallbacks = cbs;
    }

    setSFU(isSFU){
        this.sfu = isSFU;
    }

    addLocalMedia(streamObj,label){
        console.debug("(wrtcmanager) addLocalMedia! ",{media:streamObj});

        this.localMediaObjects[streamObj.id] = {
            stream:streamObj,
            label: label
        };

        this.signalingManager.emit("peer_media_changed",{
            sessionId: this.sessionId,
            from:this.peerId,
            type:"added",
            label:label,
            streamId:streamObj.id
        });

        let assignedSFUId = this.assignedSFU ? (this.assignedSFU.id ? this.assignedSFU.id : null) : null;

        if(assignedSFUId && this.remotePeers[assignedSFUId].peerConn){
            console.debug("addLocalMedia -- adding media stream into peer connection to assigned SFU ",
            {stream:streamObj,label:label,peerId:this.peerId,assignedSFUId:assignedSFUId});
            this.addMediaToPC(streamObj,this.remotePeers[assignedSFUId].peerConn);
        }
        
        return true;

    }

    addLocalStreamsToPC(localPeerId,assignedSFUId){
        console.debug("addLocalMediaToPC",{localPeerId:localPeerId,assignedSFUId:assignedSFUId});

        let localStreams = Object.keys(this.localMediaObjects);

        let allStreams = [];
            
        localStreams.forEach(s => {
            //let stream = this.localMediaObjects[s];
            allStreams.push(this.localMediaObjects[s].stream);
            
        });

        console.debug("addLocalMediaToPC: los streams locales que agrega",{allStreams:allStreams});

        allStreams.forEach(async stream =>{

            stream.getTracks().forEach( t => {
                                
                console.debug("addLocalMediaToPC: lo que puedo sacar de currloc descr",{cld:this.remotePeers[assignedSFUId].peerConn.currentLocalDescription});

                let transceivers = this.remotePeers[assignedSFUId].peerConn.getTransceivers();

                let trackAlreadyAdded = transceivers.find(ts => {
                    console.debug("addLocalMediaToPC: sender to analyze",{
                        peerId:assignedSFUId,
                        ts:ts,
                        transceiversAlready:transceivers
                    })
                    return ts.sender && ts.sender.track && ts.sender.track.id === t.id;
                });

                console.debug("addLocalMediaToPC: searching if this track was already added",{
                    peerId:assignedSFUId,
                    remotePeer:this.remotePeers[assignedSFUId],
                    remPeerConn:this.remotePeers[assignedSFUId].peerConn,
                    track:t,
                    transceivers:transceivers,
                    trackAlreadyAdded:trackAlreadyAdded
                });

                if(!trackAlreadyAdded){
                    console.debug("addLocalMediaToPC: track not added yet...continue");
                    //this.remotePeers[assignedSFUId].peerConn.addTrack(t, stream);


                    this.remotePeers[assignedSFUId].peerConn.addTransceiver(t,{
                        streams:[stream],
                        direction:"sendonly"
                    });

                    // if(t.kind === "video" && this.constraints && this.constraints.preferredVideoCodecs){
                    //     let allTransceivers = this.remotePeers[assignedSFUId].peerConn.getTransceivers();
                    //     let transceiver = allTransceivers.find(ts => {
                    //         return ts.sender && ts.sender.track === t;
                    //     });
                    //     let filteredVideoCodecs = this.filterVideoCodecs(this.constraints.preferredVideoCodecs);
                        
                    //     transceiver.setCodecPreferences(filteredVideoCodecs);
                    // }
                
                }

            });


        });

        console.log("addLocalMediaToPC: estado posterior a agregar los streams locales al peerconn",{rp:this.remotePeers});

        return true;
    }

    addMediaToPC(streamObj,peerConn){
        console.debug("addMediaToPC -- estado previo a agregar el stream al peerconn",{rp:this.remotePeers});

        streamObj.getTracks().forEach( t => {

            //peerConn.addTrack(t,streamObj);
            peerConn.addTransceiver(t,{
                streams:[streamObj],
                direction:"sendonly"
            });


            // if(t.kind === "video" && this.constraints && this.constraints.preferredVideoCodecs){
            //     let allTransceivers = peerConn.getTransceivers();
            //     let transceiver = allTransceivers.find(ts => {
            //         return ts.sender && ts.sender.track === t;
            //     });
            //     let filteredVideoCodecs = this.filterVideoCodecs(this.constraints.preferredVideoCodecs);
                
            //     transceiver.setCodecPreferences(filteredVideoCodecs);
            // }

        });

        console.log("estado posterior a agregar los streams locales al peerconn",{rp:this.remotePeers});

        return true;
    }

    removeMediaFromPCs(streamObj,keepLocalMedia,peerIds){
        console.debug("removeMediaFromPCs -- el estado de las variables antes de sacar el local media",{stream:streamObj,rp:this.remotePeers});
        let connectedPeers = peerIds ? peerIds : Object.keys(this.remotePeers);
        
        connectedPeers.forEach(pId =>{
            //We don't make a PC with every peer, just with the ones that are SFUs
            //so check if we have a peer connection with this peer first
            if(this.remotePeers[pId].peerConn){
                let transceivers = this.remotePeers[pId].peerConn.getTransceivers();
                transceivers.forEach( trs => {

                    console.log("removeMediaFromPCs -- procesando sender de transceiver",{transceiver: trs,currPeer:this.remotePeers[pId], sender:trs.sender});
                    streamObj.getTracks().forEach( t => {
                        let isSender = trs.sender && trs.sender.track && t.id === trs.sender.track.id;
                        //let isReceiver = trs.receiver && trs.receiver.track && t.id === trs.receiver.track.id;


                        if(isSender){
                            console.log("removeMediaFromPCs -- el sender que va a detener ",{track:t,pId,trs:trs});
                            // await trs.sender.replaceTrack(null);
                            //trs.sender.track.stop();
                            //this.remotePeers[pId].peerConn.removeTrack(trs.sender);

                            trs.stop();
                            
                        }

                        // if(trs.receiver && trs.receiver.track && t.id === trs.receiver.track.id){
                        //     console.log("removeLocalMedia -- detectado receiver de este track, deteniendo transceiver ",{trs:trs,track:trs.receiver.track});
                        //     trs.stop();
                        // }

                        

                       
                    });

                    

                });

            }

            if(this.remotePeers[pId].remoteStreams && this.remotePeers[pId].remoteStreams.length > 0){
                let removedStream = this.remotePeers[pId].remoteStreams.find(rs => {
                    return rs.id === streamObj.id;
                })

                console.log("removeMediaFromPCs -- el filtro del stream para sacarlo de remotePeers",{remotePeer: pId, stream:streamObj,
                    removedStream:removedStream,peerRs:this.remotePeers[pId].remoteStreams});
                
                let removeIndex = this.remotePeers[pId].remoteStreams.indexOf(removedStream);
                
                if(removedStream && removeIndex > 0){
                    this.remotePeers[pId].remoteStreams.splice(removeIndex,1);
                }
                
            }
            
                
        });

       
        if(this.localMediaObjects[streamObj.id] && !keepLocalMedia){

            this.signalingManager.emit("peer_media_changed",{
                sessionId: this.sessionId,
                from:this.peerId,
                type:"deleted",
                label:this.localMediaObjects[streamObj.id].label,
                streamId:streamObj.id
            });

            delete this.localMediaObjects[streamObj.id];
            if(this.eventCallbacks["onLocalMediaRemoved"]){
                this.eventCallbacks["onLocalMediaRemoved"](streamObj.id);
            }
        }

        console.log("el estado de las variables DESPUES de sacar media",{rp:this.remotePeers,lmo:this.localMediaObjects[streamObj.id]});

    }

    removeSenderFromPCs(trackId){
        console.debug("removeSenderFromPCs -- starting ",
        {trackId,rp:this.remotePeers});

        let connectedPeers = Object.keys(this.remotePeers);
        
        connectedPeers.forEach(pId =>{
            //We don't make a PC with every peer, just with the ones that are SFUs
            //so check if we have a peer connection with this peer first
            if(this.remotePeers[pId].peerConn){
                let transceivers = this.remotePeers[pId].peerConn.getTransceivers();

                transceivers.forEach( trs => {

                    console.log("removeSenderFromPCs -- procesando sender de transceiver",{trackId,transceiver: trs,peerId:pId, sender:trs.sender});
                    
                    if(trs.sender && trs.sender.track && trackId === trs.sender.track.id){
                        console.log("removeSenderFromPCs -- el track que va a remover ",{trs:trs,track:trs.sender.track});
                        this.remotePeers[pId].peerConn.removeTrack(trs.sender);
                        trs.stop();
                    }


                });
            }
                
        });

        console.debug("removeSenderFromPCs -- finished ",
        {trackId,rp:this.remotePeers});
        
        return this.remotePeers;
    }


    removeTransceivers(peerId){
        console.debug("removeTransceivers -- starting ",
        {peerId,rp:this.remotePeers});

        let peer = this.remotePeers[peerId];
        if(peer.peerConn){
            let transceivers = peer.peerConn.getTransceivers();

            transceivers.forEach(tr => {
                tr.stop();
            });
            //peer.peerConn.close();

            console.debug("removeTransceivers -- stopped all transceivers of this peer's PC ",
            {peerId,rp:this.remotePeers});

        }else{
            console.debug("removeTransceivers -- we don't have a PC to this peer ",
            {peerId,rp:this.remotePeers[peerId]});
        }

        console.debug("removeTransceivers -- finished ",
        {peerId,rp:this.remotePeers});
        
        return this.remotePeers;
    }

    disconnectRemoteMedia(streamObj,originPeerId){

        if(!this.sfu){

            console.debug("disconnectRemoteMedia -- starting",{
                rp:this.remotePeers,
                stream:streamObj,
                originPeerId: originPeerId
            });

            let sfuIds = Object.keys(this.remotePeers).filter( p => {
                return this.remotePeers[p].sfu
            });
            let peerConn = null;
            let transceivers = null;
            let streamTr = null;
            let tr = null;
            let streamTracks = streamObj.getVideoTracks().concat(streamObj.getAudioTracks());
            let strTrack = null;

            for (let i = 0; i < sfuIds.length; i++) {
               
                peerConn = this.remotePeers[sfuIds[i]].peerConn;
                streamTr = null;
                if(peerConn){
                    transceivers = peerConn.getTransceivers();

                    for (let x = 0; x < transceivers.length; x++) {
                        
                        tr = transceivers[x];
                        streamTr = null;
                        console.log("disconnectRemoteMedia -- el transceiver que esta analizando ",{tr:tr,stream:streamObj,originPeerId:originPeerId});
                        for (let y = 0; y < streamTracks.length; y++) {
                            strTrack = streamTracks[y];

                            if(tr.receiver && tr.receiver.track && tr.receiver.track.id === strTrack.id){
                                streamTr = tr;
                                console.log("disconnectRemoteMedia -- transceiver encontrado! ",{streamTrack: strTrack,tr:tr,originPeerId:originPeerId});
                                break;
                            }
                        }
                        if(streamTr){
                            tr.stop();
                        }
                        

                    }

                    if(streamTr){
                        break;
                    }
                    

                    //console.log("removeLocalMedia -- el track que va a remover ",{track:trs.sender.track});
                    //this.remotePeers[pId].peerConn.removeTrack(trs.sender);
                    //trs.stop();

                }
            
                
            }

            if(this.remotePeers[originPeerId].remoteStreams && this.remotePeers[originPeerId].remoteStreams.length > 0){
                let removedStream = this.remotePeers[originPeerId].remoteStreams.find(rs => {
                    return rs.id === streamObj.id;
                })

                console.log("disconnectRemoteMedia -- el filtro del stream para sacarlo de remotePeers",{remotePeer: originPeerId, stream:streamObj,
                    removedStream:removedStream,peerRs:this.remotePeers[originPeerId].remoteStreams});
                
                let removeIndex = this.remotePeers[originPeerId].remoteStreams.indexOf(removedStream);
                
                if(removedStream && removeIndex > 0){
                    this.remotePeers[originPeerId].remoteStreams.splice(removeIndex,1);

                    this.signalingManager.emit("peer_stream_removed",{
                        sessionId: this.sessionId,
                        from:this.peerId,
                        label:this.remotePeers[originPeerId].localStreams[streamObj.id].label,
                        originPeerId:originPeerId,
                        streamId:removedStream.id
                    });

                }
                
            }

            console.debug("disconnectRemoteMedia -- end",{
                rp:this.remotePeers,
                stream:streamObj,
                originPeerId: originPeerId
            });
        }

    }

    async makeOffer(remotePeerId){

        if(!this.remotePeers[remotePeerId]){
            return null;
        }

        try {
            this.remotePeers[remotePeerId].makingOffer = true;
            await this.remotePeers[remotePeerId].peerConn.setLocalDescription();
            this.remotePeers[remotePeerId].polite = true;
            let localSDP = this.remotePeers[remotePeerId].peerConn.localDescription;

            //Proposal: limit bandwidth
            // if(this.constraints && this.constraints.bandwidthKbps){
                
            //     localSDP = this.adjustBandwidth(this.remotePeers[remotePeerId].peerConn,this.constraints.bandwidthKbps);
            // }
            
            
            this.signalingManager.emit("peer_webrtc_message",{
                from:this.peerId,
                isSFU:this.sfu,
                target: remotePeerId,
                type:"description",
                data:{
                    description:this.remotePeers[remotePeerId].peerConn.localDescription
                }
            });

        } catch(err) {
          console.error(err);
        } finally {
            this.remotePeers[remotePeerId].makingOffer = false;
        }
        return this.remotePeers[remotePeerId];
    }

    addStreamsToPC(streams,peerId){
        console.debug("addStreamsToPC -- adding streams to peer connection",{peerId:peerId,streams:streams});
        
        let newPC = false;
        streams.forEach(stream => {
            
            stream.getTracks().forEach( async t => {

                if(this.remotePeers[peerId]){  

                   
                    if(!this.remotePeers[peerId].peerConn){
                        console.log("addStreamsToPC -- this peer does not have a peer connection yet with the remote one!",
                        {
                            peerIdToSend:peerId,
                            peerToSend:this.remotePeers[peerId],
                        })

                        this.createPeerConnection(peerId);
                        newPC = true;
                    }

                    console.debug("addStreamsToPC -- we have a peer connection with this peer...",{peerId:peerId,peerConn:this.remotePeers[peerId].peerConn});
                    let transceivers = this.remotePeers[peerId].peerConn.getTransceivers();

                    let trackAlreadyAdded = transceivers.find(ts => {
                        console.debug("addStreamsToPC -- sender to analyze",{
                            peerId:peerId,
                            ts:ts,
                            transceiversAlready:transceivers
                        })
                        return ts.sender && ts.sender.track && ts.sender.track.id === t.id;
                    });
    
                    console.debug("addStreamsToPC -- searching if this track was already added",{
                        peerId:peerId,
                        remotePeer:this.remotePeers[peerId],
                        remPeerConn:this.remotePeers[peerId].peerConn,
                        track:t,
                        transceivers:transceivers,
                        trackAlreadyAdded:trackAlreadyAdded
                    });
    
                    if(!trackAlreadyAdded){
                        console.debug("addStreamsToPC -- track not added yet...continue");

                        //this.remotePeers[peerId].peerConn.addTrack(t, stream);

                        this.remotePeers[peerId].peerConn.addTransceiver(t,{
                            streams:[stream],
                            direction:"sendonly"
                        });
    
                        // if(t.kind === "video" && this.constraints && this.constraints.preferredVideoCodecs){
                        //     let allTransceivers = this.remotePeers[peerId].peerConn.getTransceivers();
                        //     let transceiver = allTransceivers.find(ts => {
                        //         return ts.sender && ts.sender.track === t;
                        //     });
                        //     let filteredVideoCodecs = this.filterVideoCodecs(this.constraints.preferredVideoCodecs);
                            
                        //     transceiver.setCodecPreferences(filteredVideoCodecs);
                        // }
                       
                       
                    }else{

                        //trying to replace the existing track
                        try{
                            console.debug("addStreamsToPC -- attempting to replace sender with this track",
                            {peerId:peerId,transceiver:trackAlreadyAdded,replacingTrack:t});
                            await trackAlreadyAdded.sender.replaceTrack(t,stream);
                        }catch(err){
                            console.debug("addStreamsToPC -- could not replace track on this sender",{peerId:peerId,sender:trackAlreadyAdded.sender});
                        }
                    }


                    if(newPC){
                        console.log("addPeerStreamToPC -- this is a new PC...making offer",{peerId});
                        this.makeOffer(peerId).then(() => {
                            console.log("addPeerStreamToPC -- finished making offer for this new PC",{peerId});
        
                        }).catch(err => {
                            console.error("addPeerStreamToPC --error making offer for this new PC",{peerId,err});
                        });
                    }

                }else{
                    console.warn("addStreamsToPC -- couldn't add stream to pc. No Pc found to this peer",{peerId: peerId,remotePeer:this.remotePeers[peerId]});
                }

            });
        });

        return true;
    }

    getAllRemoteStreams(excludedPeerId){
        let allStreams = [];

        Object.keys(this.remotePeers).filter( p => {
            if(p !== excludedPeerId){
                return true;
            }
        }).forEach(p => {

            if(this.remotePeers[p].remoteStreams){
                allStreams = allStreams.concat(this.remotePeers[p].remoteStreams);
            }

        });

        return allStreams;
    }

    addToPeerRemoteStreams(stream,peerId){

        if(!this.remotePeers[peerId]){
            console.warn("addToPeerRemoteStreams -- peer not found in remotePeers",{peerId:peerId,stream:stream,remotePeers:this.remotePeers});
            return false;
        }

        if(!this.remotePeers[peerId].remoteStreams){
            this.remotePeers[peerId].remoteStreams = [];
        }

        let strFound = this.remotePeers[peerId].remoteStreams.filter(s => {
            if(s.id === stream.id){
                return true;
            }
        });

        console.debug("addToPeerRemoteStreams -- el valor de strFound",{peer:this.remotePeers[peerId],peerId: peerId,strFound:strFound});

        if(!strFound[0]){
            console.debug("stream not found... add it to peer's remoteStreams",{peerId:peerId,stream:stream,peerRS:this.remotePeers[peerId].remoteStreams});
            this.remotePeers[peerId].remoteStreams.push(stream);

            return true;

        }else{
           
            console.debug("stream already added to peer's remoteStreams",{peer:this.remotePeers[peerId],peerId:peerId,stream:stream,peerRS:this.remotePeers[peerId].remoteStreams});
            return false;
        }

    }

    async removePeerLocalStreamsReferences(peerId,streamId,resend){

        if(!this.remotePeers[peerId]){
            console.warn("removePeerLocalStreamsReferences -- peer not found in remotePeers",{peerId:peerId,
                remotePeers:this.remotePeers});
                return null;
        }

        if(this.remotePeers[peerId].localStreams){

            if(this.remotePeers[peerId].remoteStreams && this.remotePeers[peerId].remoteStreams.length > 0){

                let peerLocalStreamIds = Object.keys(this.remotePeers[peerId].localStreams);
                if(streamId){
                    peerLocalStreamIds = peerLocalStreamIds.filter( plsid => {
                        return plsid === streamId;
                    });
                }
                
                peerLocalStreamIds.forEach(lsId => {


                    let localStream = this.remotePeers[peerId].remoteStreams.find( rs => {
                        return rs.id === lsId;
                    });

                    this.removeMediaFromPCs(localStream,true);
                    
                });

                this.remotePeers[peerId].remoteStreams = this.remotePeers[peerId].remoteStreams.filter( rs => {
                    return peerLocalStreamIds.indexOf(rs.id) === -1;
                });

                console.debug("removePeerLocalStreamsReferences -- removed  this local stream id "+
                "from peer's remoteStreams references",{
                    peerId: peerId,
                    peerLocalStreamIds: peerLocalStreamIds,
                    remotePeer:this.remotePeers[peerId]
                });

                
                

            }else{
                console.warn("removePeerLocalStreamsReferences -- this remote peer does not have any remoteStreams reference",{peerId:peerId,
                    remotePeer:this.remotePeers[peerId]});
            }

            
            if(resend){
                await this.timeout(1000);

                console.debug("removePeerLocalStreamsReferences -- resend is set... sending request peer stream event"
                ,{
                    target: peerId,
                    targetStreamId: streamId,
                    resend:resend
                });

                this.requestPeerStream(peerId,streamId);
            }

            
        }else{
            console.warn("removePeerLocalStreamsReferences -- this remote peer does not have localStreams reference",{peerId:peerId,
                remotePeers:this.remotePeers});
        }

        return this.remotePeers[peerId];

    }

    findPeerStreamId(peerId,streamId){

        console.log("findPeerStreamId -- comenzando... ",{
            peerId:peerId,
            streamId:streamId,
            rp:this.remotePeers
        });

        let linkedStreamIds = [];
        let localStreamId = this.remotePeers[peerId].remoteStreams[streamId];
        if(localStreamId){
            linkedStreamIds.push(streamId);
           
        }
        

            //find also local clones of this streams
            let connectedPeerIds = Object.keys(this.remotePeers);
            for(let i=0; i < connectedPeerIds.length; i++){
                let pId = connectedPeerIds[i];

                //this.remotePeers[targetPeerId].locallyClonedStreams[streamOriginPeerId][originStreamId].clonedStreamIds
               
               
                let localClones = this.remotePeers[pId].locallyClonedStreams;

                if(localClones){
                    let originLocalClones = localClones[peerId];

                    if(originLocalClones[streamId]){
                        linkedStreamIds =  linkedStreamIds.concat(originLocalClones[streamId].clonedStreamIds);
                        
                    }

                }
                
            }

           return linkedStreamIds;

        
    }

    replaceTrackInPCs(track,stream){
        let peerIds = Object.keys(this.remotePeers);
        peerIds.forEach( async p => {
            let peerConn = this.remotePeers[p].peerConn;
            if(peerConn){
                let senders = peerConn.getSenders();
                if(senders && senders.length > 0){
                    let sender = senders.find(sender => {
                        console.debug("replaceTrackInPCs -- sender to analyze",{
                            peerId:p,
                            sender:sender,
                            track:track
                        });
                        return sender.track && sender.track.id === track.id;
                    });

                    if(sender){

                        try{
                            console.debug("replaceTrackInPCs -- attempting to replace sender with this track",
                            {peerId:p,sender:sender,track:track});
                            await sender.replaceTrack(track,stream);
                        }catch(err){
                            console.debug("replaceTrackInPCs -- could not replace track on this sender",{peerId:p,sender:sender,track:track,error:err});
                        }
                    }
                    

                }   
                
                
            }
            
        });
    }

    createPeerConnection(peerId,includeLocalMedia){

        console.log("Creating peer connection with "+peerId+" "+includeLocalMedia);
        
        if(!this.remotePeers[peerId]){
            this.remotePeers[peerId] = {};
        }
        this.remotePeers[peerId].peerConn = new RTCPeerConnection(this.rtcPeerConfig);

        let allStreams = [];

        if(includeLocalMedia){
            console.log("This peer is our assignedSFU...add localmedia to PC",{peerId:peerId});
            let localStreams = Object.keys(this.localMediaObjects);
            
            localStreams.forEach(s => {
                //let stream = this.localMediaObjects[s];
                allStreams.push(this.localMediaObjects[s].stream);
                
    
            });
        }

        console.log("lo que termina siendo allsTreams",{as:allStreams});
        this.addStreamsToPC(allStreams,peerId);

        this.remotePeers[peerId].peerConn.onicecandidate = ({candidate}) => {

            if (!candidate) {
                console.log('Got final candidate!');
                return;
            }

            this.signalingManager.emit("peer_webrtc_message",{
                from:this.peerId,
                isSFU:this.sfu,
                target: peerId,
                type:"ice_candidate",
                data:{
                    candidate:candidate
                }
            });
        };

        this.remotePeers[peerId].peerConn.ontrack = ({track, streams}) => {

            console.debug("ontrack -- aparece un track nuevo en la pc",{peerId:peerId,track:track,streams:streams,remPeers:this.remotePeers});

            let assignedSFUId =  this.assignedSFU ?  ( this.assignedSFU.id ?  this.assignedSFU.id : null ) : null;
            console.debug("ontrack -- comenzando...  ",{peerId:peerId, assignedSFUId: assignedSFUId, rp:this.remotePeers,streams:streams});
            
            let streamOriginPeerId = Object.keys(this.remotePeers).filter(p => {
                if(this.remotePeers[p].localStreams && this.remotePeers[p].localStreams[streams[0].id]){
                    return true;
                }
            })[0];
            console.debug("ontrack -- peer origen de este stream",{streamOriginPeerId:streamOriginPeerId});
            let originStreamId = null;

            //check if origin peer is found, maybe it was removed just before this event occurred 
            if(!streamOriginPeerId){

                let clonedPeerIds = this.remotePeers[peerId].clonedStreams ? Object.keys(this.remotePeers[peerId].clonedStreams) : [];
                let peerClonedStreamIds = null;
                let peerClonedStreamRef = null;
                console.debug("ontrack -- stream not found in peer's local streams reference .. searching in cloned streams in this peer",{clonedPeerIds:clonedPeerIds,rp:this.remotePeers,streamOriginPeerId:streamOriginPeerId,streams:streams});
                for(let i=0; i< clonedPeerIds.length;i++){
                    peerClonedStreamIds = Object.keys(this.remotePeers[peerId].clonedStreams[clonedPeerIds[i]]);
                    
                    for(let x=0; x < peerClonedStreamIds.length; x++){
                        peerClonedStreamRef = this.remotePeers[peerId].clonedStreams[clonedPeerIds[i]][peerClonedStreamIds[x]];
                       
                        if(peerClonedStreamRef.clonedStreamIds.indexOf(streams[0].id) !== -1 ){
                            console.debug("ontrack -- origin peer id and stream id found!",{peerId:peerId,remotePeer:this.remotePeers[peerId]});
                            originStreamId = peerClonedStreamIds[x];
                            streamOriginPeerId = clonedPeerIds[i];
                            break;
                        }
                    }

                    if(streamOriginPeerId){
                        break;
                    }
                }
                
                if(!streamOriginPeerId){
                    console.debug("ontrack -- peer origen de este stream no encontrado",{rp:this.remotePeers,streamOriginPeerId:streamOriginPeerId,streams:streams});
                    return true;   
                }
                 
            }else{
                originStreamId = streams[0].id;
            }

            console.debug("ontrack -- busqueda finalizada",
            {rp:this.remotePeers,streamOriginPeerId:streamOriginPeerId,originStreamId:originStreamId})

            let added = this.addToPeerRemoteStreams(streams[0],streamOriginPeerId);  

            if(added){
                console.debug("createPeerConnection -- ontrack: new stream added",{streamOriginPeerId:streamOriginPeerId,
                    t:track,ss:streams,peerLocalStreams: this.remotePeers[peerId].localStreams});
                    
            }
            
            
            
            if(added && this.sfu && assignedSFUId){

                console.debug("ontrack -- el stream fue agregado con exito",{peerId:peerId,sfuId:assignedSFUId,assignedSFU:this.assignedSFU,stream:streams[0],peerLocalStreams:this.remotePeers[peerId].localStreams});
                if(this.remotePeers[peerId].assignedSFU === this.peerId){
                    console.debug("ontrack -- el stream pertenece al peer origen, significa que soy la sfu de este peerId ",{peerId:peerId, originPeer:streamOriginPeerId});
                }
              
            }

            if(added){
                let streamLabel = this.remotePeers[streamOriginPeerId].localStreams[originStreamId].label;
               
                console.debug("ontrack -- emitiendo evento ws peer_stream_loaded",{originPeerId:streamOriginPeerId,peerId:peerId,sfuId:assignedSFUId,assignedSFU:this.assignedSFU,stream:streams[0],peerLocalStreams:this.remotePeers[peerId].localStreams});
                this.signalingManager.emit("peer_stream_loaded",{
                    sessionId: this.sessionId,
                    senderPeerId: peerId,
                    streamLabel: streamLabel,
                    originPeerId:streamOriginPeerId,
                    originStreamId: originStreamId,
                    peerId:this.peerId,
                    streamId: streams[0].id
                });

                this.eventCallbacks["onStreamLoaded"](streamOriginPeerId,streams[0],streamLabel);

                // if(streamLabel !== "camera" && this.remotePeers[streamOriginPeerId].mainPresenter){
                //     this.eventCallbacks["onMPStreamLoaded"](streamOriginPeerId,streams[0],streamLabel);
                // }   
                
            }

           

            track.onunmute = () => {

                this.eventCallbacks["onRemoteTrack"](streamOriginPeerId,track,streams[0]);
                
                // else{
                //     this.replaceTrackInPCs(track,streams[0]);
                // }

            };

        };

        this.remotePeers[peerId].peerConn.oniceconnectionstatechange = () => {
            if (this.remotePeers[peerId] && this.remotePeers[peerId].peerConn.iceConnectionState === "failed") {
                console.error("ICE FAIL",{peer:this.remotePeers[peerId]});
                this.remotePeers[peerId].peerConn.restartIce();
            }
        };

        this.remotePeers[peerId].peerConn.onnegotiationneeded = async () => {
           
            await this.makeOffer(peerId);
        };

        this.remotePeers[peerId].peerConn.onconnectionstatechange = () => {
            console.debug("connection state changed!",{state: this.remotePeers[peerId].peerConn.connectionState})
            if(this.remotePeers[peerId].peerConn.connectionState === "closed"){
                this.remotePeers[peerId].peerConn = null;
                delete this.remotePeers[peerId];
            }
           
        };

        return this.remotePeers[peerId].peerConn;

    }

    filterVideoCodecs(preferredCodecs){
        const {codecs} = RTCRtpSender.getCapabilities('video');
        
        let finalCodecList = [];
        codecs.forEach(codec => {

            if (['video/red', 'video/ulpfec', 'video/rtx'].includes(codec.mimeType)) {
                return;
            }

            if(preferredCodecs.includes(codec.mimeType)){    
                finalCodecList.push(codec);
            }

        });
        let aux = [...finalCodecList];
        finalCodecList=[];
        preferredCodecs.forEach(e => {
            console.log("el codec a analizar ",{e:e});
            
          
            let filteredList = aux.filter(c => {
               
                return c.mimeType === e;
            });
            finalCodecList = finalCodecList.concat(filteredList);

        });

        return finalCodecList;
    }

    getPCToPeer(peerId){
        return this.remotePeers[peerId] ? this.remotePeers[peerId].peerConn : null;
    }


    addPeerStreamToPC(peerId, targetPeerId,loadedStreamId, targetLocalStreams) {
        console.log("addPeerStreamToPC -- entrando a la función", { peerId: peerId, 
            rp: this.remotePeers[peerId],
            targetRemPeer:this.remotePeers[targetPeerId], 
            loadedStreamId:loadedStreamId,
            target: targetPeerId, targetLocalStreams: targetLocalStreams });

        if (this.remotePeers[peerId] ) {
            let newPC = false;
            if(!this.remotePeers[peerId].peerConn){
                console.log("addPeerStreamToPC -- this peer does not have a peer connection yet with the remote one!",
                {
                    peerIdToSend:peerId,
                    peerToSend:this.remotePeers[peerId],
                    targetPeer: this.remotePeers[targetPeerId]
                })

                this.createPeerConnection(peerId);
                newPC = true;
            }

            //let targetLocalStreams = this.remotePeers[targetPeerId].localStreams;
            let targetRemoteStreams ;
            if(loadedStreamId){
                targetRemoteStreams = this.remotePeers[targetPeerId].remoteStreams.filter(rs => {
                    if(rs.id === loadedStreamId){
                        return true;
                    }
                });
            }else{
                targetRemoteStreams = this.remotePeers[targetPeerId].remoteStreams;
            }
           
            let allStreams = [];
            console.log("addPeerStreamToPC -- streams locales y remotos de target", {
                rPeers: this.remotePeers,
                loadedStreamId:loadedStreamId,
                peerId: peerId, target: targetPeerId, 
                originalTargetRemStreams:this.remotePeers[targetPeerId].remoteStreams,
                targetRemoteStreams: targetRemoteStreams, 
                targetLocalStreams: targetLocalStreams
            });
            //let peerIds = Object.keys(this.remotePeers);


            Object.keys(targetLocalStreams).forEach(s => {
                console.log("addPeerStreamToPC -- buscando stream local en remote streams", {
                    s: s,
                    loadedStreamId:loadedStreamId,
                    peerId: peerId, target: targetPeerId, 
                    targetRemoteStreams: targetRemoteStreams, 
                    targetLocalStreams: targetLocalStreams
                });
                let str = targetRemoteStreams.filter(r => {
                    if (r.id === s) {
                        return true;
                    }
                });

                console.log("verificando...",{
                    str:str,

                })

                if(str && str[0]){

                    //let clonedStream = this.clonePeerStream(str[0],peerId,targetPeerId,s);

                    console.log("addPeerStreamToPC -- resultado del filtrado", {
                        s: s,
                        str: str,
                        //clonedStream:clonedStream,
                        peerId: peerId, target: targetPeerId, targetRemoteStreams: targetRemoteStreams, targetLocalStreams: targetLocalStreams
                    });
    
                   //allStreams.push(clonedStream);
                   allStreams.push(str[0]);
                }
                

            });

            console.log("addPeerStreamToPC -- paso localstreams y tiene este result",{allStreams:allStreams});

            console.log("addPeerStreamToPC -- todos los streams que va a agregar a la peerConn", {
                allStreams: allStreams,
                peerId: peerId, target: targetPeerId, targetRemoteStreams: targetRemoteStreams, targetLocalStreams: targetLocalStreams
            });
            this.addStreamsToPC(allStreams, peerId);
            if(newPC){
                console.log("addPeerStreamToPC -- this is a new PC...making offer",{peerId});
                this.makeOffer(peerId).then(() => {
                    console.log("addPeerStreamToPC -- finished making offer for this new PC",{peerId});

                }).catch(err => {
                    console.error("addPeerStreamToPC --error making offer for this new PC",{peerId,err});
                });
            }
        } else {
            console.warn("addPeerStreamToPC -- no se encontró el peer id en remotePeers", {
                peerId: peerId, target: targetPeerId, rPeers: this.remotePeers
            });
        }
    }

    listenToWebRTCMessages(){
        console.debug("escuchando webrtc_messages que lleguen");
        this.listening = true;
        this.signalingManager.on("peer_webrtc_message",async message => {

            let connectionData = null;

            if(this.remotePeers[message.from]){
                
                if(!this.remotePeers[message.from].peerConn){
                   
                    let sendLocalMedia = false;
                    if(!this.assignedSFU && message.isSFU ){
                        sendLocalMedia = true;
                        this.assignedSFU = message.from;
                        console.log("listenToWebRTCMessages -- sending set_target_sfu 1");
                        this.signalingManager.emit("set_target_sfu",{
                            userId:this.peerId,
                            selectedSFU: message.from
                        });
                    }

                    this.createPeerConnection(message.from,sendLocalMedia);
                }

                connectionData  = this.remotePeers[message.from];
            }else{
                this.remotePeers[message.from] = {};
                let sendLocalMedia = false;
                if(!this.assignedSFU  && message.isSFU ){
                    sendLocalMedia = true;
                    this.assignedSFU = message.from;
                    console.log("listenToWebRTCMessages -- sending set_target_sfu 2");
                    this.signalingManager.emit("set_target_sfu",{
                        userId:this.peerId,
                        selectedSFU: message.from
                    });
                }

                this.createPeerConnection(message.from,sendLocalMedia);
                connectionData = this.remotePeers[message.from];

            }

            //this.remotePeers[message.from].sfu = message.isSFU;

            

            if(message.type === "description"){

                const offerCollision = (message.data.description.type == "offer") &&
                (connectionData.makingOffer || connectionData.peerConn.signalingState != "stable");


                console.debug("description state",{peerId:message.from,isSFU:message.isSFU,pol: connectionData.polite, ofCol: offerCollision,dtype: message.data.description.type,mo:connectionData.makingOffer,ss:connectionData.peerConn.signalingState })
    
                connectionData.ignoreOffer = !connectionData.polite && offerCollision;
    
                if (connectionData.ignoreOffer) {
                    console.debug("offer ignored!",{
                        ...message
                    });
                    return;
                }

                await connectionData.peerConn.setRemoteDescription(message.data.description);

                if (message.data.description.type == "offer") {
                    console.debug("el description que mandaron es un offer...preparando la respuesta",{
                        ...message
                    });
                    await connectionData.peerConn.setLocalDescription();

                    let localSDP = connectionData.peerConn.localDescription;

                    console.debug("peerConn",{ld:localSDP});

                    this.signalingManager.emit("peer_webrtc_message",{
                        from:this.peerId,
                        isSFU:this.sfu,
                        target: message.from,
                        type:"description",
                        data:{
                            description:localSDP
                        }
                    });
                }

            }else if(message.type === "ice_candidate"){
                try {
                    await this.remotePeers[message.from].peerConn.addIceCandidate(new RTCIceCandidate(message.data.candidate));
                    } catch(err) {
                        console.error(err);
                    if (!connectionData.ignoreOffer) {
                        
                      throw err;
                    }
                }
                
            }

        });

        this.signalingManager.on("send_peer_stream",async message => {
            console.debug("recibiendo mensaje ws: send_peer_stream",{message:message})
            this.addPeerStreamToPC(message.peerId,message.target,message.loadedStreamId,message.targetLocalStreams);
        });

        // this.signalingManager.on("cloned_stream",async message => {
        //     console.debug("recibiendo mensaje ws: cloned_stream",{message: message})
        //     this.updatePeerClonedStream(message);
        // });

        this.signalingManager.on("request_stream",async message => {
            console.log("recibiendo mensaje ws: request_stream",{message: message})
            this.requestPeerStream(message.targetPeerId,message.targetStreamId);
        });

        this.signalingManager.on("peer_streams_remove_request",async message => {
            console.log("recibiendo mensaje ws: peer_streams_remove_request",{message: message})
            this.removePeerLocalStreamsReferences(message.peerId,message.streamId,message.resend);
        });

        this.signalingManager.on("remove_transceivers_request",async message => {
            console.log("recibiendo mensaje ws: remove_transceivers_request",{message: message})
            this.removeTransceivers(message.peerId);
        });


    }

    timeout(millis) {
        let prom = new Promise((resolve,reject) => {
            setTimeout(() => {
                resolve();
            },millis || 1000);
        });
        return prom;
    }

    updatePeerLocalStreams(peerId,localStreams){
        console.debug("webrtcManager -- updating localStreams reference of peer "+peerId,{ls:localStreams})
        if(!this.remotePeers[peerId]){
            this.remotePeers[peerId] = {};
        }

        this.remotePeers[peerId].localStreams = localStreams;
    }

    updatePeerAssignedSFU(peerId,assignedSFU){
        console.debug("webrtcManager -- updating peer assigned SFU "+peerId,{assignedSFU:assignedSFU})
        // if(!this.remotePeers[peerId]){
        //     this.remotePeers[peerId] = {};
        // }
        if(this.remotePeers[peerId]){
            this.remotePeers[peerId].assignedSFU = assignedSFU;
        }
        
    }

    updatePeerSFUOrder(peerId,order){
        console.log("webrtcManager -- updating peer SFU order "+peerId,{order:order})
        if(!this.remotePeers[peerId]){
            this.remotePeers[peerId] = {};
        }

        this.remotePeers[peerId].sfu = true;
        this.remotePeers[peerId].sfuOrder = order;
    }

    updateMainPresenter(peerId){
        console.log("webrtcManager -- updating session's main presenter: "+peerId)
        if(!this.remotePeers[peerId]){
            this.remotePeers[peerId] = {};
        }

        this.remotePeers[peerId].mainPresenter = true;
    }

    updateOwner(peerId){
        console.log("webrtcManager -- updating session's owner: "+peerId);
        if(!this.remotePeers[peerId]){
            this.remotePeers[peerId] = {};
        }

        this.remotePeers[peerId].owner = true;
    }


    async startWebRTCConnections(assignedSFUPeer,restOfSFUs,connConstraints){

        if(assignedSFUPeer && restOfSFUs){

            this.assignedSFU = assignedSFUPeer;

            this.createPeerConnection(assignedSFUPeer.id,  true);

            await this.makeOffer(assignedSFUPeer.id);

            for(let i=0; i< restOfSFUs.length; i++){
                console.debug("peer to send offer ",{peer:restOfSFUs[i],assignedSFUPeer:assignedSFUPeer});
                //let includeLocalMedia = assignedSFUPeer.id === restOfSFUs[i].id;
                this.createPeerConnection(restOfSFUs[i].id,  false);

                let result = await this.makeOffer(restOfSFUs[i].id);

                //await this.timeout(1000);
            }


            // this.createPeerConnection(sfuPeer.id);

            // let result = await this.makeOffer(sfuPeer.id);
        }

        // this.createPeerConnection(assignedSFUPeer.id,true);

        //     let result = await this.makeOffer(assignedSFUPeer.id);



        
        // for(let i=0; i< remotePeers.length; i++){
        //     console.debug("peer to send offer ",{peer:remotePeers[i]});

        //     this.createPeerConnection(remotePeers[i].id);

        //     let result = await this.makeOffer(remotePeers[i].id);

        //     await this.timeout(1500);
        // }
      
        return true;
    }


    async requestPeersStreams(peers,owner,presenter){
        console.log("requestPeersStreams -- entering",{peers:peers});

        let otherPeersIds = Object.keys(peers).filter(p => {
            
            if(p !== this.peerId && peers[p].assignedSFU !== this.peerId) return true;
        });

        if(!presenter){
            otherPeersIds = otherPeersIds.filter(p => {
                return peers[p].presenter;
            })
        }
         

        console.log("requestPeersStreams -- filtering list to get other peers",{otherPeersIds:otherPeersIds});

        if(otherPeersIds && otherPeersIds.length > 0){


            for (let i = 0; i < otherPeersIds.length; i++) {
                let p = otherPeersIds[i];
                
                console.log("requestPeersStreams -- sending ws event peer_stream_requested ",{peerId:this.peerId,target:p});
                if(!this.remotePeers[p]){
                    this.remotePeers[p] = {};
                }

                this.remotePeers[p].localStreams = peers[p].localStreams;
                this.remotePeers[p].mainPresenter = peers[p].mainPresenter;
                this.remotePeers[p].owner = peers[p].owner;


                console.log("requestPeersStreams -- por extraer el id de camara buscado",{
                    peer:p,
                    localStreams:peers[p].localStreams,
                });

                if(peers[p].localStreams && Object.keys(peers[p].localStreams).length > 0){

                    let reqStreamIds = this.sfu ? Object.keys(peers[p].localStreams)  : Object.keys(peers[p].localStreams).filter( ls => {
                        return peers[p].localStreams[ls].label === "camera";
                    });
    
                    console.log("requestPeersStreams -- los streamIds que va a solicitar de este peer",{
                        peer:p,
                        reqStreamIds:reqStreamIds,
                    });

                    for (let x = 0; x < reqStreamIds.length; x++) {
                        let sId = reqStreamIds[x];

                        this.signalingManager.emit("peer_stream_requested",{
                            peerId: this.peerId,
                            sessionId: this.sessionId,
                            type:"send_peer_stream",
                            streamId: sId,
                            target: p
                        });

                        await this.timeout(1000);

                        
                    }


                    // let reqStreamId =  Object.keys(peers[p].localStreams).filter( ls => {
                    //     return peers[p].localStreams[ls].label === "camera";
                    // })[0];
    
                    // console.log("requestPeersStreams -- el streamId que va a solicitar para este peer",{
                    //     peer:p,
                    //     reqStreamId:reqStreamId,
                    // });
                    
                    // setTimeout(() => {
                    //     this.signalingManager.emit("peer_stream_requested",{
                    //         peerId: this.peerId,
                    //         sessionId: this.sessionId,
                    //         type:"send_peer_stream",
                    //         streamId: reqStreamId,
                    //         target: p
                    //     });
                    // },1000);
                    
                }

            }
            
            
        }else{
            console.log("No other peers to retrieve",{peers:peers,otherPeersIds:otherPeersIds})
        }


        //this.remotePeers[this.assignedSFU.id].localStreams = peers[this.assignedSFU.id].localStreams;

        // this.signalingManager.emit("peer_stream_requested",{
        //     peerId: this.peerId,
        //     sessionId: this.sessionId,
        //     type:"send_peer_stream",
        //     target: this.assignedSFU.id
        // });


    }

    requestPeerStream(targetPeerId,reqStreamId){
        this.signalingManager.emit("peer_stream_requested",{
            peerId: this.peerId,
            sessionId: this.sessionId,
            type:"send_peer_stream",
            streamId: reqStreamId,
            target: targetPeerId
        });
    }

    async closePeerConnection(peer,closeTransceivers){
        console.debug("closePeerConnection -- closing peer connection",{peer:peer,remotePeers:this.remotePeers});
         let leavingPeer = this.remotePeers[peer.peerId];

            //let leavingPeerLocalStreams = leavingPeer.localStreams;

            if(leavingPeer.peerConn){

                if(closeTransceivers){
                    let transceivers = leavingPeer.peerConn.getTransceivers();
                    transceivers.forEach(t => {
                        t.stop();
                    });
                }

                leavingPeer.peerConn.close();
            }

            this.remotePeers[peer.peerId].peerConn = null;
            delete this.remotePeers[peer.peerId];

        console.debug("closePeerConnection -- el estado final de remotepeers",{rp:this.remotePeers});

        return peer.userId;

    }

    closeAllPCs() {
        let peerIds = Object.keys(this.remotePeers);

        peerIds.forEach(pId => {
            this.closePeerConnection({
                peerId:pId
            },true);
        });
    }

    async testNAT(){
        try{
            await this.webrtcConnectionTest.checkTurnOrStun({"url": "stun:stun.l.google.com:19302"});
            this.turn = false;
        }catch(err){
            console.error(err);
            this.turn = true;
        }

        return {
            turn: this.turn
        }
        
    }


}

export default WebRTCManager;