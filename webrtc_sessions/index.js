// Load environment variables
require('dotenv').config();

// Initialize logger
const logger = require('./logger');

process.on("SIGINT", () => {
    logger.info("Received SIGINT, exiting process");
    process.exit();
});

process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, exiting process");
    process.exit();
});


let http = require('http');
let app = require("express")();
let helmet = require('helmet');
const cors = require('cors');
app.use(cors())

let bodyParser = require("body-parser");
const MemoryDatabaseAPI = require("./memory-database-api");
const memoryDBAPI = new MemoryDatabaseAPI();

//Firebase Integration
const admin = require('firebase-admin');
const fs = require('fs');

// Load Firebase credentials from environment variable
const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH || '../secrets/firebase-credentials.json';
let serviceAccount;
try {
    serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✓ Firebase credentials loaded successfully from:', credentialsPath);
} catch (error) {
    console.error('✗ Error loading Firebase credentials:', error.message);
    console.error('  Make sure the file exists at:', credentialsPath);
    process.exit(1);
}

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'eyebee-718a0.appspot.com';
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: storageBucket
});
const db = admin.firestore();
const bucket = admin.storage().bucket();
const Multer = require('multer');
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
});
const { format } = require('util');
const { v4 } = require('uuid');


const Peer = require("./peer");

const peer = new Peer(memoryDBAPI);

const Session = require("./session");
const { time } = require('console');

const session = new Session();

let socketIdMapping = {};
let disconnectionTimeouts = {};

const CPUCapacityScores = [
    {
        score:0,
        max: 0.1
    },
    {
        score:1,
        max: 0.3,
        maxPeers: 40
    },
    {
        score:2,
        max: 0.6,
        maxPeers: 20
    },
    {
        score:3,
        max: 2,
        maxPeers: 14
    }
];

const NETCapacityScores = [
    {
        score:0,
        
        nat: "STUN",
        net_upload:{
            min: 100
        },
        net_download:{
            min: 500
        }
    },
    {
        score:1,
        nat: "STUN",
        net_upload:{
            min: 50
        },
        net_download:{
            min: 300
        },
        maxPeers: 100
    },
    {
        score:2,
        nat: "STUN",
        net_upload:{
            min: 10
        },
        net_download:{
            min: 50
        },
        maxPeers: 40
    },
    {
        score:3,

        nat: "STUN",
        net_upload:{
            min: 5
        },
        net_download:{
            min: 25
        },
        maxPeers: 10
    }
];

const isSFUCapable = (cpuScore,netScore,stunCapable) => {
   if(!stunCapable){
       return false;
   }else{
       let minScore = cpuScore >= netScore? cpuScore : netScore;
       return minScore < 3;
   }
}


const calculateMaxConnectedPeers = (minScore) => {
  
    let cpuMaxPeers = minScore === 0 ? 10000 : CPUCapacityScores[minScore].maxPeers;
    let netMaxPeers = minScore === 0 ? 10000 : NETCapacityScores[minScore].maxPeers;

    return cpuMaxPeers <= netMaxPeers ? cpuMaxPeers : netMaxPeers;


}

const assessPeerCapacity = (peerStats) => {
    
    let cpuScore = CPUCapacityScores[CPUCapacityScores.length - 1].score;
    for(let i=0; i< CPUCapacityScores.length; i++){
        console.log("comparando cpu "+peerStats.CPU.value+" "+ CPUCapacityScores[i].max);
        if(peerStats.CPU.value <= CPUCapacityScores[i].max){
            cpuScore = CPUCapacityScores[i].score;
            break;
        }
    }

    console.log("assessPeerCapacity -- resultado del cpuScore "+cpuScore);

    let netScore = NETCapacityScores[NETCapacityScores.length - 1].score;
    for(let i=0; i< NETCapacityScores.length; i++){
        if(peerStats.upload.value >= NETCapacityScores[i].net_upload.min){
            netScore = NETCapacityScores[i].score;
            break;
        }
    }

    console.log("assessPeerCapacity -- resultado del netScore "+netScore);

    let result = {};
    let supportsSTUN = peerStats.connectionType.value === "STUN";
    result.sfu = isSFUCapable(cpuScore,netScore,supportsSTUN);
    let minScore = cpuScore >= netScore? cpuScore : netScore;
    result.maxConnectedPeers = calculateMaxConnectedPeers(minScore);
    result.score = minScore;
    result.stun = supportsSTUN;
    result.cpuScore = cpuScore;
    result.netScore = netScore;

    return result;

}

const getPeers = async (peerId,sessionId) => {
    let result = null;
    if(peerId){
        result =  await memoryDBAPI.findById("session_peers", peerId);
    }else if(sessionId){
        result =  await memoryDBAPI.queryCollection("session_peers", [{ "field": "session_id", "operator": "==", "value": sessionId }]);
    }else{
        result = await memoryDBAPI.getAll("session_peers");
    }
    return result;
}

const getSessions = async (sessionId) => {
    let result = null;
    if(sessionId){
        result =  await memoryDBAPI.findById("sessions", sessionId);
    }else{
        result = await memoryDBAPI.getAll("sessions");
    }
    return result;
}

app.use(helmet());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            },
            environment: process.env.NODE_ENV || 'development',
            service: process.env.SERVICE_NAME || 'webrtc_sessions',
            version: require('./package.json').version || '0.5.0'
        };
        
        console.log('Health check performed:', healthStatus);
        res.status(200).json(healthStatus);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Readiness check endpoint
app.get("/ready", (req, res) => {
    res.status(200).json({ ready: true });
});

app.get("/peers", (req, res) => {


    getPeers(req.query.peer_id,req.query.session_id).then(result => {
       
        res.json(result);

    }).catch(err => {
        console.log("Error on /peers", { error: err });
        res.status(500).send(err);
    });

});

app.get("/sessions", (req, res) => {


    getSessions(null).then(result => {
       
        res.json(result);

    }).catch(err => {
        console.log("Error on /sessions", { error: err });
        res.status(500).send(err);
    });

});

app.get("/sessions/:sessionId", (req, res) => {


    getSessions(req.params.sessionId).then(result => {
       
        res.json(result);

    }).catch(err => {
        console.log("Error on /sessions/:sessionId", { error: err });
        res.status(500).send(err);
    });

});


app.post("/session/leave", (req, res) => {

    console.log("llega a post leave", { body: req.body });
    removePeerFromSession(req.body.roomId, req.body.userId).then(result => {
        console.log("peer removal successfully executed", { result: result });
        res.sendStatus(200);

    }).catch(err => {
        console.log("Error on removePeerFromSession", { error: err });
        res.sendStatus(500);
    });

});

app.post("/upload-avatar", multer.single('file'), (req, res) => {
    console.log('Upload Image');

    let file = req.file;
    console.log(file);
    if (file) {
        uploadImageToStorage(file).then((success) => {
            console.log(success);
            res.status(200).send({
                status: 'success',
                fileName: "",
                filePath: success
            });
        }).catch((error) => {
            console.error(error);
        });
    }
});

const uploadImageToStorage = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No image file');
        }
        let newFileName = `${file.originalname}`;

        let fileUpload = bucket.file(newFileName);

        // console.log(file.mimetype);
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                // This line is very important. It's to create a download token.
                firebaseStorageDownloadTokens: v4(),
                metadata: {
                    firebaseStorageDownloadTokens: v4(),
                }
            },

        });

        // //const blobStream = fileUpload.createWriteStream();

        blobStream.on('error', (error) => {
            reject('Something is wrong! Unable to upload at the moment. ' + error.message);
        });

        blobStream.on('finish', () => {
            //console.log(fileUpload);
            // The public URL can be used to directly access the file via HTTP.
            const publicUrl =
                `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(fileUpload.name)}?alt=media`;

            const url = format(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
            resolve(publicUrl);
        });

        blobStream.end(file.buffer);


    });
}

let server = http.createServer(app);

let io = require('socket.io')(server, {
    path: "/videocall/socket.io"
});

server.listen(process.env.PORT, () => {
    console.log(process.env.SERVICE_NAME + " listening on " + process.env.PORT);
});

// io.use((socket, next) => {
//     io.engine.generateId = () => socket.handshake.query.peer_id;
//     next(null, true);
// });

//WebrtcSessionAPI 
/**
 * 
 * @param {*} peerId 
 * @param {*} connectionData an object containing data about the connected peer
 */
const removeConnectedPeer = async (peers,sessionId, peerId) => {
    console.debug("starting removeConnectedPeer", { peerId: peerId });
    //I'm implementing a manual lookup through all the docs but this needs to be a query to the database

    let leavingPeerStreams = peers[peerId] ? peers[peerId].localStreams : null;
    if(leavingPeerStreams){
        console.debug("removeConnectedPeer -- removing references of leaving peer's stream",{
            leavingPeerId: peerId
        });

        session.removePeerStreamReferences(peers,peerId,null);
    }
   

    let peersAfter = await memoryDBAPI.queryCollection("session_peers", [{ "field": "session_id", "operator": "==", "value": sessionId }]);
    await memoryDBAPI.deleteById("session_peers", peerId);

    console.log("peers state after processing removeConnectePeer", { peersAfter: peersAfter });
    return peersAfter;
}


