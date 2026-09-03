import React, { useState, useEffect } from "react";

import "./Room.css";
import "./HexGrid.css";
// import RoomAPI from "./RoomAPI";
// import UserAPI from "./UserAPI";
import PropTypes from 'prop-types';
// import useChat from "../useChat";
import { Paper, Card, Button, IconButton, AppBar, Toolbar, Typography, ThemeProvider, Tab, Tabs } from "@material-ui/core";
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import { amber, grey } from '@material-ui/core/colors';
import queryString from "query-string";
import RemotePeerWidget from "../RemotePeerWidget";
import LocalPeerWidget from "../LocalPeerWidget";
import RoomPeers from "./RoomPeers";
import ChatWidget from "./ChatWidget";

import socketIOClient from "socket.io-client";
import SocketIOProvider from "../SocketIOProvider";
import RoomManager from "./RoomManager";

import WebRTCManager from "../WebRTCManager";
import WebRTCConnectionTest from "../peerTest/webrtc-connection-test";
import RTCPeerConnectionFactory from "../RTCPeerConnectionFactory";
import RTCIceCandidateFactory from "../RTCIceCandidateFactory";

const theme = createMuiTheme({
  palette: {
    primary: {

      main: amber[500],
    },
    secondary: {

      main: grey[800],
    }
  },
});

const appBarTheme = createMuiTheme({
  palette: {
    primary: {

      main: amber[500],
    },
    secondary: {

      main: grey[800],
    },
    action: {
      disabled: amber[50],
      disabledBackground: "#2e2e2e"
    }
  },
});

