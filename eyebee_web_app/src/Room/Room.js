import React, { useState, useEffect } from "react";

import "./HexGrid.css";

import { ThemeProvider, StyledEngineProvider, CssBaseline, useMediaQuery, Slide } from "@mui/material";
import { useTheme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

import RemotePeerWidget from "../RemotePeerWidget";

import MediaPlayerWidget from "../MediaPlayerWidget";
import RoomActionsWidget from "./RoomActionsWidget";

import WebRTCManager from "../WebRTCManager";
import RTCPeerConnectionFactory from "../RTCPeerConnectionFactory";
import RTCIceCandidateFactory from "../RTCIceCandidateFactory";
import SideBoxWidget from "./SideBoxWidget";
import Screen from "../Screen";
import ScreenView from "../ScreenView";
import RoomGrid from "../RoomGrid";
import CreateNewSubRoom from "./CreateNewSubRoom";

const useStyles = makeStyles(theme => ({
  mainBox: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
    flexDirection: "column",
    flex: "2"
  },
  videoCallBox: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    flexDirection: "column",
    flex: "2"
  },
  peerItem: {
    margin: "0.3em",
    transition: "transform 0.2s ease-in-out"
  },
  sideBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    color: "#f5f5f5",
    width: "100%",
  },
  roomPlayersBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    flex: "2",
  },
  localMediaBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%"
  },
  remoteMediaBox: {
    display: "flex",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flex: "2",
    overflow: "auto"
  }
}));

