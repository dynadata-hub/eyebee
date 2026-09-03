import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";

import RoomAPI from "./Room/RoomAPI";
import UserAPI from "./UserAPI";
import MobileDeviceDetector from "./MobileDeviceDetector";

//import {} from "@mui/material";

import queryString from "query-string";


import socketIOClient from "socket.io-client";
import SocketIOProvider from "./SocketIOProvider";
import RoomManager from "./Room/RoomManager";
// import WebRTCManager from "./WebRTCManager";

import JoinRoomView from "./JoinRoomView";
import Room from "./Room/Room";
import { createTheme, ThemeProvider, StyledEngineProvider, adaptV4Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import TestStreamWidget from "./TestStreamWidget";
import crypto from 'crypto-js';

const theme = createTheme(adaptV4Theme({
    palette: {
        background: {
            default: "#000",
        },
        primary: {
            main: "#F29F39",
            contrastText: "#ffffff"
        },
        secondary: {
            main: "#fafafa",
            contrastText: "#8E8E8E"
        },
        action: {
            backgroundColor: "#aaaaaa",
            selected: "#2D2D2D"
        },
        lighterBg: {
            main: "#292929"
        }
    },
    actionBtn: {
        backgroundColor: "#212121",
        margin: "0.5em",
    },
    defaultIcon: {
        fontSize: "1.5em"
    },
    typography: {
        fontSize: "0.9em"
    }
}));


const useStyles = makeStyles(theme => ({

    mainBox: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        flexDirection: "column",
        width: "100%",
        color: "#424242",
        flex: "2"
    }
}));

