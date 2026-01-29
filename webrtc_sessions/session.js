class Session {
    constructor() {

    }

    /**
     * Removes any reference the other peers have of this peer's streamId. 
     * This method does not remove the given originPeerId from the peers object.
     * @param {*} peers 
     * @param {*} originPeerId 
     * @param {*} originStreamId 
     * @returns The modified peers object with the origin peerId and streamId removed from the other peers
     */
    removePeerStreamReferences(peers, originPeerId, originStreamId) {
        let peerIds = Object.keys(peers);


        peerIds.forEach(pId => {
            let peerDs = peers[pId].downstream;
            let peerDsIds = peerDs ? Object.keys(peerDs) : [];
            if(peers[pId].assignedPeers && peers[pId].assignedPeers.indexOf(originPeerId) !== -1){
                peers[pId].assignedPeers.splice(peers[pId].assignedPeers.indexOf(originPeerId),1);
            }
           
            peerDsIds.forEach(pDsId => {
                if(pDsId === originPeerId && !originStreamId){
                    delete peers[pId].downstream[pDsId];
                }else{
                    let peerDsStreams = peers[pId].downstream[pDsId];
                    if(!peerDsStreams){
                        return false;
                    }
                    let streamIds = Object.keys(peerDsStreams);

                    for (let i = 0; i < streamIds.length; i++) {

                        let sId = streamIds[i];

                        let origin = peers[pId].downstream[pDsId][sId];

                        if (origin.originPeerId === originPeerId) {

                            if(originStreamId){
                                if(origin.originStreamId === originStreamId){
                                    delete peers[pId].downstream[pDsId][sId];
                            
                            
                                    if (Object.keys(peers[pId].downstream[pDsId]).length === 0) {
                                        
                                        delete peers[pId].downstream[pDsId];
                                    }

                                    break;
                                }
                            }else{
                              
                                delete peers[pId].downstream[pDsId][sId];
                                
                            }

                            

                        }
                    }
                }
                    

            });

            let peerUs = peers[pId].upstream;
            let peerUsIds = peerUs ? Object.keys(peerUs) : [];

            peerUsIds.forEach(pUsId => {

                if(pUsId === originPeerId && !originStreamId){
                    delete peers[pId].upstream[pUsId];
                }else{
                    let peerUsStreams = peers[pId].upstream[pUsId];
                    let streamIds = Object.keys(peerUsStreams);

                    for (let i = 0; i < streamIds.length; i++) {

                        let sId = streamIds[i];

                        let origin = peers[pId].upstream[pUsId][sId];

                        if (origin.originPeerId === originPeerId ) {

                            if(originStreamId){
                                if(origin.originStreamId === originStreamId){
                                    delete peers[pId].upstream[pUsId][sId];

                                    if (Object.keys(peers[pId].upstream[pUsId]).length === 0) {
                                        delete peers[pId].upstream[pUsId];
                                    }

                                    break;
                                }
                            }else{
                                
                                delete peers[pId].upstream[pUsId][sId];
                               
                                if (Object.keys(peers[pId].upstream[pUsId]).length === 0) {
                                    delete peers[pId].upstream[pUsId];
                                }
                            }
                            

                        }
                    }
                }

                    

            });

        });

        return peers;
    }

    electNewMainPresenter(peers, leavingPeerId) {

        let presenterIds = Object.keys(peers).filter( p => {
            return p !== leavingPeerId && peers[p].presenter;
        });
        let newMainPresenter = null;

        if(presenterIds.length > 0){
            newMainPresenter =  peers[presenterIds[0]];

            newMainPresenter.mainPresenter = true;
            
        }

        return newMainPresenter;

    }

    getUpstreamPeerIds(peers,peerId,originStreamId){
        let peer = peers[peerId];
        let upstreamPeerIds = Object.keys(peer.upstream ? peer.upstream : {});
        let streams ;
        let streamId ;
        upstreamPeerIds = upstreamPeerIds.filter( p => {
            streams = Object.keys(peer.upstream[p]);
            
            streamId = streams.find(s => {
                return s === originStreamId;
            });

            if(streamId){
                return true;
            }else{
                return false;
            }
 
        });

        return upstreamPeerIds;
    }


    getStreamPaths(peers,originPeerId,originStreamId){

        let peer = peers[originPeerId];
        let paths = {};
        paths[peers[originPeerId].assignedSFU] = {};
        
        let peersSFU = peers[peers[originPeerId].assignedSFU];
        let sfuUpstreams = peersSFU.upstream;
        let originUpstreamPeerIds = Object.keys(sfuUpstreams).filter(u => {
            let usPeer = sfuUpstreams[u];
            let usStreams = Object.keys(usPeer);
            

        });


        let peerIds = Object.keys(peers).filter( p => {
            return p !== originPeerId;
        });
       
        for (let i = 0; i < peerIds.length; i++) {
            const pId = peerIds[i];
            
            
        }

        return paths;

    }

}

module.exports = Session;