const endSession = async (sessionId) => {

    await memoryDBAPI.deleteById("sessions", sessionId);

    io.to(sessionId).emit("session_ended", {
        roomId: sessionId
    });
    
    return sessionId;
}

const removePeerReferences = async (peerId,peers) => {

    let pIds = Object.keys(peers);

    for(let i=0; i < pIds.length; i++){

        let currPeer = peers[pIds[i]];

        await memoryDBAPI.updateMergeById("session_peers",data.userId, {
            assignedSFU: lastSFU.id
        });
    }
    pIds.forEach( e => {

    });

}

const timeout = (millis) => {
    let prom = new Promise((resolve,reject) => {
        setTimeout(() => {
            resolve();
        },millis || 1000);
    });
    return prom;
}


const removePeerFromSession = async (roomId, peerId) => {
    if (socketIdMapping[peerId]) {
        delete socketIdMapping[peerId];
    }

    clearTimeout(disconnectionTimeouts[peerId]);
    delete disconnectionTimeouts[peerId];

    let currSession = await memoryDBAPI.findById("sessions", roomId);
    let leavingPeer ;
    if(currSession){

        let peers = await memoryDBAPI.queryCollection("session_peers", [{ "field": "session_id", "operator": "==", "value": roomId }]);
        console.log("lo que trae ",{peers:peers,peerId: peerId,roomId:roomId});

        if(!peers[peerId]){
            console.warn("removePeerFromSession -- leaving peer Id not found in peers object ",{peers:peers,peerId: peerId,roomId:roomId});
            return true;
        }

        leavingPeer = {
            ...peers[peerId]
        };

        peers = await memoryDBAPI.queryCollection("session_peers", 
        [{ "field": "session_id", "operator": "==", "value": roomId },
        { "field": "id", "operator": "!=", "value": peerId }]);

        

        let newMainPresenter = null;

        if (leavingPeer.mainPresenter) {
            newMainPresenter = session.electNewMainPresenter(peers,peerId);
            if(newMainPresenter){
                await memoryDBAPI.updateMergeById("session_peers", newMainPresenter.id, {
                    mainPresenter: true
                });

                io.in(roomId).emit("new_main_presenter", {
                    mainPresenterId: newMainPresenter.id,
                    roomId: roomId
                });

            }else{
                console.warn("removePeerFromSession -- could not find a new main presenter! session has no more presenters?",{peers:peers,leavingPeer: leavingPeer});   
            }
        }

        if(leavingPeer.sfu){

            leavingPeer.sfu = false;

            await memoryDBAPI.updateMergeById("session_peers",leavingPeer.id, {
                sfu:false
            });

            //getAssignedPeersPerSFU(null,peers);
            
            let targetSocketId ;

            console.debug("removePeerFromSession -- the leaving peer is an SFU. "+
                " Sending assigned_sfu_disconnected to all peers that have this leaving peer as SFU",
                {
                    peers:peers,
                    leavingPeer:leavingPeer
                });

            let peerIds = Object.keys(peers).filter(p => {
                return p !== leavingPeer.id;
            });

            let newAssignedSFU;

            console.debug("removePeerFromSession -- leaving peer's assignedPeers ",{leavingPeer,ap: leavingPeer.assignedPeers});

            if(leavingPeer.assignedPeers){

                let assignedPeers = leavingPeer.assignedPeers.slice();

                for(let i=0; i < assignedPeers.length ; i++ ){
                    let p = assignedPeers[i];

                    let peer = peers[p];

                    targetSocketId = socketIdMapping[p];
                    console.debug("removePeerFromSession -- this peer has the leaving peer "+
                    "as its SFU, so it needs to ask for a new one",
                    {
                        peerId: p,
                        leavingPeerId:leavingPeer.id
                    });

                    peerIds.forEach(pId => {

                        if(pId !== p){
                            targetSocketId = socketIdMapping[pId];
                        
                            console.debug("removePeerFromSession -- sending peer_streams_remove_request  ",
                            {
                                pId:pId,
                                peerId: p,
                                leavingPeerId:leavingPeer.id
                            });

                            let pLocalStreamIds = Object.keys(peers[p].localStreams);

                            pLocalStreamIds.forEach(sId => {
                                io.to(targetSocketId).emit("peer_streams_remove_request", {
                                    peerId: p,
                                    streamId: sId
                                });
                            });

                            
                            
                        }
                        
                    });

                    let assignedPeerStreams = peers[p] ? peers[p].localStreams : {};
                    if(assignedPeerStreams){
                        console.debug("removePeerFromSession -- removing references of assigned peer's stream",{
                            assignedPeerId: p
                        });


                        //backup downstream /upstream from/to this peer on its assigned peers
                        let apRefs = {};

                        if(peers[p].assignedPeers){
                            peers[p].assignedPeers.forEach( ap => {
                                if(peers[ap]){
                                    apRefs[ap] = {};
                                    apRefs[ap].downstream = peers[ap].downstream[p];
                                    apRefs[ap].upstream = peers[ap].upstream[p];
                                }
                            });
                        }

                        let pLocalStreamIds = Object.keys(assignedPeerStreams);

                        pLocalStreamIds.forEach(sId => {
                            session.removePeerStreamReferences(peers,p,sId);
                        });

                        //restore assignedPeers references deleted by removePeerStreamReferences
                        if(peers[peers[p].assignedSFU]){
                            peers[peers[p].assignedSFU].assignedPeers.push(p);
                        }
                        

                        Object.keys(apRefs).forEach(adr => {
                            if(peers[adr] && apRefs[adr]){
                                peers[adr].downstream[p] = apRefs[adr].downstream;
                                peers[adr].upstream[p] = apRefs[adr].upstream;
                            }
                            
                        });
                    
                    }

                    targetSocketId = socketIdMapping[p];

                    newAssignedSFU = await pickSFU(peer,roomId,p,leavingPeer.id);

                    console.debug("removePeerFromSession -- the result when asking for a new SFU ",
                    {
                        peerId: p,
                        newAssignedSFU:newAssignedSFU,
                        leavingPeerId:leavingPeer.id
                    });

                    if(newAssignedSFU){
                        let sfuOrder ;
                        if(peer.sfu){
                            sfuOrder = newAssignedSFU.sfuOrder + 1;
                        }

                        await memoryDBAPI.updateMergeById("session_peers",p, {
                            sfuOrder:sfuOrder,
                            assignedSFU: newAssignedSFU.id
                        });

                        if(!newAssignedSFU.assignedPeers){
                            newAssignedSFU.assignedPeers = [];
                        }
                        newAssignedSFU.assignedPeers.push(p);

                        await memoryDBAPI.updateMergeById("session_peers",newAssignedSFU.id, {
                            assignedPeers: newAssignedSFU.assignedPeers
                        });

                        //getAssignedPeersPerSFU(leavingPeer.id,peers);

            
                    }else{
                        console.warn("removePeerFromSession -- no candidate SFU found in the room!",{peer:peer,roomId:roomId,peers:peers});
                        io.to(targetSocketId).emit("sfu_not_found");
                    }

                }

                //with the updated sfu peers for each assignedPeers, send the sfu_assigned event  
                //for peers to start sending their local streams to their new sfu



                peers = await memoryDBAPI.queryCollection("session_peers", 
                [{ "field": "session_id", "operator": "==", "value": roomId },
                { "field": "id", "operator": "!=", "value": peerId }]);



                for(let i=0; i < assignedPeers.length ; i++ ){
                
                    let p = assignedPeers[i];

                    targetSocketId = socketIdMapping[p];

                    let peer = peers[p];
                    if(peer.assignedSFU && peers[peer.assignedSFU]){
                        
                        console.debug("removePeerFromSession -- sending sfu_assigned to peer ",
                        {
                            peerId: p,
                            newAssignedSFU:peer.assignedSFU,
                            leavingPeerId:leavingPeer.id
                        });
                
                        io.to(targetSocketId).emit("sfu_assigned", {
                            userId: p,
                            assignedSFU: peer.assignedSFU,
                            roomId: roomId
                        });

                    }else{
                        console.debug("removePeerFromSession -- could not find the assigned SFU for this peer ",
                        {
                            peerId: p,
                            newAssignedSFU:peer.assignedSFU,
                            leavingPeer
                        });
                    }

                    await timeout(1000);

                }
                

                let peerDownstreams = null;

                let oldPeers = JSON.parse(JSON.stringify(peers));

            
                    //loop for non-sfu peers

                    // peerIds = peerIds.filter( p => {
                    //     return !peers[p].sfu;
                    // });

                    console.debug("removePeerFromSession -- processing non SFUs only",
                    {leavingPeerId:leavingPeer.id,nonSFUIds:peerIds});

                    for (let x = 0; x < peerIds.length; x++) {

                        let pId = peerIds[x];

                            peerDownstreams = peers[pId].downstream;
            
                            targetSocketId = socketIdMapping[pId];
            
                            if(peerDownstreams && peerDownstreams[leavingPeer.id]){
                                
                                let downstreamsFromSFU = peerDownstreams[leavingPeer.id];
            
                                console.debug("removePeerFromSession -- found peer with downstreams from leaving SFU",
                                {peerId: pId, leavingPeerId:leavingPeer.id,downstreams:downstreamsFromSFU});
            
            
                                let streamIds = Object.keys(downstreamsFromSFU);
            
                                for (let y = 0; y < streamIds.length; y++) {
                                    let s = streamIds[y];
            
                                    let origin = downstreamsFromSFU[s];
            
                                    //exclude the current assignedPeer(var p) from downstreamsFromSSU  
                                    //as this peer is already being retransmitted by the SFUs when sending
                                    //its stream to its new assigned SFU

                                    let notIncludedInAssignedPeers = assignedPeers.indexOf(origin.originPeerId) === -1;
            
                                    console.debug("removePeerFromSession -- not included in assignedPeers? (1)",
                                    {assignedPeers,originPeerId: origin.originPeerId, leavingPeerId:leavingPeer.id,
                                        notIncludedInAssignedPeers});
                                    

                                    if(notIncludedInAssignedPeers && origin.originPeerId !== leavingPeer.id){
                                        
                                        console.debug("removePeerFromSession -- sending peer_streams_remove_request  ",
                                        {
                                            pId:pId,
                                            peerIdRemove: origin.originPeerId,
                                            leavingPeerId:leavingPeer.id
                                        });
            
                                        delete peers[pId].downstream[leavingPeer.id][origin.originStreamId];

                                        if(Object.keys(peers[pId].downstream[leavingPeer.id]).length === 0){
                                            delete peers[pId].downstream[leavingPeer.id]
                                        }
            
                                        await memoryDBAPI.updateMergeById("session_peers",pId, {
                                            downstream: peers[pId].downstream
                                        }); 
            
                                        io.to(targetSocketId).emit("peer_streams_remove_request", {
                                            peerId: origin.originPeerId,
                                            streamId: origin.originStreamId,
                                            //resend:true
                                        });

                                        // await timeout(1000);

                                        let brokenUpstreamPeerIds = session.getUpstreamPeerIds(peers,pId,origin.originStreamId);
                                        
                                        console.log("removePeerFromSession -- el resultado de brokenUpstreamPeerIds ",{brokenUpstreamPeerIds});
                                        brokenUpstreamPeerIds = brokenUpstreamPeerIds.filter(b => {
                                            return b !== leavingPeer.id;
                                        });

                                        console.log("removePeerFromSession -- el resultado de brokenUpstreamPeerIds liuego del filtro ",{pId,leavingPeerId: leavingPeer.id,brokenUpstreamPeerIds});
                                        let brokenPeerSockId ;

                                        for (let z = 0; z < brokenUpstreamPeerIds.length; z++) {
                                            
                                            let b = brokenUpstreamPeerIds[z];

                                            delete peers[b].downstream[pId][origin.originStreamId];

                                            if(Object.keys(peers[b].downstream[pId]).length === 0){
                                                delete peers[b].downstream[pId];
                                            }

                                            delete peers[pId].upstream[b][origin.originStreamId];

                                            if(Object.keys(peers[pId].upstream[b]).length === 0){
                                                delete peers[pId].upstream[b];
                                            }

                                            await memoryDBAPI.updateMergeById("session_peers",b, {
                                                downstream: peers[b].downstream
                                            });

                                            await memoryDBAPI.updateMergeById("session_peers",pId, {
                                                upstream: peers[pId].upstream
                                            });
                                            
                                            brokenPeerSockId = socketIdMapping[b];

                                            io.to(brokenPeerSockId).emit("peer_streams_remove_request", {
                                                peerId: origin.originPeerId,
                                                streamId: origin.originStreamId,
                                                //resend:true
                                            });

                                            console.log("removePeerFromSession -- estado final de peers",{peers});
                                            
                                        }

            
                                        
                                    }
            
                                    
                                }
                                
                            }

        
                        
        
                    }

                    console.log("removePeerFromSession -- comparacion peers oldpeers",{peers,oldPeers});

                    await timeout(2000);

                
                    peerIds = Object.keys(oldPeers);
                    //loop for sfu only peers

                    console.debug("removePeerFromSession -- processing old peers",
                    {leavingPeerId:leavingPeer.id,peerIds});

                    for (let x = 0; x < peerIds.length; x++) {

                        let pId = peerIds[x];

                            peerDownstreams = oldPeers[pId].downstream;
            
                            targetSocketId = socketIdMapping[pId];
            
                            if(peerDownstreams && peerDownstreams[leavingPeer.id]){
                                
                                let downstreamsFromSFU = peerDownstreams[leavingPeer.id];
            
                                console.debug("removePeerFromSession -- found peer with downstreams from leaving SFU",
                                {peerId: pId, leavingPeerId:leavingPeer.id,downstreams:downstreamsFromSFU});
            
            
                                let streamIds = Object.keys(downstreamsFromSFU);
            
                                for (let y = 0; y < streamIds.length; y++) {
                                    let s = streamIds[y];
            
                                    let origin = downstreamsFromSFU[s];
            
                                    //exclude the current assignedPeer(var p) from downstreamsFromSSU  
                                    //as this peer is already being retransmitted by the SFUs when sending
                                    //its stream to its new assigned SFU

                                    let notIncludedInAssignedPeers = assignedPeers.indexOf(origin.originPeerId) === -1;
            
                                    console.debug("removePeerFromSession -- not included in assignedPeers? (1)",
                                    {assignedPeers,originPeerId: origin.originPeerId, leavingPeerId:leavingPeer.id,
                                        notIncludedInAssignedPeers});
                                    

                                    if(notIncludedInAssignedPeers && origin.originPeerId !== leavingPeer.id){
                                        
                                        console.debug("removePeerFromSession -- sending peer_streams_remove_request  ",
                                        {
                                            pId:pId,
                                            peerIdRemove: origin.originPeerId,
                                            leavingPeerId:leavingPeer.id
                                        });


                                        await timeout(300);
                                        
                                        let rsData = {
                                            targetPeerId: origin.originPeerId,
                                            targetStreamId: origin.originStreamId,
                                            sessionId: roomId
                                        };
            
                                        console.log("removePeerFromSession -- sending request_stream message to this peer",{
                                            peerId:pId,
                                            origin: origin,
                                            rsData:rsData
                                        });
            
                                        io.to(targetSocketId).emit("request_stream", rsData);

                                    }
            
                                    
                                }
                                
                            }

        
                        
        
                    }


                    // await timeout(2000);
                
                    // peerIds = Object.keys(oldPeers).filter( p => {
                    //     return oldPeers[p].sfu;
                    // });

                    // //ask for those broker upstream peers

                    // console.debug("removePeerFromSession -- asking for broken relay streams again",
                    // {leavingPeerId:leavingPeer.id,peerIds:peerIds});

                    // for (let x = 0; x < peerIds.length; x++) {

                    //     let pId = peerIds[x];

                    //         peerDownstreams = oldPeers[pId].downstream;
            
                    //         targetSocketId = socketIdMapping[pId];
            
                    //         if(peerDownstreams && peerDownstreams[leavingPeer.id]){
                                
                    //             let downstreamsFromSFU = peerDownstreams[leavingPeer.id];
            
                    //             console.debug("removePeerFromSession -- found peer with downstreams from leaving SFU",
                    //             {peerId: pId, leavingPeerId:leavingPeer.id,downstreams:downstreamsFromSFU});
            
            
                    //             let streamIds = Object.keys(downstreamsFromSFU);
            
                    //             for (let y = 0; y < streamIds.length; y++) {
                    //                 let s = streamIds[y];
            
                    //                 let origin = downstreamsFromSFU[s];
            
                    //                 //exclude the current assignedPeer(var p) from downstreamsFromSSU  
                    //                 //as this peer is already being retransmitted by the SFUs when sending
                    //                 //its stream to its new assigned SFU

                    //                 let notIncludedInAssignedPeers = assignedPeers.indexOf(origin.originPeerId) === -1;
            
                    //                 console.debug("removePeerFromSession -- not included in assignedPeers? (1)",
                    //                 {assignedPeers,originPeerId: origin.originPeerId, leavingPeerId:leavingPeer.id,
                    //                     notIncludedInAssignedPeers});
                                    

                    //                 if(notIncludedInAssignedPeers && origin.originPeerId !== leavingPeer.id){


                    //                     let brokenUpstreamPeerIds = session.getUpstreamPeerIds(oldPeers,pId,origin.originStreamId);
                                        
                    //                     console.log("removePeerFromSession -- el resultado de brokenUpstreamPeerIds ",{brokenUpstreamPeerIds});
                    //                     brokenUpstreamPeerIds = brokenUpstreamPeerIds.filter(b => {
                    //                         return b !== leavingPeer.id && oldPeers[b].assignedSFU !== pId;
                    //                     });

                    //                     console.log("removePeerFromSession -- el resultado de brokenUpstreamPeerIds liuego del filtro ",{pId,leavingPeerId: leavingPeer.id,brokenUpstreamPeerIds,oldPeers});
                    //                     let brokenPeerSockId ;

                    //                     for (let z = 0; z < brokenUpstreamPeerIds.length; z++) {
                                            
                    //                         let b = brokenUpstreamPeerIds[z];

                    //                         delete peers[b].downstream[pId][origin.originStreamId];

                    //                         delete peers[pId].upstream[b][origin.originStreamId];

                    //                         await memoryDBAPI.updateMergeById("session_peers",b, {
                    //                             downstream: peers[b].downstream
                    //                         });

                    //                         await memoryDBAPI.updateMergeById("session_peers",pId, {
                    //                             upstream: peers[pId].upstream
                    //                         });
                                            
                    //                         brokenPeerSockId = socketIdMapping[b];

                    //                         let rsData = {
                    //                             targetPeerId: origin.originPeerId,
                    //                             targetStreamId: origin.originStreamId,
                    //                             sessionId: roomId
                    //                         };
                
                    //                         console.log("removePeerFromSession -- sending request_stream message to this peer",{
                    //                             peerToSend:b,
                    //                             peerId:pId,
                    //                             origin: origin,
                    //                             rsData:rsData
                    //                         });
                
                    //                         io.to(brokenPeerSockId).emit("request_stream", rsData);

                    //                         // io.to(brokenPeerSockId).emit("peer_streams_remove_request", {
                    //                         //     peerId: origin.originPeerId,
                    //                         //     streamId: origin.originStreamId,
                    //                         //     //resend:true
                    //                         // });

                    //                         console.log("removePeerFromSession -- estado final de peers",{peers});
                                            
                    //                     }

            
                                        
                    //                 }
            
                                    
                    //             }
                                
                    //         }

        
                        
        
                    // }



            }else{
                console.debug("removePeerFromSession -- no assignedPeers for this leaving SFU",{leavingSFU: leavingPeer});
            }

            // peerIds = peerIds.filter(p => {
            //     return peers[p].sfu 
            // });


            
            
        }
    }

    
    
    let peers = await memoryDBAPI.queryCollection("session_peers", [{ "field": "session_id", "operator": "==", "value": roomId }]);
    await removeConnectedPeer(peers,roomId, peerId);

    io.in(roomId).emit("user_left", {
        userId: peerId,
        roomId: roomId
    });

    if(leavingPeer && leavingPeer.owner){
        endSession(roomId);
    }
    return true;

}