const Room = (props) => {
  const classes = useStyles();
  const theme = useTheme();
  const [roomManager, setRoomManager] = useState(null);
  const [peerId, setPeerId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isPresenter, setIsPresenter] = useState(false);
  const [isMainPresenter, setIsMainPresenter] = useState(false);
  const [peerJoined, setPeerJoined] = useState(false);
  const [roomUsers, setRoomUsers] = useState({});
  const [webrtcManager, setWebRTCManager] = useState(null);
  const [startupFinished, setStartupFinished] = useState(false);
  const [remotePeerStreams, setRemotePeerStreams] = useState({});
  const [presentationRequested, setPresentationRequested] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessages, setNewMessages] = useState(false);


  const [subRooms, setSubRooms] = useState([]);
  const [createSubRooState, setCreateSubRooState] = useState(false);

  const [sideBoxState, setSideBoxState] = useState({
    opened: false,
    section: ""
  });

  const xsScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const smScreen = useMediaQuery(theme.breakpoints.up("sm"));
  const mdScreen = useMediaQuery(theme.breakpoints.up("md"));
  const lgScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [playerSizes, setPlayerSizes] = useState({
    owner: 20,
    presenter: 110,
    spectator: 5
  });

  const [screen, setScreen] = useState(null);
  const [currentSection, setCurrentSection] = useState("main");
  const [selectedScreenPresenter, setSelectedScreenPresenter] = useState(null);
  const [angle, setAngle] = useState(45);
  const [row, setRow] = useState(1);

  const [defaultVideoConstraints, setdefaultVideoConstraints] = useState({
    height: {
      ideal: 240,
      max: 480
    },
    width: {
      ideal: 320,
      max: 640
    },
    frameRate: {
      min: 5,
      ideal: 15,
      max: 15
    }
  });

  const [lowVideoConstraints, setlowVideoConstraints] = useState({
    height: {
      ideal: 240,
      max: 480
    },
    width: {
      ideal: 320,
      max: 640
    },
    frameRate: {
      ideal: 2,
      max: 5
    }
  });

  const [oldScreenPresenter, setOldScreenPresenter] = useState(null);


  const onUserJoined = data => {
    console.log("entró a onUserJoined", { rps: remotePeerStreams });
    setRoomUsers({
      ...data.users
    });
      
    if(data.newUser.sfu){
      webrtcManager.updatePeerSFUOrder(data.newUser.id, data.newUser.sfuOrder);
    }

  };

  const onPeerMediaChanged = (data, peer) => {

    console.debug("onPeerMediaChanged", { data: data, peer: peer, ru: roomUsers, rps: remotePeerStreams });


    if (data.type === "deleted") {


      if(data.label === "screen" && selectedScreenPresenter && selectedScreenPresenter.id === peer.id){
        console.debug("onPeerMediaChanged -- selectedScreenPresenter is the same as this peer... back to room view",{selectedScreenPresenter,peer,data});

        setOldScreenPresenter(null);  
        setCurrentSection("main");
        setSelectedScreenPresenter(null);

      }

      let streamToRemove = remotePeerStreams[peer.id][data.streamId];
      if (streamToRemove) {

        console.debug("onPeerMediaChanged -- stream to remove found", { rs: roomUsers, rps: remotePeerStreams, streamToRemove: streamToRemove })

        //remove senders that may have been retransmitting this stream
        webrtcManager.removeMediaFromPCs(streamToRemove);

      }
      // let linkedStreamIds = webrtcManager.findPeerStreamId(peer.id,data.streamId);

      // linkedStreamIds.forEack(sId => {

      //   let streamToRemove = remotePeerStreams[peer.id][sId];
      //   //let streamToRemove = remotePeerStreams[peer.id][data.streamId];
      //   if(streamToRemove){

      //     console.debug("onPeerMediaChanged -- stream to remove found",{rs:roomUsers, rps: remotePeerStreams,streamToRemove:streamToRemove})
      //     //remove senders that may have been retransmitting this stream
      //     webrtcManager.removeMediaFromPCs(streamToRemove);

      //   }

      // });
      
    }else{
      if(roomUsers[props.userData.peerId].assignedSFU === peer.id && data.label !== "camera" ){
        webrtcManager.requestPeerStream(peer.id,data.streamId);
      }

    }

    roomUsers[peer.id].localStreams = peer.localStreams;
    webrtcManager.updatePeerLocalStreams(peer.id, peer.localStreams);
    setRoomUsers({
      ...roomUsers
    });

  };

  const onSFUAssigned = async (peer, users) => {
    console.log("onSFUAssigned", { ru: roomUsers, peer: peer,rru:users });
    //roomUsers[peer.id].assignedSFU = peer.assignedSFU;

    if (peer.id === props.userData.peerId) {

      let sfuPeer = users[peer.assignedSFU];

      console.debug("peer assigned as sfu for this peer", { peer: peer, sfu: sfuPeer });

      webrtcManager.assignedSFU = sfuPeer;

      webrtcManager.updatePeerLocalStreams(sfuPeer.id, users[sfuPeer.id].localStreams);
  

      let peerConnExists = webrtcManager.getPCToPeer(peer.assignedSFU);

      console.log("onSFUAssigned -- peerConnExists Peer: " + peer.id + " SFU: " + peer.assignedSFU + " exists: " + peerConnExists)
      if (peerConnExists) {
        console.log("onSFUAssigned -- enters addLocalStreamsToPC: " + peer.id + " SFU: " + peer.assignedSFU);
        webrtcManager.addLocalStreamsToPC(peer.id, peer.assignedSFU);
      } else {
        console.log("onSFUAssigned -- enters requestPeerConnections: " + peer.id + " SFU: " + peer.assignedSFU);
        await requestPeerConnections(sfuPeer, webrtcManager);
        await webrtcManager.requestPeersStreams(users, props.userData.isOwner, props.userData.isPresenter);
      }


    } else {
      console.log("updating peer's assigned SFU", { peerId: peer.id, sfu: peer.assignedSFU });
      webrtcManager.updatePeerAssignedSFU(peer.id, peer.assignedSFU);
    }

    setRoomUsers({
      ...users
    });

  };


  useEffect(() => {
    if (roomManager) {

      roomManager.addRoomEventCallbacks({
        "onUserJoined": onUserJoined,
        "onPeerMediaChanged": onPeerMediaChanged,
        "onUsers": onUsers,
        "onChatMessage": onChatMessage,
        "onNewSubRoom": onNewSubRoom,
        "onNewPresenter": onNewPresenter,
        "onUserPresentationRequest": onUserPresentationRequest,
        "onUserPresentationCancelled": onUserPresentationCancelled,
        "onUserPresentationGranted": onUserPresentationGranted,
        "onUserPresentationRemoved": onUserPresentationRemoved,
        "onUserLeft": onUserLeft,
        "onNewMainPresenter": onNewMainPresenter,
        "onSFUAssigned": onSFUAssigned,
        "onError": onRoomManagerError
      });

      return () => {
        //console.debug("effect callback de roomManager callbacks");
        roomManager.removeRoomEventCallbacks();
      }

    }




  }, [roomManager, roomUsers, remotePeerStreams]);

  useEffect(() => {

    if (webrtcManager) {
      webrtcManager.setEventCallbacks({
        "onRemoteTrack": onRemoteTrack,
        "onRemoteStreamRemoved": onRemoteStreamRemoved,
        "onClonedStreamsUpdated": onClonedStreamsUpdated,
        "onStreamLoaded":onStreamLoaded
        //"onMPStreamLoaded":onMPStreamLoaded
      });
    }

    return () => {
      //console.debug("effect callback de webrtcManager callbacks");
    }

  }, [webrtcManager, roomUsers, remotePeerStreams,oldScreenPresenter]);

  const onChatMessage = (msg, messages) => {
    if (messages && messages.length > 0) {
      setNewMessages(true);
    }

    setMessages([...messages]);

  }

  const onNewSubRoom = (msg, subRooms) => {
    setSubRooms([...subRooms]);
  }

  const onNewPresenter = (newPresenter, updatedUserList) => {

    console.log("llega a new presenter en room", { newPresenter: newPresenter, updatedUserList: updatedUserList });

    setRoomUsers({
      ...updatedUserList
    });

  };

  const closePeerConnection = (peer) => {
    //console.log("en closePeerConnection el valor de webrtcmanager",{webrtcManager:webrtcManager,peer:peer});
    webrtcManager.closePeerConnection(peer);
  }

  const deleteRemotePeerStreams = peerId => {
    if (remotePeerStreams[peerId]) {
      let streamIds = Object.keys(remotePeerStreams[peerId]);
      streamIds.forEach(s => {
        delete remotePeerStreams[peerId][s];
      });
      delete remotePeerStreams[peerId];
    }

    console.log("deleteRemotePeerStreams rps state ", { rps: remotePeerStreams });

  }

  useEffect(() => {
    if (roomUsers[props.userData.peerId]) {
      setIsOwner(roomUsers[props.userData.peerId].owner);
      setIsPresenter(roomUsers[props.userData.peerId].presenter);
      setIsMainPresenter(roomUsers[props.userData.peerId].mainPresenter);

    }

    return () => {
      //console.debug("effect callback de roomUsers");
    }

  }, [roomUsers]);

  const onUserLeft = data => {
    console.log("(Room) entrando a onUserLeft", { data: data, ru: roomUsers, rps: remotePeerStreams });
    console.log(webrtcManager.remotePeers);
    closePeerConnection({
      peerId: data.userId
    },true);
    deleteRemotePeerStreams(data.userId);

    setRemotePeerStreams({
      ...remotePeerStreams
    });



    delete roomUsers[data.userId];

    setRoomUsers({
      ...roomUsers
    });

    if (webrtcManager.assignedSFU && data.userId === webrtcManager.assignedSFU.id) {
      console.debug("onUserLeft -- my SFU is leaving the room," +
        " reset my assignedSFU and ask for another one",
        {
          myId: props.userData.peerId, myself: roomUsers[props.userData.peerId],
          leavingPeerId: data.userId
        });
      webrtcManager.assignedSFU = null;
      delete roomUsers[props.userData.peerId].assignedSFU;

      //props.roomManager.requestTargetSFU(props.userData.peerId,props.userData.roomId);
    }

    console.log("(Room) saliendo a onUserLeft", { data: data, ru: roomUsers, rps: remotePeerStreams });

  };

  const onNewMainPresenter = (mainPresenterId, users) => {

    console.log("estado de ru al actualizar con el nuevo main presenter",
      { ru: users, mainPId: mainPresenterId });

      webrtcManager.updateMainPresenter(mainPresenterId);

    setRoomUsers({ ...users });

  }

  const onUserPresentationRequest = (user, users) => {
    console.debug("onUserPresentationRequest", { user: user, ru: users });

    setRoomUsers({
      ...users
    });

  };

  const onUserPresentationCancelled = (data, users) => {

    console.debug("onUserPresentationCancelled", { data: data, users: users });
    if (users[data.userId]) {

      console.log("el estado de isowner y ispresenter antes de preguntar para eliminarlo", { owner: isOwner, presenter: isPresenter });
      //if I'm just a simple peer, disconnect from this former presenter and delete it from the room list
      if (!isOwner && !isPresenter) {

        console.log("como este era un presentador, se elimina de los streams", { userId: data.userId });
        closePeerConnection({
          peerId: data.userId
        });

        deleteRemotePeerStreams(data.userId);

      }

      if (data.userId === peerId) {

        if(props.localCamera){

          props.localCamera.mute();
          applyLocalVideoConstraints(lowVideoConstraints).then(() => {
            console.log("low video constraints applied successfully");
          }).catch(err => {
            console.log("error when applying low constraints to localCamera", { error: err });
          });

        }
        

      }


      setRoomUsers({
        ...users
      });
    }

  };

  const onUserPresentationGranted = (data, users) => {
    console.debug("onUserPresentationGranted", { data: data });

    if (data.target === peerId) {
      setPresentationRequested(false);
      setIsPresenter(true);

      applyLocalVideoConstraints(defaultVideoConstraints).then(() => {
        console.log("default video constraints applied successfully");
      }).catch(err => {
        console.log("error when applying default video constraints to localCamera", { error: err });
      });

    } else {
      setRoomUsers({
        ...users
      });

    }



  };

  // const onUsers = async users => {

  // }

  const onUsers = async users => {

    setRoomUsers({
      ...users
    });
  };

  const removeConnectedSimplePeers = (users) => {
    console.log("valor inicial de roomUsers y de isPresenter", { ru: users });
    Object.keys(users).forEach(u => {
      let user = users[u];
      if (user.id !== peerId) {
        console.log("por analizar el peer si es comun", { peer: user, rpss: remotePeerStreams, rps: remotePeerStreams[user.id] });
        if (!user.owner && !user.presenter) {
          console.log("ete es un peer comun, cerrando el peerconnection y eliminando el stream remoto", { peer: user });
          closePeerConnection({
            peerId: user.id
          });
          deleteRemotePeerStreams(user.id);
          delete users[user.id];
          setRoomUsers({
            ...users
          })
        }
      }

    });

    console.log("valor final de roomUsers y de isPresenter", { ru: users, isPresenter: isPresenter });

  }

  const applyLocalVideoConstraints = async videoConstraints => {
    if (props.localCamera && props.localCamera.getStream()) {
      await props.localCamera.getStream().getVideoTracks()[0].applyConstraints(videoConstraints);
      return true;
    } else {
      throw "NO_STREAM_IN_LOCAL_CAMERA";
    }

  }

  const onUserPresentationRemoved = (data, users) => {
    console.debug("onUserPresentationRemoved", { data: data, users: users });

    if (data.target === peerId) {
      setPresentationRequested(false);
      setIsPresenter(false);

      console.log("soy el mismo peer al que le revocaron la presentacion");
      //close peer connections to the simple peers

      let rs = {
        ...roomUsers
      }

      setRoomUsers({
        ...users
      })

      if(props.localCamera){
        props.localCamera.mute();
        applyLocalVideoConstraints(lowVideoConstraints).then(() => {
          console.log("low video constraints applied successfully");
        }).catch(err => {
          console.log("error when applying low constraints to localCamera", { error: err });
        }).finally(() => {
          removeConnectedSimplePeers(rs);
        });
      }
      



    } else {
      console.log("NO soy el mismo peer al que le revocaron la presentacion", { revokedPeerId: data.target });

      if (!isOwner && !isPresenter) {
        console.log("soy peer comun, cerrando el peerconnection y eliminando el stream remoto", { peer: users[data.target] });
        closePeerConnection({
          peerId: data.target
        });
        deleteRemotePeerStreams(data.target);

      }

      console.log("el nuevo roomUsers despues de revocar la presentacion", { ru: roomUsers, rs: remotePeerStreams });

      setRoomUsers({
        ...users
      })

    }



  };

  const onRemoteTrack = (peerId, track, stream) => {
    // console.debug("(Room) entraa onRemoteTrack", { rps: remotePeerStreams, newStream: stream });
    if (!remotePeerStreams[peerId]) {
      remotePeerStreams[peerId] = {};
    }


    // if(remotePeerStreams[peerId][stream.id]){
    //   return false;
    // }

    remotePeerStreams[peerId][stream.id] = stream;

    // if (!remotePeerStreams[peerId][stream.id]) {
    //   remotePeerStreams[peerId][stream.id] = stream;
    // }

    if (remotePeerStreams[peerId][stream.id].active) {

      // console.debug("valor final de remotePeerStreams", {
      //   rps: remotePeerStreams, peerId: peerId,
      //   stream: stream, track: track,
      //   tracks: remotePeerStreams[peerId][stream.id].getTracks()
      // });

      // let peerHasLocalStreams = roomUsers[peerId] && roomUsers[peerId].localStreams;
      // let peerCurrStreamIsScreen = peerHasLocalStreams && roomUsers[peerId].localStreams[stream.id] && roomUsers[peerId].localStreams[stream.id].label === "screen";

      // if (peerHasLocalStreams && peerCurrStreamIsScreen) {
      //   //BUG: this opens the screen view again even if we navigate away from it
      //   //need to improve this condition to only allow this transition when 
      //   //the main presenter shares for the first time and we previously
      //   // didn't go back to room view
      //   goToScreen(roomUsers[peerId]);
      // }

    } else {
      console.debug("uno de los remote streams se desactivo...eliminando", {
        rps: remotePeerStreams, peerId: peerId,
        stream: stream
      });
      delete remotePeerStreams[peerId][stream.id];
    }

    setRemotePeerStreams({
      ...remotePeerStreams
    });
  }

  const onMPStreamLoaded = (peerId, stream,streamLabel) => {
    if( streamLabel === "screen"){

      goToScreen(roomUsers[peerId])
    }

  }

  const onStreamLoaded = (peerId, stream,streamLabel) => {
    if( streamLabel === "screen"){
      console.log("onStreamLoaded -- lo que vale el oldScreenPresenter",{currPresenter:peerId,stream,oldScreenPresenter});
        if(oldScreenPresenter&&!props.userData.sfu){
          console.debug("onStreamLoaded -- already with a presenter sharing screen, disconnecting",{oldScreenPresenter,newPresenter:peerId});
          let currScreenStreamId = Object.keys(oldScreenPresenter.localStreams).find( ls => {
            return oldScreenPresenter.localStreams[ls].label === "screen";
          });
          let currScreenStream = remotePeerStreams[oldScreenPresenter.id][currScreenStreamId];
          webrtcManager.disconnectRemoteMedia(currScreenStream,oldScreenPresenter.id);
          delete remotePeerStreams[oldScreenPresenter.id][currScreenStreamId];
          setRemotePeerStreams({
            ...remotePeerStreams
          });
        }




      //goToScreen(roomUsers[peerId])
    }
    // else{
    //   remotePeerStreams[peerId][stream.id] = stream;
    //   setRemotePeerStreams({
    //     ...remotePeerStreams
    //   });
    // }

    if(streamLabel !== "camera" && roomUsers[peerId].mainPresenter){
      console.log("onStreamLoaded -- Valor de currentSection en onStreamLoaded",{currentSection});
      if(currentSection !== "screen"){
        goToScreen(roomUsers[peerId])
      }
      
    }

  }

  const onRemoteStreamRemoved = (peerId, streamObj) => {
    console.log("entering onRemoteStreamRemoved", { peerId: peerId, streamObj: streamObj });

    console.log("remote peer streams antes de remover el stream", { rps: remotePeerStreams });
    delete remotePeerStreams[peerId][streamObj.id];
    setRemotePeerStreams({
      ...remotePeerStreams
    });
  }

  const onRoomManagerError = error => {
    console.error("Error on room Manager", { error: error });
  }

  const sendLeaveRequest = () => {
    let body = {
      roomId: props.userData.roomId,
      userId: props.userData.peerId
    }

    fetch("/videocall/api/session/leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

  }

  const requestPeerConnections = async (assignedSFUPeer, webrtcManager) => {
    try {

      if (roomUsers && Object.keys(roomUsers).length > 0) {

        let sfuIds = Object.keys(roomUsers).filter(r => {
          if (roomUsers[r].sfu && r !== props.userData.peerId
            && r !== assignedSFUPeer.id) {
            return true;
          }
        });

        Object.keys(roomUsers).forEach(p => {

          sfuIds.forEach(s => {
            if (!roomUsers[s].currConnectedPeers) {
              roomUsers[s].currConnectedPeers = [];
            }
            if (roomUsers[p].assignedSFU === s && roomUsers[s].currConnectedPeers.indexOf(p) === -1) {
              roomUsers[s].currConnectedPeers.push(p);
            }

            //console.log("getConnectedPeersPerSFU -- el resultado de currconnectedPeers para esta sfu",{sfu:s,currconnPeers:sessionPeers[s].currConnectedPeers});
          });


        });

        //filter out those SFUs that reached the max relay threshold
        // sfuIds = sfuIds.filter(sfu => {
        //     console.debug("requestPeerConnections -- comparing and filtering out SFUs with connectedPeers >= maxRelay",{
        //       sfu:sfu,
        //       currConnPeers:roomUsers[sfu].currConnectedPeers,
        //       maxRelay:roomUsers[sfu].maxRelay
        //     });
        //     return roomUsers[sfu].currConnectedPeers.length < roomUsers[sfu].maxRelay
        // });

        console.debug("requesting peer connections with sfus", { sfuIds: sfuIds });



        let targetPeers = [];

        sfuIds.forEach(e => {
          console.log("updating localStreams for this peer", { peerId: e, localStreams: roomUsers[e].localStreams });
          webrtcManager.updatePeerLocalStreams(e, roomUsers[e].localStreams);
          targetPeers.push(roomUsers[e]);
        });

        await webrtcManager.startWebRTCConnections(assignedSFUPeer, targetPeers);
        console.debug("startwebrtcConnections ok")
        return true;

      } else {
        console.debug("no peers to connect to...");
        return false;
      }

      // if(!props.userData.sfu){
      //   await webrtcManager.startWebRTCConnections(sfuPeer);
      //   console.debug("startwebrtcConnections ok")
      // }

      // await webrtcManager.startWebRTCConnections(sfuPeer);
      // console.debug("startwebrtcConnections ok")

      return true;

    } catch (err) {
      console.log("startwebrtcConnections error");
      console.error(err);
    }

  }

  const filterUsersToConnectTo = (users, currPeerId, owner, presenter) => {
    delete users[currPeerId];
    let newUserList = {};
    if (!owner && !presenter) {
      Object.keys(users).forEach(u => {

        console.log("el peer a analizarrrr", { p: users[u] });

        if (users[u].canStream && users[u].owner || users[u].presenter) {
          newUserList[u] = users[u];
        }
      });
    } else {
      newUserList = users;
    }
    return newUserList;
  }

  const onClonedStreamsUpdated = (peerId, clonedStreams) => {

    roomUsers[peerId].clonedStreams = clonedStreams;
    setRoomUsers({
      ...roomUsers
    });
  }

  const handleBeforeUnloadEvent = e => {
    if(e.preventDefault){
      e.preventDefault();
    }
    sendLeaveRequest();
    // Chrome requires returnValue to be set.
    //e.returnValue = '';
  }

  useEffect(() => {
    //step 1
    console.log("Punto inicial de room: Entra al useEffect");

    setPeerJoined(true);
    setPeerId(props.userData.peerId);
    setIsOwner(props.userData.isOwner);
    setIsPresenter(props.userData.isPresenter);

    let users = props.roomManager.getUsers();

    let userData = users[props.userData.peerId];

    console.log("arrancando -- obtuvo el user data", { uData: userData });
    setIsMainPresenter(users[props.userData.peerId].mainPresenter);
    let testUsers = {}

    // for(let i=0; i < 15; i++){
    //   let u = {
    //     id:i+1,
    //     canStream: false,
    //     userName: "user-"+Math.ceil(Math.random()*1000),
    //     presenter: true ,
    //     owner:false
    //   }

    //   testUsers["u"+(i+1)] = u;
    // }

    users = {
      ...users,
      ...testUsers
    }

    setRoomUsers(users);

    setRoomManager(props.roomManager);


    let rtcPeerConnFactory = new RTCPeerConnectionFactory();
    let rtcIceCandidateFactory = new RTCIceCandidateFactory();

    let wrtcManager = new WebRTCManager(props.userData.peerId, props.userData.roomId, rtcPeerConnFactory,
      rtcIceCandidateFactory, props.wsSocket, {
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
        {
          urls: "turn:livelatency.com",
          username: "immersiveclass",
          credential: "1mm3r51v3c1455"
        }
      ]
    }, {});
    //preferredVideoCodecs: ["video/VP9", "video/VP8", "video/H264"]

    wrtcManager.constraints = {
      preferredVideoCodecs: ["video/VP8"]
    }

    wrtcManager.sfu = userData.sfu;
    wrtcManager.sfuOrder = userData.sfuOrder;

    wrtcManager.setEventCallbacks({
      "onRemoteTrack": onRemoteTrack,
      "onRemoteStreamRemoved": onRemoteStreamRemoved,
      "onClonedStreamsUpdated": onClonedStreamsUpdated,
      "onStreamLoaded":onStreamLoaded
      //"onMPStreamLoaded":onMPStreamLoaded
    });


    if(props.localCamera){
      wrtcManager.addLocalMedia(props.localCamera.getStream(), "camera");
    }
   
    Object.keys(users).forEach(u => {

      wrtcManager.updatePeerSFUOrder(users[u].id, users[u].sfuOrder);
      if(u.mainPresenter){
        wrtcManager.updateMainPresenter(users[u].id);
      }
      
      if(u.owner){
        wrtcManager.updateOwner(users[u].id);
      }
      
    });

    setWebRTCManager(wrtcManager);

    wrtcManager.listenToWebRTCMessages();

    props.roomManager.requestTargetSFU(props.userData.peerId, props.userData.roomId);

    // if(!props.userData.sfu){
    //   let restOfUsers = {
    //     ...users
    //   }

    //   restOfUsers = filterUsersToConnectTo(restOfUsers, props.userData.peerId,
    //     props.userData.isOwner, props.userData.isPresenter);

    //   let sfuPeer = null;

    //   Object.keys(restOfUsers).forEach(e => {
    //     if(restOfUsers[e].sfu){
    //       sfuPeer = restOfUsers[e];
    //     }
    //   });

    //   requestPeerConnections(sfuPeer, wrtcManager);
    // }


    console.log("Punto final inicializaciÃ³n Room");


    window.addEventListener("beforeunload",handleBeforeUnloadEvent);
  

    let scr = new Screen(window.navigator);
    setScreen(scr);

    return () => {
      console.log("main effect -- return function executed");
      window.removeEventListener("beforeunload",handleBeforeUnloadEvent);
    }

  }, []);

  const leaveRoom = async e => {

    console.log("leaving the room ", { userData: props.userData, roomManager: props.roomManager });
    webrtcManager.closeAllPCs();
    //window.removeEventListener("beforeunload",handleBeforeUnloadEvent);
    //await props.roomManager.leave(props.userData.roomId, props.userData.peerId);
    window.location.reload();

  }

  const addLocalStream = (streamObj, label) => {
    webrtcManager.addLocalMedia(streamObj, label);
  }

  const removeLocalStream = (streamObj) => {
    webrtcManager.removeMediaFromPCs(streamObj);

  }

  const requestPresentation = () => {
    setPresentationRequested(true);
    roomUsers[props.userData.peerId].presentationRequested = true;
    setRoomUsers({
      ...roomUsers
    });

    roomManager.requestPresentation(props.userData.peerId, props.userData.roomId);
  }

  const cancelPresentation = () => {
    roomManager.cancelPresentation(props.userData.roomId, props.userData.peerId);
    roomUsers[props.userData.peerId].presentationRequested = false;
    setPresentationRequested(false);
    setIsPresenter(false);
    removeConnectedSimplePeers(roomUsers);

  }

  const removePresentation = target => {
    roomManager.removePresentation(props.userData.roomId, props.userData.peerId, target);
    if (roomUsers[target]) {
      roomUsers[target] = {
        ...roomUsers[target]
      }
      roomUsers[target].presentationRequested = false;
      roomUsers[target].presenter = false;
      setRoomUsers({
        ...roomUsers
      });

    }
  }

  const grantPresentation = reqPeerId => {
    roomManager.grantPresentation(props.userData.roomId, props.userData.peerId, reqPeerId);
    if (roomUsers[reqPeerId]) {
      roomUsers[reqPeerId] = {
        ...roomUsers[reqPeerId]
      }
      roomUsers[reqPeerId].presentationRequested = false;
      roomUsers[reqPeerId].presenter = true;
      setRoomUsers({
        ...roomUsers
      });
    }

  }

  const sendMessage = (roomId, userId, target, message) => {
    roomManager.sendMessage(props.userData.roomId, userId, target, message);
  }

  const toggleSideBox = sideBoxState => {

    if (sideBoxState.section === "chat") {
      setNewMessages(false);
    }
    setSideBoxState(sideBoxState);
  }

  const getPlayerSize = (userType) => {
    let size = 98;

    if (smScreen) {
      size = 138
    }

    if (mdScreen) {
      size = 176
    }

    if (lgScreen) {
      size = 214
    }

    if (userType == "presenter") {
      size = Math.ceil(size * 0.60);
    }

    if (userType == "spectator") {
      size = Math.ceil(size * 0.40);
    }



    return size;
  }


  useEffect(() => {
    let sizes = {
      owner: getPlayerSize("owner"),
      presenter: getPlayerSize("presenter"),
      spectator: getPlayerSize("spectator"),
    }

    setPlayerSizes(sizes);

    return () => {
      //console.debug("effect callback de screen size");
    }

  }, [smScreen, mdScreen, lgScreen]);

  // const onScreenVideoEnded = () => {
  //   console.log("aca termina screen sharing por browser UI");
  //   toggleScreen();
  // }

  const toggleScreen = async () => {
    if (screen.getStream()) {
      console.log("ya estaba funcionando screen, lo desactiva");
      removeLocalStream(screen.getStream());
      //screen.getStream().getVideoTracks()[0].removeEventListener("ended",onScreenVideoEnded);
      screen.stop();
    } else {
      console.log("reactiva la camara");
      await screen.start();
      //screen.getStream().getVideoTracks()[0].addEventListener("ended",onScreenVideoEnded);
      addLocalStream(screen.getStream(), "screen");
    }

  }

  const findStreamByLabel = (streamsObj,label) => {
    console.log("findStreamByLabel -- starting",{streams:streamsObj,label:label});
    let streamIds =  Object.keys(streamsObj);
    let streamId = streamIds.find( sId => {
        return streamsObj[sId].label === label;
    });
    console.log("findStreamByLabel -- final result ",{str:streamsObj[streamId]});
    return streamsObj[streamId];
  } 


  const backToMainSection = (stream) => {
      console.log("backToMainSection -- starting",{stream,selectedScreenPresenter});
      if(stream){
        
        // let originPeerLocalStreams = roomUsers[selectedScreenPresenter.id].localStreams;
        // console.log("backToMainSection -- originPeerLocalStreams ",{
        //   originPeerLocalStreams:originPeerLocalStreams
        // });

        // let screenStreamId = Object.keys(originPeerLocalStreams).find( s => {
        //   return originPeerLocalStreams[s].label === "screen"
        // });
        console.log("backToMainSection -- screenStreamId "+stream.id);
        // remotePeerStreams[selectedScreenPresenter.id][streamId];
  
        let screenStream = stream;
        if(screenStream&&!props.userData.sfu){
          webrtcManager.disconnectRemoteMedia(screenStream,selectedScreenPresenter.id);
        }
        
        if(!props.userData.sfu&&selectedScreenPresenter){
          delete remotePeerStreams[selectedScreenPresenter.id][stream.id];
       
          setRemotePeerStreams({
            ...remotePeerStreams
          });

          setOldScreenPresenter(null);
        }

      }

      


    setCurrentSection("main");
    setSelectedScreenPresenter(null);
  }

  const goToScreen = peer => {

    console.log("se va para la pantalla ", { peer: peer });
   
    if(!props.userData.sfu){

      if(selectedScreenPresenter){
        console.log("seteando el old screen presenter ", { selectedScreenPresenter });
        setOldScreenPresenter({
          ...selectedScreenPresenter
        });
      }
      
      

      let screenStreamId = Object.keys(peer.localStreams).find( ls => {
        return peer.localStreams[ls].label === "screen";
      });
      webrtcManager.requestPeerStream(peer.id,screenStreamId);
    }
    setSelectedScreenPresenter(peer);
    setCurrentSection("screen");


  }

  const cameraStateChanged = enabled => {
    roomUsers[props.userData.peerId].camera = enabled;
    setRoomUsers({
      ...roomUsers
    });
    roomManager.sendCameraState(props.userData.roomId, props.userData.peerId, enabled);
  }

  const micStateChanged = enabled => {
    roomUsers[props.userData.peerId].mic = enabled;
    setRoomUsers({
      ...roomUsers
    });
    roomManager.sendMicState(props.userData.roomId, props.userData.peerId, enabled);
  }

  const createSubRoom = (roomName, roomMax, roomType) => {
    console.log("createSubRoom");
    roomManager.createSubRoom(props.userData.roomId, roomName, roomMax, roomType);
    // setSubRooms(oldArray => [...oldArray, { roomName: roomName, roomMax: roomMax, roomType: roomType }]);
    // console.log(subRooms);
  }

  const toogleCreateNewSubRoom = () => {
    setCreateSubRooState(!createSubRooState);
    toggleSideBox({ section: "subrooms", opened: true });
  }

  // const getPeerStreamsByLabel = (roomUsers, remotePeerStreams, peerId) => {
  //   console.log("RoomGrid -- getPeerStreamsByLabel -- comenzando", {
  //     roomUsers: roomUsers,
  //     rps: remotePeerStreams, peerId: peerId
  //   });

  //   let streams = {};

  //   if (roomUsers && roomUsers[peerId] && remotePeerStreams[peerId]) {
  //     let peerLocalStreamRefs = roomUsers[peerId].localStreams || {};

  //     console.log("RoomGrid -- getPeerStreamsByLabel -- peer's current local streams", { peerId: peerId, peerLocalStreams: peerLocalStreamRefs });

  //     Object.keys(peerLocalStreamRefs).filter(ls => {
  //       streams[peerLocalStreamRefs[ls].label] = remotePeerStreams[peerId][ls];
  //     });

  //   } else {
  //     console.warn("RoomGrid -- getPeerStreamsByLabel: could not find reference of this peer in roomUsers or remotePeerStreams",
  //       {
  //         roomUsers: roomUsers,
  //         rps: remotePeerStreams, peerId: peerId
  //       })
  //   }

  //   return streams;

  // }

  return (
    <StyledEngineProvider injectFirst>
      (<ThemeProvider theme={theme} >
        <CssBaseline />
        <div className={classes.mainBox}>
          <div className={classes.videoCallBox}>
            {createSubRooState && <CreateNewSubRoom toggleSideBox={toggleSideBox} toogleCreateNewSubRoom={toogleCreateNewSubRoom} createSubRoom={createSubRoom}></CreateNewSubRoom>}
            <div style={{
              display: "flex",
              flex: "2",
              width: "100%"
            }}>
              <div className={classes.roomPlayersBox}>

                {
                  !props.userData.isOwner && !isMainPresenter ?
                    (
                      <div className={classes.localMediaBox}>
                        <MediaPlayerWidget
                          nomedia={false}
                          isCameraEnable={props.localCamera ? props.localCamera.isVideoEnabled():false}
                          avatar={props.userData.avatar}
                          background={isPresenter ? "primary" : "secondary"}
                          volume={0} label={props.userData && props.userData.userName || props.userData.peerId}
                          playerSize={125} stream={props.localCamera && props.localCamera.getStream()} />

                      </div>
                    )
                    :
                    (
                      <div />
                    )
                }
                <div style={{
                  display: "flex",
                  flex: "2",
                  width: "100%",
                  position: "relative",
                  overflowY: "auto"
                }}>
                  <RoomGrid nomedia={false} userData={props.userData} roomUsers={roomUsers} playerSizes={playerSizes}
                    isMainPresenter={isMainPresenter} isOwner={isOwner} isPresenter={isPresenter}
                    localCamera={props.localCamera}
                    goToScreen={goToScreen} grantPresentation={grantPresentation}
                    remotePeerStreams={remotePeerStreams}
                    onPresentationRemoved={removePresentation} />
                </div>


              </div>

            </div>

          </div>

          <div style={{
            display: "flex",
            flex: "2",
            position: "absolute",
            top: "0",
            right: "0",
            left: "0",
            bottom: "4em",
            backgroundColor: theme.palette.background.default,
            zIndex: currentSection === "screen" ? "10" : "-2",
            flexDirection: "column"
          }}>
            {

              currentSection === "screen" ?
                (
                  <ScreenView
                    userData={props.userData}
                    roomUsers={roomUsers}
                    goToScreen={goToScreen}
                    playerSizes={playerSizes}
                    remotePeerStreams={remotePeerStreams}
                    onLeaveScreenView={backToMainSection}
                    presenterPlayerSize={playerSizes["presenter"] * 0.5}
                    label={selectedScreenPresenter.userName}
                    presenterData={selectedScreenPresenter}
                    localCamera={props.localCamera}
                    presenterStreams={(remotePeerStreams && remotePeerStreams[selectedScreenPresenter.id])}
                  />
                )
                :
                (<div />)
            }

          </div>

          <div style={{

            transition: "transform 0.3s ease-in-out",
            transform: sideBoxState.opened ? "translateX(0)" : "translateX(100%)",
            position: "absolute",
            display: sideBoxState.opened ? "flex" : "none",
            height: !xsScreen ? "90%" : "85%",
            minWidth: !xsScreen ? "24.5%" : "95%",
            right: "0",
            zIndex: "11",
            boxShadow: "0 0 3em rgba(0,0,0,0.8)"
          }} >

            <div className={classes.sideBox} >
              <SideBoxWidget
                defaultSection={sideBoxState.section}
                remotePeerStreams={remotePeerStreams}
                sendMessage={sendMessage} userData={props.userData}
                removePresentation={removePresentation}
                grantPresentation={grantPresentation}
                roomUsers={roomUsers} messages={messages}
                createSubRoom={createSubRoom} subRooms={subRooms}
                toogleCreateNewSubRoom={toogleCreateNewSubRoom}
                toggleSideBox={toggleSideBox}
              />
            </div>
          </div>

          <RoomActionsWidget presenter={isPresenter} owner={isOwner}
            presentationRequested={presentationRequested} toggleSideBox={toggleSideBox}
            camera={props.localCamera} onLeave={leaveRoom}
            screen={screen}
            newMessages={newMessages}
            toggleScreen={toggleScreen}
            requestPresentation={requestPresentation}
            cancelPresentation={cancelPresentation}
            onCameraStateChanged={cameraStateChanged}
            onMicStateChanged={micStateChanged}
          />

        </div>

      </ThemeProvider>)
    </StyledEngineProvider>
  );
};

export default Room;