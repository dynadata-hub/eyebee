const Peer = require("../../peer");

const expect = require("chai").expect;

describe("peer.js",() => {

    describe("streamAlreadyLoaded()",() => {

        it("expects to find the given origin peer id and stream from a peer's downstream field",() => {
            let peer = new Peer();
    
            let targetPeer = {
                downstream:{
                    "f1":{
                        "clonedstream1":{
                            "originPeerId":"f3",
                            "originStreamId":"f3stream1"
                        },
                        "clonedstream2":{
                            "originPeerId":"f5",
                            "originStreamId":"f5stream1"
                        }
                    },
                    "f2":{
                        "clonedstream3":{
                            "originPeerId":"f1",
                            "originStreamId":"f1stream1"
                        },
                        "clonedstream4":{
                            "originPeerId":"f4",
                            "originStreamId":"f4stream1"
                        }
                    }
                }
            }
    
            let originPeerId = "f3";
            let originStreamId = "f3stream1";
    
            let result = peer.streamAlreadyLoaded(targetPeer,originPeerId,originStreamId);
    
            expect(result).to.be.true;
    
            originPeerId = "f4";
            originStreamId = "f4stream1";
    
            result = peer.streamAlreadyLoaded(targetPeer,originPeerId,originStreamId);
    
            expect(result).to.be.true;
    
        });
    
        it("expects not to find the given origin peer id and stream from a peer's downstream field",() => {
            let peer = new Peer();
    
            let targetPeer = {
                downstream:{
                    "f1":{
                        "clonedstream1":{
                            "originPeerId":"f3",
                            "originStreamId":"f3stream1"
                        },
                        "clonedstream2":{
                            "originPeerId":"f5",
                            "originStreamId":"f5stream1"
                        }
                    },
                    "f2":{
                        "clonedstream3":{
                            "originPeerId":"f1",
                            "originStreamId":"f1stream1"
                        },
                        "clonedstream4":{
                            "originPeerId":"f4",
                            "originStreamId":"f4stream1"
                        }
                    }
                }
            }
    
            let originPeerId = "f6";
            let originStreamId = "f6stream1";
    
            let result = peer.streamAlreadyLoaded(targetPeer,originPeerId,originStreamId);
    
            expect(result).to.be.false;
    
            originPeerId = "f5";
            originStreamId = "f5stream2";
    
            result = peer.streamAlreadyLoaded(targetPeer,originPeerId,originStreamId);
    
            expect(result).to.be.false;
    
        });

    });
    
});