const getAssignedPeersPerSFU = (peerId,sessionPeers) => {
    let sfus = Object.keys(sessionPeers).filter(s => {
        if(s !== peerId && sessionPeers[s].sfu){
            return true;
        }
    });

    console.log("getAssignedPeersPerSFU -- filtered as SFUs",{sfus:sfus});

    // Object.keys(sessionPeers).forEach(p => {

    //     sfus.forEach(s => {
    //         if(!sessionPeers[s].assignedPeers){
    //             sessionPeers[s].assignedPeers = [];
    //         }

    //         if(sessionPeers[p].assignedSFU === s && sessionPeers[s].assignedPeers.indexOf(p) === -1){
    //             sessionPeers[s].assignedPeers.push(p);
    //         }

    //     });
       

    // });

    //sort sfus asc
    sfus = sfus.filter( s => {
        return (sessionPeers[s].assignedPeers ? sessionPeers[s].assignedPeers.length : 0) < sessionPeers[s].capabilities.maxConnectedPeers;
    }).sort((a,b) => {

        if((sessionPeers[a].assignedPeers ? sessionPeers[a].assignedPeers.length : 0) < (sessionPeers[b].assignedPeers ? sessionPeers[b].assignedPeers.length : 0)){
            return -1;
        }else if((sessionPeers[a].assignedPeers ? sessionPeers[a].assignedPeers.length : 0) > (sessionPeers[b].assignedPeers ? sessionPeers[b].assignedPeers.length : 0)) {
            return 1;
        }else{
            return 0;
        }
        
        
    })

    console.log("getAssignedPeersPerSFU -- finished counting assigned peers per SFU",{sfus:sfus});

    return sfus;
}

