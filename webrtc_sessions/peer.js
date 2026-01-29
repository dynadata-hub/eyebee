class Peer {
    constructor(db){
        this.db = db;
    }

    streamAlreadyLoaded(targetPeer,originPeerId,originStreamId) {
        let downstreamPeerIds = Object.keys(targetPeer.downstream ? targetPeer.downstream : {});
        let dsClonedStreamIds = null;
        let originData = null;
        let dsPId = null;
        let dsClonedStrId = null;
    
        let found = targetPeer.localStreams ? targetPeer.localStreams[originStreamId] : false;
        for(let i=0; i < downstreamPeerIds.length; i++){
            dsPId = downstreamPeerIds[i];
            dsClonedStreamIds = Object.keys(targetPeer.downstream[dsPId]);
    
            for (let x = 0; x < dsClonedStreamIds.length; x++) {
                dsClonedStrId = dsClonedStreamIds[x];
                originData = targetPeer.downstream[dsPId][dsClonedStrId];
                if(originData.originPeerId === originPeerId && originData.originStreamId === originStreamId){
                    found = true;
                    break;
                };
                
            }
    
            if(found){
                break;
            }
    
        }

        return found;
    }

    async updatePeerUpstreams(peer,targetPeerId,targetStreamId,originPeerId,originStreamId){
        //let firstUpstream = false;
        if(!peer.upstream){
            peer.upstream = {};
            //firstUpstream = true;
        }

        if(!peer.upstream[targetPeerId]){
            peer.upstream[targetPeerId] = {};
        }

        peer.upstream[targetPeerId][targetStreamId] = {
            originPeerId:originPeerId,
            originStreamId:originStreamId
        }

        await this.db.updateMergeById("session_peers", peer.id, { upstream: peer.upstream });
        
        return peer;
    }

}

module.exports =  Peer;