const VideoConference = props => {

    const classes = useStyles();
    const { roomId } = useParams(); // Gets roomId from URL
    const location = useLocation();
    const sections = ["joinRoom", "room"];
    const [currentSection, setCurrentSection] = useState("joinRoom");

    const [userData, setUserData] = useState({});

    const [queryParams, setQueryParams] = useState({});

    const [camera, setCamera] = useState(null);

    const [wsSocket, setWSSocket] = useState(null);

    const [roomManager, setRoomManager] = useState(null);

    const [testDisabled, setTestDisabled] = useState(true);

    const [canvasEl, setCanvasEl] = useState(null);

    const [textOnly, setTextOnly] = useState(true);

    const [showPeerTestStats, setShowPeerTestStats] = useState(false);

    const onUserJoined = useCallback(() => {

        setCurrentSection("room");
    }, [camera]);

    const onError = data => {
        console.log("hubo un error al unirse a la sala", { data: data });
    }

    useEffect(() => {
        let jsonQS ;
        let jsonQS2 = queryString.parse(location.search);
       
        if(jsonQS2.p){
            let p = jsonQS2.p.replace(/ /g, "+");
            const params = crypto.AES.decrypt(p, "human hive eyebee").toString(crypto.enc.Utf8);
            jsonQS = queryString.parse(params);
            console.log(jsonQS);
        //}else if(window.location.origin.indexOf("localhost") !== -1){
        }else {
            jsonQS =jsonQS2;
        }
        
        setQueryParams(jsonQS);
        setTestDisabled(jsonQS && jsonQS.testDisabled === "true");

        userData.roomId = roomId;

        //setPeerId(jsonQS.peer_id);
        userData.smallRoom = jsonQS.largeRoom === "false" || !jsonQS.largeRoom;
        userData.isOwner = jsonQS.owner === "true";
        userData.isPresenter = jsonQS.presenter === "true";
        userData.sfu = jsonQS.sfu === "true";
        userData.name = jsonQS.peer_id;
        userData.testStream = jsonQS.test_stream;
        if(jsonQS.testDisabled === "true"){
            userData.forcedScores = {};
            if(userData.sfu){
                //fake very high score sfu peer
               
                userData.forcedScores.cpu = 0.01;
                userData.forcedScores.upload = 160;
                userData.forcedScores.download = 600;
            }else{
                //custom test values 
                userData.forcedScores.cpu = parseFloat(jsonQS.cpu);
                userData.forcedScores.upload = parseInt(jsonQS.upload);
                userData.forcedScores.download = parseInt(jsonQS.download);
            }
        }
        
        setShowPeerTestStats(jsonQS.show_test_stats === "true");
        
        userData.maxRelay = parseInt(jsonQS.max_relay);

        let mobDetector = new MobileDeviceDetector();

        userData.isMobileDevice = mobDetector.isMobile();

        if(userData.testStream === "test"){
            setTextOnly(true);
        }else{
            setTextOnly(false);
        }

        if (!jsonQS.peer_id) {

            let generatedPeerId = null;

            if (jsonQS.owner === "true") {
                generatedPeerId = "moderador-" + Math.trunc(Math.random() * 1000);
            } else if (jsonQS.presenter === "true") {
                generatedPeerId = "presentador-" + Math.trunc(Math.random() * 1000);
            } else {
                generatedPeerId = "espectador-" + Math.trunc(Math.random() * 1000);
            }

            //jsonQS.peer_id = generatedPeerId;
            //window.location.search = props.location.search + "&peer_id="+generatedPeerId;
            userData.peerId = generatedPeerId;

        } else {
            userData.peerId = jsonQS.peer_id;
        }

        setUserData({
            ...userData
        })


        let sIOProv = new SocketIOProvider(socketIOClient);
        let endpoint = "http://192.168.0.200";
        if (window.location.origin.indexOf("livelatency.com") !== -1 || window.location.origin.indexOf("eyebee.com") !== -1) {
            //endpoint = "http://livelatency.com:5000";
            endpoint = "/";
        }

        let socket = sIOProv.createClient(endpoint, {
            path: "/videocall/socket.io",
            transports: ['websocket'],
            query: {
                room_id: userData.roomId,
                peer_id: userData.peerId,
            }
        });

        socket.on("disconnect", () => {
            console.debug("el socket se acaba de desconectar");
        });
        socket.on("connect", () => {
            console.debug("el socket se acaba de conectar");
        });
        socket.on("reconnect", () => {
            console.debug("el socket se acaba de reconectar");
        });


        socket.on("reconnect_attempt", atNum => {
            console.debug("el socket esta intentando reconectar " + atNum);
        });

        socket.on("ping", () => {
            console.debug("ping recibido del server");
        });

        setWSSocket(socket);

        let roomManager = new RoomManager(socket,
            {}
        );

        roomManager.init();

        setRoomManager(roomManager);


        return () => {
            
        }

    }, []);


    useEffect(() => {
        if (roomManager) {
            roomManager.addRoomEventCallbacks({
                "onJoined": onUserJoined,
                "onError": onError
            });
        }

        return () => {
           
        }

    }, [roomManager]);

    const joinRoom = (userName, cameraStreams, testResults, avatar) => {

        let prom = new Promise((resolve,reject) => {
            let udata = {
                ...userData
            }
            console.debug(avatar);
            udata.userName = userName;
            udata.camera = cameraStreams.camera;
            udata.mic = cameraStreams.mic;
            udata.capabilities = {};
            udata.avatar = avatar;
            if (testResults) {
                Object.keys(testResults).forEach(e => {
                    udata.capabilities[e] = {
                        name: testResults[e].name,
                        value: testResults[e].value
                    }
                });
            }
    
            setUserData(udata);
            console.debug("joinRoom f:" + udata);
            roomManager.join(udata.roomId, udata.peerId, {
                capabilities: udata.capabilities,
                owner: udata.isOwner,
                smallRoom: udata.smallRoom,
                isMobileDevice:udata.isMobileDevice,
                presenter: udata.isPresenter,
                userName: userName,
                camera: udata.camera,
                mic: udata.mic,
                sfu: udata.sfu,
                avatar: avatar,
                maxRelay: udata.maxRelay
            },response => {
                console.log("el callback response de join ",{response});
                if(response.result === "error"){
                    reject(response);
                }else{
                    resolve(response);   
                }

            });
        });
        return prom;
        

    }

    const setupCamera = camera => {
        setCamera(camera);
    }

    const canvasCreated = canvasEl => {
        console.debug("canvasCreated()",{canvasEl:canvasEl});
        setCanvasEl(canvasEl);
    }

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme}>

                <div className={classes.mainBox}>
                    <p style={{
                        color:"white"
                    }}>{textOnly}</p>
                    <TestStreamWidget source={userData.testStream} textOnly={textOnly} text={userData.userName} onCanvasElement={canvasCreated} />

                    {currentSection === "joinRoom" ?
                        (
                            <JoinRoomView showPeerTestStats={showPeerTestStats} testCanvasEl={canvasEl} testDisabled={testDisabled} roomManager={roomManager} userData={userData} joinRoom={joinRoom} onCamera={setupCamera} />

                        )
                        :
                        (<div />)

                    }

                    {currentSection === "room" ?
                        (
                            <Room userData={userData} roomManager={roomManager}
                                wsSocket={wsSocket} localCamera={camera} />
                        )
                        :
                        (<div />)

                    }


                </div>

            </ThemeProvider>)
        </StyledEngineProvider>
    );

}



export default VideoConference;