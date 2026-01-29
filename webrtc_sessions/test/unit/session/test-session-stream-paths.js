const Session = require("../../../session");

const expect = require("chai").expect;

/*

scenario (in order of connection): 
f1 (sfu) ; 
f2 (sfu) ; 
f3 (sfu) ;
f4 (sfu) ;
f5       ;
f6       ;

*/

let peers = require("./peers.json");

module.exports = function suite () {
    it("expects to obtain correct paths for peer f4",() => {
        let session = new Session();
        let expectedPaths = {};
    
        let originPeerId = "f1";
        let originStreamId = "3f31e157-a496-4cf1-8930-ca85be892cc6";
    
        let paths = session.getStreamPaths(peers,originPeerId,originStreamId);
    
        expect(JSON.stringify(paths)).equals(JSON.stringify(expectedPaths));
    
    });
}