const countDownstreamPeers = downstreams => {
    let count = 0;
    let keys1 = Object.keys(downstreams);
    keys1.forEach(p => {
        count += Object.keys(downstreams[p]).length;
    });

    return count;
}


const countUpstreamPeers = upstream => {
    let count = 0;
    if(upstream){
        
        let keys1 = Object.keys(upstream);
        keys1.forEach(p => {
            count += Object.keys(upstream[p]).length;
        });

    }
    
    return count;
}

const getLastSFU = (sessionPeers) => {
    let keys = Object.keys(sessionPeers);
    let orderedKeys = keys.filter( k => {
        return sessionPeers[k].sfu
    }).sort((a,b) => {
        if(sessionPeers[a].sfuOrder > sessionPeers[b].sfuOrder){
            return 1;
        }else if(sessionPeers[a].sfuOrder < sessionPeers[b].sfuOrder){
            return -1;
        }else{
            return 0;
        }
    });
    if(orderedKeys[orderedKeys.length -1]){
        let lastOrderKey = orderedKeys[orderedKeys.length -1];
        return sessionPeers[lastOrderKey];
    }else{
        return null;
    }
   

}


const pickSFU = async (peer,roomId,userId,excludedPeerId) => {

    if(peer && peer.sfu){

        let sessionPeers = await memoryDBAPI.queryCollection("session_peers",[
            { "field": "session_id", "operator": "==", "value": roomId },
            { "field": "id", "operator": "!=", "value": userId },
            { "field": "id", "operator": "!=", "value": excludedPeerId }
        ]);

        //getConnectedStreamsPerSFU(data.userId,sessionPeers);
       

        console.log("pickSFU -- session peers con dos filtros",{peers:sessionPeers});

        if(sessionPeers && Object.keys(sessionPeers).length > 0){

            let lastSFU = getLastSFU(sessionPeers);

            return lastSFU;
        }
        

    }else{
        let sessionPeers = await memoryDBAPI.queryCollection("session_peers",[
            { "field": "session_id", "operator": "==", "value": roomId },
            { "field": "id", "operator": "!=", "value": userId },
            { "field": "id", "operator": "!=", "value": excludedPeerId }
        ]);

        //getConnectedStreamsPerSFU(data.userId,sessionPeers);
        let peersPerSFU = getAssignedPeersPerSFU(userId,sessionPeers);

        console.log("pickSFU -- peersPerSFU",{peersPerSFU:peersPerSFU});

        if(peersPerSFU && peersPerSFU.length > 0){
            
            let candidateSFUId = peersPerSFU[0];

            return sessionPeers[candidateSFUId];

            // await memoryDBAPI.updateMergeById("session_peers",userId, {
            //     assignedSFU: candidateSFU
            // });

            // // io.to(socket.id)
            // io.in(roomId).emit("sfu_assigned", {
            //     userId: userId,
            //     assignedSFU: candidateSFU
            // });

        }else{
            //io.to(socket.id).emit("sfu_not_found");
            return null;
        }
    }


}