const useStyles = makeStyles(theme => ({

  peerItem: {
    margin: "0.3em"
  },
  roundedBtn: {
    textTransform: "none",
    borderRadius: "4em"
  },
  roomActionBtn: {
    margin: "0 1em"
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    color: "#424242"
  },
  statusText: {
    margin: "0.5em 1em"
  },
  sideBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "21em",
    backgroundColor: "#292929",
    color: "#f5f5f5"
  },
  roomPlayersBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#000",
    flex: "2"
  },
  localPeerActionBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
}));


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{
        display: value !== index ? "none" : "flex",
        flex: "2",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}

    >
      {value === index && (
        <div style={{
          display: "flex",
          flex: "2",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start"
        }} p={3}>
          {children}
        </div>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

const Room = (props) => {
  const classes = useStyles();
  const { roomId } = props.match.params; // Gets roomId from URL
  const [roomManager, setRoomManager] = useState(null);
  const [peerId, setPeerId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isPresenter, setIsPresenter] = useState(false);
  // const { messages, sendMessage } = useChat(roomId); // Creates a websocket and manages messaging
  const [peerJoined, setPeerJoined] = useState(false);
  const [roomUsers, setRoomUsers] = useState({});
  const [webrtcManager, setWebRTCManager] = useState(null);
  const [startupFinished, setStartupFinished] = useState(false);
  const [remotePeerStreams, setRemotePeerStreams] = useState({});
  const [roomEventCallbacks, setRoomEventCallbacks] = useState();
  const [natType, setNATType] = useState();
  const [presentationRequested, setPresentationRequested] = useState(false);
  const [sideTab, setSideTab] = useState(0);

  const [userAPI, setUserAPI] = useState(null);
  const [roomAPI, setRoomAPI] = useState(null);

  const [messages, setMessages] = useState([]);
  // useEffect(() => {
  //   if(roomUsers && Object.keys(roomUsers).length > 0){
  //     console.log("wep! notifica del cambio por aca");
  //     let targetPeers = [];

  //     let peers = {
  //       ...roomUsers
  //     }

  //     delete peers[peerId];

  //     let peerKeys =  Object.keys(peers);

  //     if(peerKeys.length > 0){

  //       peerKeys.forEach(e => {
  //         targetPeers.push(peers[e]);
  //       })
  //       webrtcManager.startWebRTCConnections(targetPeers).then(() => {
  //         console.log("startwebrtcConnections ok");
  //       }).catch(err => {
  //         console.log("startwebrtcConnections error");
  //         console.error(err);
  //       });

  //     }


  //   }  

  // },[roomUsers]);

  useEffect(() => {
    if (roomManager) {


      roomManager.setRoomEventCallbacks({
        "onJoined": onJoined,
        "onUsers": onUsers,
        "onUserJoined": onUserJoined,
        "onChatMessage": onChatMessage,
        "onNewPresenter": onNewPresenter,
        "onUserPresentationRequest": onUserPresentationRequest,
        "onUserPresentationCancelled": onUserPresentationCancelled,
        "onUserPresentationGranted": onUserPresentationGranted,
        "onUserPresentationRemoved": onUserPresentationRemoved,
        "onUserLeft": onUserLeft,
        "onError": onRoomManagerError
      });

      return () => {
        roomManager.setRoomEventCallbacks(null);
      }

    }




  }, [roomManager, roomUsers, isOwner, isPresenter]);

  useEffect(() => {
    if (webrtcManager) {
      webrtcManager.setEventCallbacks({
        "onRemoteTrack": onRemoteTrack,
        "onRemoteStreamRemoved": onRemoteStreamRemoved
      });
    }
  }, [webrtcManager]);

  useEffect(() => {
    if (peerJoined && roomUsers && Object.keys(roomUsers).length > 0) {
      // webrtcManager.listenToPeerOffer();
      // webrtcManager.listenToRemoteStreamRemoved();
      webrtcManager.listenToWebRTCMessages();
      requestPeerConnections(roomUsers);
    }
  }, [peerJoined]);

  const requestPeerConnections = async (connectedPeers) => {
    try {

      if (connectedPeers && Object.keys(connectedPeers).length > 0) {
        console.debug("requesting peer connections", { connectedPeers: connectedPeers });
        let targetPeers = [];

        let peers = {
          ...connectedPeers
        }

        delete peers[peerId];

        let peerKeys = Object.keys(peers);

        peerKeys.forEach(e => {
          targetPeers.push(peers[e]);
        });
        await webrtcManager.startWebRTCConnections(targetPeers);
        console.debug("startwebrtcConnections ok")
        return true;

      } else {
        console.debug("no peers to connect to...");
        return false;
      }

    } catch (err) {
      console.log("startwebrtcConnections error");
      console.error(err);
    }

  }

  const onUsers = async data => {
    console.log("la lista de users! - " + peerId);
    console.log(data);
    setRoomUsers({
      ...data
    });

    let peersToConnect = [];

    Object.keys(data).forEach(uId => {
      console.log("luego de tener los usuarios, analiza este peer por si esta conectado", { userId: uId, user: data[uId] });
      if (!roomUsers[uId] && uId !== peerId) {
        peersToConnect.push(data[uId]);
      }
    });

    console.log("como queda el peersToConnect", { ptc: peersToConnect });
    if (peersToConnect.length > 0) {
      await webrtcManager.startWebRTCConnections(peersToConnect);
      console.log("finaliza start webrtc connections en onUsers");
    }


    //

  };

  const onUserJoined = data => {
    // console.log("se acaba de unir un user!");
    // console.log(data.newUser);
    setRoomUsers({
      ...data.users
    });


    // let users = {
    //   ...roomUsers
    // }

    // console.log("roomUsers antes");
    // console.log(roomUsers);
    // users[data.userId] = data;
    // console.log("roomUsers despues");
    // console.log(users);
    // setRoomUsers(users)

  };

  const onChatMessage = (msg, messages) => {

    console.log("onchatmessage", { msg: msg, messages: messages });
    setMessages([...messages]);

  }

  const onNewPresenter = presenter => {
    // console.log("se acaba de unir un user!");
    // console.log(data.newUser);

    console.log("llega a new presenter en room", { presenter: presenter, roomUsers: roomUsers });
    roomUsers[presenter.id] = presenter;
    setRoomUsers({
      ...roomUsers
    });


    // let users = {
    //   ...roomUsers
    // }

    // console.log("roomUsers antes");
    // console.log(roomUsers);
    // users[data.userId] = data;
    // console.log("roomUsers despues");
    // console.log(users);
    // setRoomUsers(users)

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

  }

  const onUserLeft = data => {

    closePeerConnection(data);
    deleteRemotePeerStreams(data.userId);


    setRemotePeerStreams({
      ...remotePeerStreams
    });

  };

  const onJoined = peers => {
    //console.debug("joined the room",{peers:peers});
    setRoomUsers(peers);
    setPeerJoined(true);
    //requestPeerConnections(peers);


    // if(roomUsers){
    //   delete roomUsers[data.userId];
    // }

    // setRoomUsers(roomUsers);


    // let users = {
    //   ...roomUsers
    // }
    // delete users[data.userId];
    // setRoomUsers(users)

  };

  const onUserPresentationRequest = data => {
    console.debug("onUserPresentationRequest", { data: data, ru: roomUsers });
    if (roomUsers[data.userId]) {
      roomUsers[data.userId] = {
        ...roomUsers[data.userId]
      }
      roomUsers[data.userId].presentationRequested = true;
      setRoomUsers({
        ...roomUsers
      });
    }

  };

  const onUserPresentationCancelled = data => {
    console.debug("onUserPresentationCancelled", { data: data });
    if (roomUsers[data.userId]) {
      roomUsers[data.userId] = {
        ...roomUsers[data.userId]
      }
      roomUsers[data.userId].presentationRequested = false;
      roomUsers[data.userId].presenter = false;
      console.log("el estado de isowner y ispresenter antes de preguntar para eliminarlo", { owner: isOwner, presenter: isPresenter });
      //if I'm just a simple peer, disconnect from this former presenter and delete it from the room list
      if (!isOwner && !isPresenter) {

        console.log("como este era un presentador, se elimina de los streams", { userId: data.userId });
        closePeerConnection({
          peerId: data.userId
        });

        deleteRemotePeerStreams(data.userId);

        delete roomUsers[data.userId];
      }


      setRoomUsers({
        ...roomUsers
      });
    }
  };

  const onUserPresentationGranted = data => {
    console.debug("onUserPresentationGranted", { data: data });

    if (data.target === peerId) {
      setPresentationRequested(false);
      setIsPresenter(true);
    } else {
      if (roomUsers[data.userId]) {
        roomUsers[data.userId] = {
          ...roomUsers[data.userId]
        }
        roomUsers[data.userId].presentationRequested = false;
        roomUsers[data.userId].presenter = true;
        setRoomUsers({
          ...roomUsers
        });
      }

    }



  };

  const removeConnectedSimplePeers = () => {
    console.log("valor inicial de roomUsers y de isPresenter", { ru: roomUsers, isPresenter: isPresenter });
    Object.keys(roomUsers).forEach(u => {
      let user = roomUsers[u];
      if (user.id !== peerId) {
        console.log("por analizar el peer si es comun", { peer: user, rpss: remotePeerStreams, rps: remotePeerStreams[user.id] });
        if (!user.owner && !user.presenter) {
          console.log("ete es un peer comun, cerrando el peerconnection y eliminando el stream remoto", { peer: user });
          closePeerConnection({
            peerId: user.id
          });
          deleteRemotePeerStreams(user.id);
          delete roomUsers[user.id];
          setRoomUsers({
            ...roomUsers
          })
        }
      }

    });

    console.log("valor final de roomUsers y de isPresenter", { ru: roomUsers, isPresenter: isPresenter });

  }

  const onUserPresentationRemoved = data => {
    console.debug("onUserPresentationRemoved", { data: data });

    if (data.target === peerId) {
      setPresentationRequested(false);
      setIsPresenter(false);

      console.log("soy el mismo peer al que le revocaron la presentacion");
      //close peer connections to the simple peers
      removeConnectedSimplePeers();

    } else {
      console.log("NO soy el mismo peer al que le revocaron la presentacion", { revokedPeerId: data.target });
      if (roomUsers[data.target]) {
        let user = {
          ...roomUsers[data.target]
        }
        user.presentationRequested = false;
        user.presenter = false;
        roomUsers[data.target] = user;
        setRoomUsers({
          ...roomUsers
        });

        console.log("el nuevo roomUsers despues de revocar la presentacion", { ru: roomUsers, rs: remotePeerStreams });

        if (!isOwner && !isPresenter) {
          console.log("soy peer comun, cerrando el peerconnection y eliminando el stream remoto", { peer: user });
          closePeerConnection({
            peerId: user.id
          });
          deleteRemotePeerStreams(user.id);

          delete roomUsers[user.id];
          setRoomUsers({
            ...roomUsers
          })
        }

      }
    }



  };

  useEffect(() => {
    if (remotePeerStreams) {
      console.log("el nuevo remotePeerStream");
      console.log(remotePeerStreams);
    }
  }, [remotePeerStreams]);


  const onRemoteTrack = (peerId, track, stream) => {

    if (!remotePeerStreams[peerId]) {
      remotePeerStreams[peerId] = {};
    }

    remotePeerStreams[peerId][stream.id] = stream;

    if (!remotePeerStreams[peerId][stream.id]) {
      remotePeerStreams[peerId][stream.id] = stream;
    }

    if (remotePeerStreams[peerId][stream.id].active) {

      console.log("valor final de remotePeerStreams", {
        rps: remotePeerStreams, peerId: peerId,
        stream: stream, track: track,
        tracks: remotePeerStreams[peerId][stream.id].getTracks()
      });

    } else {
      console.log("uno de los remote streams se desactivo...eliminando", {
        rps: remotePeerStreams, peerId: peerId,
        stream: stream
      });
      delete remotePeerStreams[peerId][stream.id];
    }

    setRemotePeerStreams({
      ...remotePeerStreams
    });
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

  useEffect(() => {

    let jsonQS = queryString.parse(props.location.search);
    console.log(jsonQS);

    // let roomAPI = new RoomAPI(fetch);
    // let userAPI = new UserAPI(fetch);

    // setRoomAPI(roomAPI);
    // setUserAPI(userAPI);

    //setPeerId(jsonQS.peer_id);
    setIsOwner(jsonQS.owner === "true");
    setIsPresenter(jsonQS.presenter === "true");

    if (!jsonQS.peer_id) {

      let generatedPeerId = null;
      if (jsonQS.owner === "true") {
        generatedPeerId = "moderador-" + Math.trunc(Math.random() * 1000);
      } else if (jsonQS.presenter === "true") {
        generatedPeerId = "presentador-" + Math.trunc(Math.random() * 1000);
      } else {
        generatedPeerId = "espectador-" + Math.trunc(Math.random() * 1000);
      }

      jsonQS.peer_id = generatedPeerId;
      window.location.search = props.location.search + "&peer_id=" + generatedPeerId;
      setPeerId(generatedPeerId);

    } else {
      setPeerId(jsonQS.peer_id)
    }


    let sIOProv = new SocketIOProvider(socketIOClient);
    let endpoint = "http://localhost:3009";
    if (window.location.origin.indexOf("livelatency.com") !== -1) {
      //endpoint = "http://livelatency.com:5000";
      endpoint = "/";
    }



    let socket = sIOProv.createClient(endpoint, {
      path: "/videocall/socket.io",
      transports: ['websocket'],
      query: {
        room_id: roomId,
        peer_id: jsonQS.peer_id,
      }
    });

    socket.on("disconnect", () => {
      console.log("el socket se acaba de desconectar");
    });
    socket.on("connect", () => {
      console.log("el socket se acaba de conectar");
    });
    socket.on("reconnect", () => {
      console.log("el socket se acaba de reconectar");
    });


    socket.on("reconnect_attempt", atNum => {
      console.log("el socket esta intentando reconectar " + atNum);
    });

    socket.on("ping", () => {
      console.log("ping recibido del server");
    });



    let roomManager = new RoomManager(socket,
      roomEventCallbacks
    );

    roomManager.init();

    setRoomManager(roomManager);

    // let signalingManager = sIOProv.createClient(endpoint,{
    //   transports: ['websocket']
    // });

    let rtcPeerConnFactory = new RTCPeerConnectionFactory();
    let rtcIceCandidateFactory = new RTCIceCandidateFactory();

    let wrtcManager = new WebRTCManager(jsonQS.peer_id, roomId, rtcPeerConnFactory,
      rtcIceCandidateFactory, socket, {
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        { 'urls': 'stun:stun2.l.google.com:19302' },
        { 'urls': 'stun:stun3.l.google.com:19302' },
        {
          urls: "turn:livelatency.com",
          username: "immersiveclass",
          credential: "1mm3r51v3c1455"
        }
      ]
    }, {});

    wrtcManager.webrtcConnectionTest = new WebRTCConnectionTest();

    wrtcManager.testNAT().then(result => {

      if (result.turn) {
        setNATType("TURN");
        console.debug("stun NAT test failed, this peer will connect through TURN", { result: result });
      } else {
        setNATType("STUN");
        console.debug("stun NAT test succeeded, this peer will connect through STUN", { result: result });
      }

    }).catch(err => {
      console.debug("testNAT error", { error: err })
    });

    setWebRTCManager(wrtcManager);

    return () => {
      console.log("va por leave");
      roomManager.leave(roomId, jsonQS.peer_id);
      window.location.reload();
    }
  }, [roomId]);

  const joinBtnClicked = e => {

    roomManager.join(roomId, peerId, {
      owner: isOwner,
      presenter: isPresenter
    });


  }

  const leaveBtnClicked = e => {
    console.log("leave " + peerJoined);
    roomManager.leave(roomId, peerId);
    setPeerJoined(false);

  }


  const addLocalStream = (streamObj) => {
    webrtcManager.addLocalMedia(streamObj);
  }

  const removeLocalStream = (streamObj) => {
    webrtcManager.removeLocalMedia(streamObj);
  }

  const requestPresentation = () => {
    setPresentationRequested(true);
    roomManager.requestPresentation(peerId, roomId);
  }

  useEffect(() => {
    console.log("se modificó el valor de isPresenter");
  }, [isPresenter]);

  const cancelPresentation = () => {
    roomManager.cancelPresentation(roomId, peerId);
    setPresentationRequested(false);
    setIsPresenter(false);
    removeConnectedSimplePeers();

  }

  const removePresentation = target => {
    roomManager.removePresentation(roomId, peerId, target);
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
    roomManager.grantPresentation(roomId, peerId, reqPeerId);
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

  const tabChanged = (e, newValue) => {
    setSideTab(newValue);
  }

  const sendMessage = (roomId, userId, target, message) => {
    roomManager.sendMessage(roomId, userId, target, message);
  }

  return (

    <div className="room-container">

      {/* <div className="room-header">
          <h1 className="room-name">Room: {roomId} {peerJoined ? "Conectado": "desconectado"}</h1>
          <div className="room-actions-box">
            
            
          
          
          </div>
        </div> */}
      <div className="room-main-box">


        {/* <div className="room-local-streams-box">
            
          </div> */}
        <div elevation={2} className={classes.roomPlayersBox}>
          {/* <Paper className={classes.statusBox}>
              <p className={classes.statusText}><strong>Room: </strong>{roomId} {peerJoined ? "(Conectado)": "(desconectado)"}</p>
              <p className={classes.statusText}><strong>{natType} </strong></p>
            </Paper> */}
          <div className="room-local-media-box">
            <div className={classes.peerItem}>
              <LocalPeerWidget peerId={peerId} isOwner={isOwner}
                presentationRequested={presentationRequested}
                isPresenter={isPresenter}
                joined={peerJoined}
                onLocalStreamAdded={addLocalStream}
                onLocalStreamRemoved={removeLocalStream}
                requestPresentation={requestPresentation}
                cancelPresentation={cancelPresentation}
              />
            </div>
            <div className={classes.localPeerActionBox}>
              <ThemeProvider theme={appBarTheme}>
                <Button disabled={peerJoined} variant="contained" color="primary" className={`${classes.roundedBtn} ${classes.roomActionBtn}`} onClick={joinBtnClicked}>Join</Button>
                <Button disabled={!peerJoined} variant="contained" color="default" className={`${classes.roundedBtn} ${classes.roomActionBtn}`} onClick={leaveBtnClicked}>Leave</Button>
              </ThemeProvider>
            </div>

          </div>
          <div className="room-hosts-media-box">
            {
              Object.keys(roomUsers).filter(e => { return e !== peerId }).map(peerId => {
                if (roomUsers[peerId].presenter) {
                  return (
                    <div key={peerId} className={classes.peerItem}>
                      <RemotePeerWidget
                        presentationRequested={roomUsers[peerId].presentationRequested}
                        presentationGranted={roomUsers[peerId].presentationGranted}
                        onPresentationGranted={grantPresentation}
                        onPresentationRemoved={removePresentation}
                        localOwner={isOwner}
                        streams={remotePeerStreams[peerId]}
                        peerId={peerId} owner={roomUsers[peerId].owner}
                        presenter={roomUsers[peerId].presenter} />
                    </div>


                  )

                }

              })
            }
          </div>
          <div className="room-peers-media-box">
            {
              Object.keys(roomUsers).filter(e => { return e !== peerId }).map(peerId => {
                if (!roomUsers[peerId].presenter) {
                  return (
                    <div key={peerId} className={classes.peerItem}>
                      <RemotePeerWidget presentationRequested={roomUsers[peerId].presentationRequested}
                        presentationGranted={roomUsers[peerId].presentationGranted}
                        streams={remotePeerStreams[peerId]} peerId={peerId}
                        onPresentationGranted={grantPresentation}
                        onPresentationRemoved={removePresentation}
                        localOwner={isOwner}
                        owner={roomUsers[peerId].owner} presenter={roomUsers[peerId].presenter} />
                    </div>


                  )

                }

              })
            }
          </div>

        </div>
        <div className={classes.sideBox}>
          <Tabs value={sideTab} onChange={tabChanged} aria-label="Participantes-Chat">
            <Tab label="Participantes" />
            <Tab label="Chat" />
          </Tabs>
          <TabPanel value={sideTab} index={0}>
            <RoomPeers peers={roomUsers} />
          </TabPanel>
          <TabPanel value={sideTab} index={1}>
            <ChatWidget style={{
              flex: "2"
            }}
              roomId={roomId}
              userId={peerId}
              sendMessage={sendMessage}
              participants={roomUsers} messages={messages} />
          </TabPanel>


        </div>

      </div>


    </div>

  );
};

export default Room;