io.on("connection", (socket) => {
    console.log("socket connected " + socket.handshake.query.peer_id + " " + socket.id);
    
    if(disconnectionTimeouts[socket.handshake.query.peer_id]){
        
        console.log("socket connected -- clearing disconnection timeout previously set" 
        ,{peerId: socket.handshake.query.peer_id,socketId: socket.id,
        roomId: socket.handshake.query.room_id});

        clearTimeout(disconnectionTimeouts[socket.handshake.query.peer_id]);
        delete disconnectionTimeouts[socket.handshake.query.peer_id];
    }
    // let autoJoinRoom = false;
    // if (socketIdMapping[socket.handshake.query.peer_id]) {
    //     autoJoinRoom = true;
    // }
    socketIdMapping[socket.handshake.query.peer_id] = socket.id;

    socket.on("username", async (data,callback) => {
        console.debug("username -- starting ",{data:data});
        let result = {
            type:"error",
            message:"SESSION_NOT_FOUND"
        }

        let peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "userName", "operator": "==", "value": data.userName }
        ]);
        console.log("el resultado de buscar el peer con el mismo nombre ",{p:peer});
        if(peers && Object.keys(peers).length > 0){
            result = {
                type:"error",
                message:"USERNAME_TAKEN"
            }
        }else{
            result = {
                type:"success",
                message:"USERNAME_AVAILABLE"
            }
        }

        callback(result);

    });

    socket.on("get_target_sfu", async data => {
       
        console.log("get_target_sfu -- starting...", { data: data });

        let peer = await memoryDBAPI.findById("session_peers", data.userId);

        let assignedSFU = await pickSFU(peer,data.roomId,data.userId);

        if(assignedSFU){

            await memoryDBAPI.updateMergeById("session_peers",data.userId, {
                assignedSFU: assignedSFU.id
            });
            
            if(!assignedSFU.assignedPeers){
                assignedSFU.assignedPeers = [];
            }

            assignedSFU.assignedPeers.push(data.userId);

            await memoryDBAPI.updateMergeById("session_peers",assignedSFU.id, {
                assignedPeers: assignedSFU.assignedPeers
            });

            let nuevaSelSFU = await memoryDBAPI.findById("session_peers",assignedSFU.id);

            console.log("como queda la assignedSFU SFU",{assignedSFU,nuevaSelSFU});
    
            io.in(data.roomId).emit("sfu_assigned", {
                userId: data.userId,
                assignedSFU: assignedSFU.id
            });

        }else{
            console.warn("get_target_sfu -- could not find a candidate SFU for this peer!", { data: data,peer:peer});
            io.to(socket.id).emit("sfu_not_found");
        }


    });

    socket.on("set_target_sfu", async data => {
       
        console.log("entering set_target_sfu", { data: data });

        let selectedSFU = await memoryDBAPI.findById("session_peers",data.selectedSFU);

        await memoryDBAPI.updateMergeById("session_peers",data.userId, {
            assignedSFU: data.selectedSFU
        });

        if(!selectedSFU.assignedPeers){
            selectedSFU.assignedPeers = [];
        }

        selectedSFU.assignedPeers.push(data.userId);

       

        await memoryDBAPI.updateMergeById("session_peers",selectedSFU.id, {
            assignedPeers: selectedSFU.assignedPeers
        });

        let nuevaSelSFU = await memoryDBAPI.findById("session_peers",selectedSFU.id);

        console.log("como queda la selected SFU",{selectedSFU,nuevaSelSFU});

        io.to(socket.id).emit("sfu_assigned", {
            userId: data.userId,
            assignedSFU: data.selectedSFU
        });

    });

    socket.on("message", (data) => {
        console.log("el message que viene", { data: data });
        io.in(data.roomId).emit("message", data);
    });

    socket.on("create_sub_room", (data) => {
        console.log("create_sub_room ", { data: data });
        io.in(data.roomId).emit("create_sub_room", data);
    });

    socket.on("join", async (data, callback) => {
        console.log("iniciando join", { data: data });
        let session = await memoryDBAPI.findById("sessions", data.roomId);
        console.log("valor sessions", { session: session });
        let sessionStarted = false;
        let setAsOwner = false;
        if (!session) {
            if (data.userData.owner) {
                await memoryDBAPI.insert("sessions", data.roomId, {
                    id:data.roomId,
                    owner: data.userId,
                    participants: 1
                });

                session = {
                    id:data.roomId,
                    owner: data.userId,
                    participants: 1
                };

                sessionStarted = true;
            } else {

                if(data.userData.smallRoom){

                    await memoryDBAPI.insert("sessions", data.roomId, {
                        id:data.roomId,
                        smallRoom: data.userData.smallRoom,
                        owner: data.userId,
                        participants: 1,
                        maxPeers:5
                    });

                    session = {
                        id:data.roomId,
                        smallRoom: data.userData.smallRoom,
                        owner: data.userId,
                        participants: 1,
                        maxPeers:5
                    };

                    setAsOwner = true;

                }else{
                    callback({
                        result: "error",
                        action: "join",
                        error: "SESSION_NOT_STARTED"
                    });
                    return false;
                }

                
               
            }
        }else{

            if(session.smallRoom){

                let peers = await memoryDBAPI.queryCollection("session_peers", [
                    { "field": "session_id", "operator": "==", "value": data.roomId }
                ]);

                let participants = Object.keys(peers).length;

                if(participants === session.maxPeers){
                    console.warn("join -- this peer cannot enter the room. The room reached max peers limit",{session,userData:data.userData});

                    callback({
                        result: "error",
                        action: "join",
                        error: "MAX_SESSION_PEERS_REACHED"
                    });
                    return false;
                }

                console.log("join -- this room is a small room",{session});

                let hasOwner = await memoryDBAPI.queryCollection("session_peers", [
                    { "field": "session_id", "operator": "==", "value": data.roomId },
                    { "field": "owner", "operator": "==", "value": true }
                ]);

                console.log("join -- checking if this small room already has an assigned Owner",{hasOwner});

                if(!hasOwner){
                    console.log("join -- setting this peer as owner as this room has no owner yet",{hasOwner});
                    setAsOwner = true;
                }else{
                    console.log("join -- this room already has an owner..skipping",{hasOwner});
                }

            }

        }

        let peer = await memoryDBAPI.findById("session_peers", data.userId);
        if (peer && peer.id) {
            callback({
                result: "error",
                action: "join",
                error: "PEER_ID_ALREADY_EXISTS"
            });
            return false;
        }



        // console.log("join!");
        // console.log(data);
        socket.join(data.roomId);
        data.session_id = data.roomId;
        data.signaling_id = socket.id;
        let sessionPeer = {
            id: data.userId,
            avatar: data.userData.avatar,
            userName: data.userData.userName,
            session_id: data.roomId,
            signaling_id: socket.id,
            mobile:data.userData.isMobileDevice,
            presenter: data.userData.presenter,
            owner: data.userData.owner,
            maxRelay: data.userData.maxRelay,
            canRelay: true,
            canStream: true,
            camera: data.userData.camera,
            mic: data.userData.mic,
            capabilities: data.userData.capabilities
        }

        if(setAsOwner){
            sessionPeer.owner = true;
        }

        let result = assessPeerCapacity(data.userData.capabilities);
        Object.keys(result).forEach(r => {
            sessionPeer.capabilities[r] = result[r];
        });

        //condition the SFU capability to whether the device is mobile or not
        sessionPeer.sfu = !data.userData.isMobileDevice ? result.sfu : false;

        console.log("el result de la capacidad!",{
            peerId:data.userId,
            cap:data.userData.capabilities,
            assessResult: result
        });

        let peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.roomId }
        ]);

        if(sessionPeer.sfu){
            let lastSFU = getLastSFU(peers);
            let lastOrder = lastSFU ? lastSFU.sfuOrder : 0;

            sessionPeer.sfuOrder = lastOrder + 1;
        }
        

        console.log("la info del peer",{peer:sessionPeer});

        let mainPresenter = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.roomId },
            { "field": "presenter", "operator": "==", "value": true },
            { "field": "mainPresenter", "operator": "==", "value": true }
        ]);

        console.log("el resultado de main presenter", { mp: mainPresenter });

        if (mainPresenter && Object.keys(mainPresenter).length > 0) {
            console.log("ya existe un main presenter para esta sesión", { sessionId: data.roomId, mainPresenter: mainPresenter });
        } else if (sessionPeer.presenter) {
            console.log("No encontró main presenter para esta sesión asi que asigna a este presenter como main", { sessionId: data.roomId, mainPresenter: mainPresenter });
            sessionPeer.mainPresenter = true;
        }

        // console.log("el session peer");
        // console.log(sessionPeer);

        await memoryDBAPI.insert("session_peers", data.userId, sessionPeer);
        //let peers = await memoryDBAPI.getAll("session_peers");

        peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.roomId }
        ]);

        console.log("los peers que va a mandar user_joined",{peers:peers});
        Object.keys(peers).forEach(pId => {
            io.to(socketIdMapping[pId]).emit("user_joined", sessionPeer);

        });

        let numOfSFUs = Object.keys(peers).filter( p => {
            return peers[p].sfu
        }).length;

        console.log("join -- number of SFUs in the room",{num:numOfSFUs});

        session.numOfSFUs = numOfSFUs;
        session.participants = Object.keys(peers).length;
        console.log("sending room info event", { session: session });
        socket.broadcast.emit("room_info", session);

        callback({
            result: "ok",
            peers: peers
        });

        return false;


    });

    socket.on("peer_score_requested", async data => {

        console.log("peer_score_requested -- starting ",{data:data});
        let assessment = {
            capabilities:{}
        };

        let result = assessPeerCapacity(data.capabilities);
        Object.keys(result).forEach(r => {
            assessment.capabilities[r] = result[r];
        });

        //condition the SFU capability to whether the device is mobile or not
        assessment.sfu = !data.isMobileDevice ? result.sfu : false;

        io.to(socket.id).emit("peer_score", assessment);

    });

    socket.on("room_info", async data => {
        console.debug("room_info -- starting ",{data:data});

        let session = await memoryDBAPI.findById("sessions", data.roomId);
        if(session){
            let peers = await memoryDBAPI.queryCollection("session_peers", [
                { "field": "session_id", "operator": "==", "value": data.roomId }
            ]);
    
            let numOfSFUs = Object.keys(peers).filter( p => {
                return peers[p].sfu
            }).length;
    
            console.log("room_info -- number of SFUs in the room",{num:numOfSFUs});
            session.participants = Object.keys(peers).length;
            session.numOfSFUs = numOfSFUs;
        }

        

        io.to(socket.id).emit("room_info", session);

    });

    socket.on("peer_media_changed", async data => {
        console.log("peer_media_changed -- starting",{data:data});

        let peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.sessionId }
        ]);

        let peer = peers[data.from];
        let updated = false;

        switch(data.type){
            case "added":
                if( !peer.localStreams ) {
                    peer.localStreams = {};
                }
    
                peer.localStreams[data.streamId] = {
                    label: data.label
                }
                updated = true;
            break;
            case "deleted": 
                delete peer.localStreams[data.streamId];
                console.log("peer_media_changed -- removing stream references",{peers:JSON.stringify(peers),peerId:peer.id,streamId:data.streamId})
                session.removePeerStreamReferences(peers,peer.id,data.streamId);

                updated = true;
            break;
            default: console.log("Unknown peer media changed type: "+data.type,{data:data});
        }

        if(updated){

            await memoryDBAPI.updateMergeById("session_peers", data.from, 
            { localStreams: peer.localStreams });
            
            socket.to(data.sessionId).emit("peer_media_changed", {
                from: data.from,
                label: data.label,
                type: data.type,
                streamId: data.streamId
            });
        }

        return true;

    });

    socket.on("users", async data => {


        let peer = await memoryDBAPI.findById("session_peers", data.userId);

        let peers = {};
        if (peer.owner || peer.presenter) {
            peers = await memoryDBAPI.queryCollection("session_peers", [
                { "field": "session_id", "operator": "==", "value": data.roomId }
            ]);
        } else {
            peers = await memoryDBAPI.queryCollection("session_peers", [
                { "field": "session_id", "operator": "==", "value": data.roomId },
                { "field": "presenter", "operator": "==", "value": true }
            ]);
        }

        io.to(socket.id).emit("users", peers);

    });

    socket.on("user_presentation_request", async data => {

        console.log("entering user_presentation_request!", { data: data });

        let peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.roomId },
            { "field": "owner", "operator": "==", "value": true }
        ]);

        Object.keys(peers).forEach(pId => {
            io.to(socketIdMapping[pId]).emit("user_presentation_request", { userId: data.userId });

        });

    });


    socket.on("user_presentation_cancelled", async data => {

        console.log("entering peer_presentation_cancelled!", { data: data });

        await memoryDBAPI.updateMergeById("session_peers", data.userId, { presenter: false });
        socket.to(socket.handshake.query.room_id).emit("user_presentation_cancelled", { userId: data.userId });

    });

    socket.on("user_presentation_granted", async data => {

        console.log("entering user_presentation_granted!", { data: data });

        await memoryDBAPI.updateMergeById("session_peers", data.target, { presenter: true, canStream: true });

        let peer = await memoryDBAPI.findById("session_peers", data.target);

        io.to(socketIdMapping[data.target]).emit("user_presentation_granted", data);

        let destPeers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.roomId }
        ]);

        console.log("los simplepeers", { destPeers: destPeers, peer: peer });

        Object.keys(destPeers).forEach(sp => {

            //send to all except the peer that has been promoted to presenter and the owner who granted the role
            if (sp !== peer.id && sp !== socket.handshake.query.peer_id) {
                console.log("enviando a " + sp);
                io.to(socketIdMapping[sp]).emit("new_presenter", peer);
            }
        });

    });

    socket.on("peer_camera_state_changed", async data => {

        console.log("entering peer_camera_state_changed!", { data: data });

        await memoryDBAPI.updateMergeById("session_peers", data.peerId, { camera: data.enabled });

        socket.to(socket.handshake.query.room_id).emit("peer_camera_state_changed", data);

    });

    socket.on("peer_mic_state_changed", async data => {

        console.log("entering peer_mic_state_changed!", { data: data });

        await memoryDBAPI.updateMergeById("session_peers", data.peerId, { mic: data.mic });

        socket.to(socket.handshake.query.room_id).emit("peer_mic_state_changed", data);

    });

    socket.on("user_presentation_removed", async data => {

        console.log("entering user_presentation_removed!", { data: data });

        await memoryDBAPI.updateMergeById("session_peers", data.target, { presenter: false });

        socket.to(socket.handshake.query.room_id).emit("user_presentation_removed", data);

    });

    socket.on("peer_connection_failed", async data => {

        console.log("entering peer_connection_failed!", { data: data });


    });

    socket.on("peer_connection_succeeded", async data => {

        console.log("event on peer_connection_succeeded!", { data: data });
        let peer = await memoryDBAPI.findById("session_peers", data.from);
        let connectedPeers = peer.connectedPeers || {};
        if (!connectedPeers[data.originPeerId]) {
            connectedPeers[data.originPeerId] = {};
        }

        if (!connectedPeers[data.originPeerId][data.originStreamId]) {

            connectedPeers[data.originPeerId][data.originStreamId] = {
                source: {}
            };
        }

        if (!connectedPeers[data.originPeerId][data.originStreamId].source[data.target]) {
            connectedPeers[data.originPeerId][data.originStreamId].source[data.target] = {
                peer_id: data.target
            }
        }


        peer.connectedPeers = connectedPeers;
        await memoryDBAPI.updateMergeById("session_peers", data.from, { connectedPeers: connectedPeers });

        let peerAfter = await memoryDBAPI.findById("session_peers", data.from);
        console.log("peer state after processing peer_connection_succeeded", { peerAfter: peerAfter });

    });

    socket.on("peer_stream_removed", async data => {
        /**
         * A peer removed a local or remote stream and now notifies the system to update the other peers
         * that were receiving this stream
         * 
         */

        
        console.log("peer_stream_removed -- starting", { data: data });

        let peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.sessionId }
        ]);

        let peerDownstreams = peers[data.from].downstream;

        let keys = Object.keys(peerDownstreams);
        keys.forEach(pd => {
            let origin = peerDownstreams[pd][data.streamId];

            if(origin){
                delete peers[data.from].downstream[pd][data.streamId];

                delete peers[pd].upstream[data.from][data.streamId];
            }

        });

        
        await memoryDBAPI.updateMergeById("session_peers",data.from, {
            downstream: peers[data.from].downstream
        }); 

       
        console.log("peer_stream_removed -- finished", { peer: peers[data.from] });


    });

    socket.on("stream_source_request", async data => {
        /**
         * A peer requested a new source peer for a specific stream from a specific peer
         * This can be triggered when a peer detects a source peer has disconnected.
         * 
         */
        console.log("entering stream_source_request!", { data: data });

    });

    socket.on("peer_webrtc_message", async data => {
        // console.log("peer_webrtc_message",{data:data});
        let targetSocketId = socketIdMapping[data.target];

        delete data["target"];

        io.to(targetSocketId).emit("peer_webrtc_message", data);

        return true;

    });

    socket.on("peer_stream_loaded", async data => {
        // console.log("peer_webrtc_message",{data:data});
        console.log("peer_stream_loaded -- starting...",{data:data});

        let originPeer = await memoryDBAPI.findById("session_peers",data.originPeerId);


        if(!originPeer){
            console.log("peer_stream_loaded -- could not find originPeer!",{data:data});
            return false;
        }

        let fromPeer = await memoryDBAPI.findById("session_peers",data.peerId);

        if(!fromPeer){
            console.log("peer_stream_loaded -- could not find fromPeer!",{data:data});
            return false;
        }


        console.log("peer_stream_loaded -- originPeer",{originPeer:originPeer,fromPeer:fromPeer});
        
        let peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.sessionId }
        ]);

        let sender = peers[data.senderPeerId];

        await peer.updatePeerUpstreams(sender,fromPeer.id,data.streamId, data.originPeerId,data.originStreamId);

        let filteredPeerIds = Object.keys(peers).filter(p => {
            if(!peers[p].sfu && peers[p].id !== data.originPeerId && peers[p].assignedSFU === data.peerId ){
                return true;
            }
        });

        console.log("peer_stream_loaded -- first filtering of peers to send request",{data,peers:JSON.parse(JSON.stringify(peers)),filteredPeerIds});

        //filter out non presenter viewers if origin peer is not a presenter
        if(!originPeer.presenter){
            console.log("peer_stream_loaded -- origin peer is not a presenter... exclude other non presenters from filteredPeerIds",{data,peers:JSON.parse(JSON.stringify(peers)),filteredPeerIds,originPeer});
            filteredPeerIds = filteredPeerIds.filter(p => {
                if(peers[p].presenter){
                    return true;
                }else{
                    return false;
                }
            });
            console.log("peer_stream_loaded -- second filtering of peers to send request (originPeer is not a presenter)",{filteredPeerIds:filteredPeerIds});
        }   
        //let currConnPeers = (peers[data.peerId].totalConnectedStreams ? peers[data.peerId].totalConnectedStreams.length : 0);

        if(!peers[data.peerId].downstream){
            peers[data.peerId].downstream = {};
        }

        if(!peers[data.peerId].downstream[data.senderPeerId]){
            peers[data.peerId].downstream[data.senderPeerId] = {};
        }

        peers[data.peerId].downstream[data.senderPeerId][data.streamId] = {
            originPeerId:data.originPeerId,
            originStreamId:data.originStreamId
        }

        await memoryDBAPI.updateMergeById("session_peers", data.peerId, { downstream: peers[data.peerId].downstream });
        
        let numDownstreamPeers = countDownstreamPeers(peers[data.peerId].downstream);

        if(numDownstreamPeers >= peers[data.peerId].capabilities.maxConnectedPeers){
            console.warn("peer_stream_loaded -- max connected peers reached!");
        }

        if(fromPeer.sfu){

            let remainingPeerCapacity = peers[data.peerId].capabilities.maxConnectedPeers - numDownstreamPeers;
            console.log("peer_stream_loaded -- la capacidad calculada que le queda al peer ",{
                remainingPeerCapacity:remainingPeerCapacity,
                peerId:data.peerId,
                maxConnectedPeers: peers[data.peerId].capabilities.maxConnectedPeers,
                   // currConnPeers:currConnPeers
            });
     
            if(data.originPeerId !== fromPeer.assignedSFU){

                let targetSFU = peers[fromPeer.assignedSFU];

                if(targetSFU){
                    console.log("peer_stream_loaded -- is this stream and peer not yet loaded? ",{targetSFU:targetSFU,originPeerId:data.originPeerId,originStreamId:data.originStreamId});
                    let streamAlreadyLoadedInSFU = peer.streamAlreadyLoaded(targetSFU,data.originPeerId,data.originStreamId);
        
                    if(!streamAlreadyLoadedInSFU){
                        
        
                        let sfuSockId = socketIdMapping[fromPeer.assignedSFU];
        
                        let rsData = {
                            senderId: data.peerId,
                            targetPeerId: data.originPeerId,
                            targetStreamId: data.originStreamId,
                            sessionId: data.sessionId
                        };
            
                        console.log("peer_stream_loaded -- sending request_stream event to sender's SFU",
                        {fromPeer:fromPeer,sfu:fromPeer.assignedSFU,rsData:rsData});
            
                        io.to(sfuSockId).emit("request_stream", rsData);
                    }else{

                        console.log("peer_stream_loaded -- stream already loaded in sender's SFU",
                        {fromPeer:fromPeer,originPeerId:data.originPeerId,originStreamId:data.originStreamId});

                        let lastSFU = getLastSFU(peers);

                        if(lastSFU.id !== data.originPeerId && lastSFU.id !== fromPeer.id){

                            console.log("peer_stream_loaded -- testing if stream is already present on the last SFU",
                            {fromPeer:fromPeer,lastSFU:lastSFU,originPeerId:data.originPeerId,originStreamId:data.originStreamId});

                            let streamAlreadyLoadedInLastSFU = peer.streamAlreadyLoaded(lastSFU,data.originPeerId,data.originStreamId);

                            if(!streamAlreadyLoadedInLastSFU){
                                
                                let sfuSockId = socketIdMapping[lastSFU.id];
            
                                let rsDataLast = {
                                    senderId: data.peerId,
                                    targetPeerId: data.originPeerId,
                                    targetStreamId: data.originStreamId,
                                    sessionId: data.sessionId
                                };
                    
                                console.log("peer_stream_loaded -- sending request_stream event to last SFU",
                                {fromPeer:fromPeer,lastSFU:lastSFU,rsDataLast:rsDataLast});
                    
                                io.to(sfuSockId).emit("request_stream", rsDataLast);

                            }else{

                                console.log("peer_stream_loaded -- stream already added to last SFU...relay finished",
                                    {fromPeer:fromPeer,lastSFU:lastSFU,originPeerId:data.originPeerId,originStreamId:data.originStreamId});


                                    let originStreamRef = peers[data.originPeerId].localStreams[data.originStreamId];

                                    let autoRelay = originStreamRef.label === "camera" || 
                                    (originStreamRef.label !== "camera" && peers[data.originPeerId].mainPresenter);
            
                                    console.log("peer_stream_loaded -- determine if should auto-relay this stream to origin's non sfu assigned peers",{
                                        data,peers,autoRelay
                                    });
                                    
                                    if(autoRelay){
            
                                        let pendingPeerIds = Object.keys(peers).filter( p => {
                                            return !peers[p].sfu && peers[p].assignedSFU === data.originPeerId && 
                                            !peer.streamAlreadyLoaded(peers[p],data.originPeerId,data.originStreamId);
                                        });
                        
                                        console.log("peer_stream_loaded -- resultado de pendingPeerIds",{ppIds:pendingPeerIds,origin:data.originPeerId,streamId: data.originStreamId});
                                        pendingPeerIds.forEach( p => {
                                            let sfuSockId = socketIdMapping[p];
                                
                                            let rsDataPending = {
                                                senderId: data.peerId,
                                                streamLabel:data.streamLabel,
                                                targetPeerId: data.originPeerId,
                                                targetStreamId: data.originStreamId,
                                                sessionId: data.sessionId
                                            };
                                
                                            console.log("peer_stream_loaded -- sending request_stream to this peer",
                                            {fromPeer:fromPeer,peer:peers[p],rsDataPending:rsDataPending});
                                
                                            io.to(sfuSockId).emit("request_stream", rsDataPending);
                                        });
                        
                                    }

                                
                            }

                        }else if(lastSFU.id === data.originPeerId){

                            console.log("peer_stream_loaded -- last SFU is the origin of this stream...sending its peers the request_stream event",
                            {fromPeer:fromPeer,lastSFU:lastSFU,originPeerId:data.originPeerId,originStreamId:data.originStreamId});
                        
                            let pendingPeerIds = Object.keys(peers).filter( p => {
                                return !peers[p].sfu && peers[p].assignedSFU === data.originPeerId && 
                                !peer.streamAlreadyLoaded(peers[p],data.originPeerId,data.originStreamId);
                            });
            
                            console.log("peer_stream_loaded -- resultado de pendingPeerIds",{ppIds:pendingPeerIds,origin:data.originPeerId,streamId: data.originStreamId});
                            pendingPeerIds.forEach( p => {
                                let sfuSockId = socketIdMapping[p];
                    
                                let rsDataPending = {
                                    senderId: data.peerId,
                                    targetPeerId: data.originPeerId,
                                    targetStreamId: data.originStreamId,
                                    sessionId: data.sessionId
                                };
                    
                                console.log("peer_stream_loaded -- sending request_stream to this peer",
                                {fromPeer:fromPeer,peer:peers[p],rsDataPending:rsDataPending});
                    
                                io.to(sfuSockId).emit("request_stream", rsDataPending);
                            });

                            // console.log("peer_stream_loaded -- origin peer is the same as last SFU...no relay needed",
                            //     {fromPeer:fromPeer,lastSFU:lastSFU,originPeerId:data.originPeerId,originStreamId:data.originStreamId});
                        }

                        
                    }
                }else{
                    console.warn("peer_stream_loaded -- target SFU not defined!",{
                        data:data,
                        fromPeer:fromPeer
                    });  
                }
                

            }else{
                
                console.debug("peer_stream_loaded -- sender's assigned SFU is the same as the origin peer of this stream",{
                    data:data,
                    fromPeer:fromPeer
                });

                let lastSFU = getLastSFU(peers);

                if(fromPeer.id !== lastSFU.id){

                    if(!peer.streamAlreadyLoaded(lastSFU,data.originPeerId,data.originStreamId)){
                            
                            let sfuSockId = socketIdMapping[lastSFU.id];
        
                            let rsDataLast = {
                                senderId: data.peerId,
                                targetPeerId: data.originPeerId,
                                targetStreamId: data.originStreamId,
                                sessionId: data.sessionId
                            };
                
                            console.log("peer_stream_loaded -- sending request_stream event to last SFU",
                            {fromPeer:fromPeer,lastSFU:lastSFU,rsDataLast:rsDataLast});
                
                            io.to(sfuSockId).emit("request_stream", rsDataLast);
                    }else{
                        console.log("peer_stream_loaded -- stream already added to last SFU...relay finished",
                        {fromPeer:fromPeer,lastSFU:lastSFU,originPeerId:data.originPeerId,originStreamId:data.originStreamId});


                        let originStreamRef = peers[data.originPeerId].localStreams[data.originStreamId];

                        let autoRelay = originStreamRef.label === "camera" || 
                        (originStreamRef.label !== "camera" && peers[data.originPeerId].mainPresenter);

                        console.log("peer_stream_loaded -- determine if should auto-relay this stream to origin's non sfu assigned peers",{
                            data,peers,autoRelay
                        });

                        if(autoRelay){

                            let pendingPeerIds = Object.keys(peers).filter( p => {
                                return !peers[p].sfu && peers[p].assignedSFU === data.originPeerId && 
                                !peer.streamAlreadyLoaded(peers[p],data.originPeerId,data.originStreamId);
                            });
            
                            console.log("peer_stream_loaded -- resultado de pendingPeerIds",{ppIds:pendingPeerIds,origin:data.originPeerId,streamId: data.originStreamId});
                            pendingPeerIds.forEach( p => {
                                let sfuSockId = socketIdMapping[p];
                    
                                let rsDataPending = {
                                    senderId: data.peerId,
                                    streamLabel:data.streamLabel,
                                    targetPeerId: data.originPeerId,
                                    targetStreamId: data.originStreamId,
                                    sessionId: data.sessionId
                                };
                    
                                console.log("peer_stream_loaded -- sending request_stream to this peer",
                                {fromPeer:fromPeer,peer:peers[p],rsDataPending:rsDataPending});
                    
                                io.to(sfuSockId).emit("request_stream", rsDataPending);
                            });
            
                        }

                    }
                }else{
                    let originStreamRef = peers[data.originPeerId].localStreams[data.originStreamId];

                    let autoRelay = originStreamRef.label === "camera" || 
                    (originStreamRef.label !== "camera" && peers[data.originPeerId].mainPresenter);


                    if(autoRelay){
                        let pendingPeerIds = Object.keys(peers).filter( p => {
                            return !peers[p].sfu && peers[p].assignedSFU === data.originPeerId && 
                            !peer.streamAlreadyLoaded(peers[p],data.originPeerId,data.originStreamId);
                        });
        
                        console.log("peer_stream_loaded -- resultado de pendingPeerIds",{ppIds:pendingPeerIds,origin:data.originPeerId,streamId: data.originStreamId});
                        pendingPeerIds.forEach( p => {
                            let sfuSockId = socketIdMapping[p];
                
                            let rsDataPending = {
                                senderId: data.peerId,
                                streamLabel:data.streamLabel,
                                targetPeerId: data.originPeerId,
                                targetStreamId: data.originStreamId,
                                sessionId: data.sessionId
                            };
                
                            console.log("peer_stream_loaded -- sending request_stream to this peer",
                            {fromPeer:fromPeer,peer:peers[p],rsDataPending:rsDataPending});
                
                            io.to(sfuSockId).emit("request_stream", rsDataPending);
                        });
                    }
                    
    
                }

                
            }

            let originStreamRef = peers[data.originPeerId].localStreams[data.originStreamId];

            let autoRelay = originStreamRef.label === "camera" || 
            (originStreamRef.label !== "camera" && peers[data.originPeerId].mainPresenter);

            if(remainingPeerCapacity && autoRelay){
                let remains = remainingPeerCapacity + 0;
    
                filteredPeerIds.forEach(p => {
    
                    if(remains > 0){

                        if(!peer.streamAlreadyLoaded(peers[p],data.originPeerId,data.streamId)){

                            // let targetSocketId = socketIdMapping[data.peerId];
        
                            // let data2 = {
                            //     peerId: p,
                            //     target: data.originPeerId,
                            //     loadedStreamId: data.streamId,
                            //     targetLocalStreams: originPeer.localStreams
                
                            // };

                            // console.log("peer_stream_loaded -- sending send_peer_stream event to peer's assigned SFU",{sfu:data.peerId,data2: data2});
                                
                            // io.to(targetSocketId).emit("send_peer_stream", data2);
                            // remains = remains - 1; 


                            let targetSocketId = socketIdMapping[p];
                
                            let rsData = {
                                senderId: data.peerId,
                                streamLabel:data.streamLabel,
                                targetPeerId: data.originPeerId,
                                targetStreamId: data.originStreamId,
                                sessionId: data.sessionId
                            };
                
                            console.log("peer_stream_loaded -- sending request_stream to this peer",
                            {fromPeer:fromPeer,peer:peers[p],rsData:rsData});
                
                            io.to(targetSocketId).emit("request_stream", rsData);

                        }else{
                            console.debug("peer_stream_loaded -- stream already loaded on target peer",{
                                sfu: data.peerId,
                                peerId: p,
                                target: data.originPeerId,
                                loadedStreamId: data.streamId,
                                targetLocalStreams: originPeer.localStreams
                            });
                        }
                        
                    }
    
        
                });
            }else{
                console.warn("this sfu does not have available peer connections remaining",{
                    peerId:data.peerId,
                    maxConnectedPeers: peers[data.peerId].capabilities.maxConnectedPeers,
                    //currConnPeers:currConnPeers
                })
            }
        }



        return true;

    });

    // socket.on("cloned_stream", async data => {
    //     // console.log("peer_webrtc_message",{data:data});
    //     console.log("cloned_stream -- starting...",{data:data});

    //         let targetSocketId = socketIdMapping[data.target];

    //         let data2 = {
    //             peerId: data.peerId,
    //             originPeerId:data.originPeerId,
    //             originStreamId: data.originStreamId,
    //             streamId: data.streamId
    //         };

    //         let peer = await memoryDBAPI.findById("session_peers",data.peerId);

    //         if(!peer.upstream){
    //             peer.upstream = {};
    //         }
    
    //         if(!peer.upstream[data.target]){
    //             peer.upstream[data.target] = {};
    //         }
    
    //         peer.upstream[data.target][data.streamId] = {
    //             originPeerId:data.originPeerId,
    //             originStreamId:data.originStreamId
    //         }
    
    //         await memoryDBAPI.updateMergeById("session_peers", data.peerId, { upstream: peer.upstream });

    //         console.log("cloned_stream -- sending cloned_stream event to target peer",{sfu:data.peerId,data2: data2});

    //         io.to(targetSocketId).emit("cloned_stream", data2);

    //     return true;

    // });


    socket.on("end_of_stream_relay_chain", async data => {
        // console.log("peer_webrtc_message",{data:data});
        console.log("end_of_stream_relay_chain -- starting...",{data:data});

            //let peer = await memoryDBAPI.findById("session_peers",data.peerId);
            let peers = await memoryDBAPI.queryCollection("session_peers", [
                { "field": "session_id", "operator": "==", "value": data.sessionId }
            ]);

            let lastSFU = getLastSFU(peers);
            let originPeer = peers[data.originPeerId];
            //let originSFU = peers[originPeer.assignedSFU];

            console.log("end_of_stream_relay_chain -- lastSFU and originPeer ",{lsfu:lastSFU,oPeer:originPeer});

            if(!originPeer.sfu && originPeer.assignedSFU !== lastSFU.id && peers[lastSFU.assignedSFU].assignedSFU !== lastSFU.id ){
                
                let targetSocketId = socketIdMapping[lastSFU.id];
    
                let data2 = {
                    senderId: data.peerId,
                    targetPeerId: data.originPeerId,
                    targetStreamId: data.originStreamId,
                    sessionId: data.sessionId
                };
    
                console.log("end_of_stream_relay_chain -- sending request_stream event to target peer",{sfu:data.peerId,data2:data2});
    
                io.to(targetSocketId).emit("request_stream", data2);
            }else{
                console.log("end_of_stream_relay_chain -- won't send request_stream ",{data:data,lsfu:lastSFU,oPeer:originPeer});
            }   


        return true;

    });

    socket.on("peer_stream_requested", async data => {
        console.log("peer_stream_requested -- starting ",{data:data});
        let peers = await memoryDBAPI.queryCollection("session_peers", [
            { "field": "session_id", "operator": "==", "value": data.sessionId }
        ]);

        //getConnectedStreamsPerSFU(data.peerId,peers);

        let candidatePeerIds = Object.keys(peers).filter(p => {
            //console.log("peer_stream_requested -- filtering peers ",{p: p, currPeer: peers[p] });
            // if(peers[p].sfu &&  p !== data.peerId && p !== data.target && peers[p] && peers[p].totalConnectedStreams && peers[p].totalConnectedStreams.indexOf(data.streamId) !== -1){
                if(peers[p].sfu &&  p !== data.peerId && p !== data.target && peers[p] && peer.streamAlreadyLoaded(peers[p],data.target,data.streamId)){
                return true;
            }
        })
        // .filter(sfu => {
        //     console.debug("peer_stream_requested -- filtering out maxRelay",{
        //         sfu:sfu,
        //         currConn:peers[sfu].totalConnectedStreams ? peers[sfu].totalConnectedStreams.length: null,
        //         maxRelay:peers[sfu].maxRelay
        //     })
        //     return peers[sfu].totalConnectedStreams.length < peers[sfu].maxRelay
        // })
        .sort((a,b) => {
            // let aQty = peers[a].totalConnectedStreams ? peers[a].totalConnectedStreams.length: 0;
            // let bQty = peers[b].totalConnectedStreams ? peers[b].totalConnectedStreams.length: 0;
            let aQty = peers[a].upstream ? countUpstreamPeers(peers[a].upstream): 0;
            let bQty = peers[b].upstream ? countUpstreamPeers(peers[b].upstream): 0;
            console.log("peer_stream_requested -- sorting peers ",{a: a,b:b,aQty:aQty,bQty:bQty,peers: JSON.stringify(peers,null,2)});

            if(aQty < bQty){
                return -1;
            }else if( aQty > bQty){
                return 1;
            }else{
                return 0;
            }
        });

        console.log("peer_stream_requested -- resulting candidate peer ids ",{candidatePeerIds: candidatePeerIds});

        let selectedPeerId = candidatePeerIds ? candidatePeerIds[0] : null;

        if(selectedPeerId){

            let targetSocketId = socketIdMapping[selectedPeerId];

            data.targetLocalStreams = {};
            data.targetLocalStreams[data.streamId] = peers[data.target].localStreams[data.streamId];
                

            console.log("peer_stream_requested -- we have a source peer id to ask for target's streams",{selected:selectedPeerId,data: data});

            io.to(targetSocketId).emit("send_peer_stream", data);

        }else{
            console.warn("peer_stream_requested -- could not find a sourcePeerId for the target's streams",
            {peerId: data.peerId,target:data.target});
        }




        // let peer = await memoryDBAPI.findById("session_peers", data.peerId);

        // if(peer && peer.assignedSFU){

        //     let targetSocketId = socketIdMapping[peer.assignedSFU];

        //     data.targetLocalStreams = peers[data.target].localStreams;

        //     console.log("peer_stream_requested -- sending send_peer_stream to SFU to ask for target's streams",{peerId: data.peerId,peerSFU:peer.assignedSFU,data: data});

        //     io.to(targetSocketId).emit("send_peer_stream", data);

        // }else{
        //     console.warn("peer_stream_requested -- could not find peer or this peer does not have an SFU assigned yet",{data:data,peer:peer});
        // }
        

        return true;

    });

    socket.on("leave", async (data,callback) => {
        console.debug("peer leaving - " + data.userId + " " + data.roomId);
        
        await removePeerFromSession(socket.handshake.query.room_id, socket.handshake.query.peer_id);
       
      
        callback({
            result: "ok"
        });
    });

    // Leave the room if the user closes the socket
    socket.on("disconnect", async () => {
        console.log(`Client ${socket.id} diconnected`);
        disconnectionTimeouts[socket.handshake.query.peer_id] = setTimeout(() => {
            removePeerFromSession(socket.handshake.query.room_id, socket.handshake.query.peer_id);
        },10000);
    });

    socket.on("error", (e) => {
        console.log(e);
    });


});