import { React, useState, useEffect, createRef } from "react";
import Camera from "./Camera";
import TestCamera from "./TestCamera";
import { Input, Button, CssBaseline, InputAdornment, Box, InputLabel, IconButton, TextField, ThemeProvider, useMediaQuery, Select, MenuItem } from "@material-ui/core";
import { makeStyles, createMuiTheme, useTheme } from '@material-ui/core/styles';

import { Adb, Mic, MicOff, Videocam, VideocamOff } from '@material-ui/icons';
import ImageIcon from '@material-ui/icons/Image';
import MediaPlayerWidget from "./MediaPlayerWidget";
import logoEyeBee from "./img/logo_eyebee_fondo_negrov2.jpg";
import PeerTestWidget from "./peerTest/PeerTestWidget";

import axios from 'axios';

const darkFormField = createMuiTheme({
    palette: {
        background: {
            default: "#212121",
            paper: "#212121"
        },
        primary: {
            main: "#fafafa",

        },
        secondary: {
            main: "#fafafa",
            contrastText: "#fafafa"
        },
        text: {
            primary: "#fafafa",
            secondary: "#bdbdbd"
        },
        action: {
            disabled: "#ffe082",
            disabledBackground: "#ffe082"
        }
    }
});

const lightButton = createMuiTheme({
    palette: {
        primary: {
            main: "#F29F39",
            contrastText: "#ffffff"

        },
        secondary: {
            main: "#fafafa",
            contrastText: "#212121"
        },
        text: {
            primary: "#fafafa",
            secondary: "#bdbdbd"
        },
        action: {
            disabled: "black",
            disabledBackground: "#292929"
        }
    }
});

const useStyles = makeStyles(theme => ({
    mainBox: {
        display: "flex",
        flex: "2",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start"
    },
    logoBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        margin: "1em 0"
    },
    mediaBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center"
    },
    mediaSelectionBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        margin: "1em 0"
    },
    [theme.breakpoints.up("md")]: {
        mediaSelectionBox: {
            margin: "2em 0"
        },
        deviceField: {
            maxWidth: "25em"
        },
        userNameField: {
            maxWidth: "25em"
        }
    },
    [theme.breakpoints.down("sm")]: {
        mediaSelectionBox: {
            margin: "1em 0"
        },
        deviceField: {
            maxWidth: "17em"
        },
        userNameField: {
            maxWidth: "17em"
        }
    },
    actionsBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        margin: "1em 0"
    },
    roundedBtn: {
        textTransform: "none",
        borderRadius: "0.5em"
    },
    roomActionBtn: {
        margin: "0 1em",
        minWidth: "7em",
        fontSize: "1.2em"
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
        width: "100%",
        backgroundColor: "#292929",
        color: "#f5f5f5"
    },
    roomPlayersBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#000"
    },
    actionBtn: {
        padding: "1em 0",
        backgroundColor: theme.palette.lightbg
    },
    userNameField: {
        width: "100%"
    },
    deviceField: {
        margin: "1em 0",
        width: "100%"
    },
    messageBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1em",
        textAlign: "justify"
    },
    message: {
        color: theme.palette.primary.main,
        fontWeight: "bold"
    }
    ,
    hide: {
        visibility: "hidden"
    }

}));


const JoinRoomView = (props) => {
    const classes = useStyles();
    const theme = useTheme();

    const [file, setFile] = useState('');
    const fileInput = createRef();
    const [formFile, setFormFile] = useState(null);
    const [nomedia, setnomedia] = useState(false);
    const [cameraEnable, setCameraEnable] = useState(false);
    const [filename, setFilename] = useState('Selleccione un archivo');
    const [uploadedFile, setUploadedFile] = useState({});
    const [roomManager, setRoomManager] = useState(null);
    const [natType, setNATType] = useState();
    const [webRTCTest, setWebRTCTest] = useState(null);
    const [webRTCConfig, setWebRTCConfig] = useState([
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        { 'urls': 'stun:stun2.l.google.com:19302' },
        { 'urls': 'stun:stun3.l.google.com:19302' },
        {
            urls: "turn:livelatency.com",
            username: "immersiveclass",
            credential: "1mm3r51v3c1455"
        }
    ]);


    const xsScreen = useMediaQuery(theme.breakpoints.up("xs"));
    const mdScreen = useMediaQuery(theme.breakpoints.up("md"));
    const lgScreen = useMediaQuery(theme.breakpoints.up("lg"));
    const [playerSize, setPlayerSize] = useState(0);
    const [logoSize, setLogoSize] = useState(0);
    const [userName, setUserName] = useState("");

    const [streamsStatus, setStreamsStatus] = useState({
        camera: false,
        mic: false
    });

    const [cameraConfig, setCameraConfig] = useState({
        audio: {
            echoCancellation: {
                ideal: true
            },
            noiseSuppression: {
                ideal: true
            }
        },
        video: {
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
                max: 20
            }
        }
    });

    const [camera, setCamera] = useState(null);
    const [testCamera, setTestCamera] = useState(null);

    const [userInfo, setUserInfo] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [availableCameras, setAvailableCameras] = useState([
        {
            deviceId: 1,
            label: "No cameras found"
        }
    ]);
    const [availableMics, setAvailableMics] = useState([
        {
            deviceId: 1,
            label: "No microphones found"
        }
    ]);
    const [selectedCamera, setSelectedCamera] = useState("");
    const [selectedMic, setSelectedMic] = useState("");

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
            ideal: 15,
            max: 20
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

    const [peerTestHasFinished, setPeerTestHasFinished] = useState(false);
    const [peerTestResults, setPeerTestResults] = useState(null);
    const [testDisabled, setTestDisabled] = useState(false);
    const [cameraLoaded, setCameraLoaded] = useState(false);
    const [joinDisabled, setJoinDisabled] = useState(true);
    const [peerScore, setPeerScore] = useState(null);
    const [userNameTimeout, setUserNameTimeout] = useState(null);
    const [usNameFieldStatus, setUsNameFieldStatus] = useState(null);
    // const getBasicData = async (roomAPI,userAPI,roomId,userId) => {
    //     let userData = await userAPI.getUserData(userId);
    //     let roomData = await roomAPI.getRoomData(roomId);
    //     setUserInfo(userData);
    //     setRoomInfo(roomData);
    // }

    useEffect(() => {
        let disableJoin = false;
        if ((!props.userData.isOwner && !roomInfo) || (!peerTestHasFinished && !props.testDisabled)) {
            disableJoin = true;
        } else {
            disableJoin = false;
        }

        if (cameraLoaded) {
            disableJoin = false;
        } else {
            disableJoin = true;
        }

        if(!roomInfo&&!props.userData.isOwner){
            disableJoin = true;
        }

        if(!peerScore){
            disableJoin = true;
        }else if(peerScore.sfu){
            if(!roomInfo&&!props.userData.isOwner){
                disableJoin = true;
            }
          
        }else if(roomInfo&&roomInfo.numOfSFUs < 2){
            disableJoin = true;
        }

        console.log("JoinRoomView -- Effect ",{data:props.userData});

        if(props.userData.smallRoom && props.userData.isPresenter){
            disableJoin = false;
        }


        setJoinDisabled(disableJoin);

    }, [props.userData.isOwner, roomInfo, peerTestHasFinished, props.testDisabled, cameraLoaded,peerScore]);

    const getPlayerSize = (userType) => {
        let size = 150;
        let logoSize = 8;

        if (mdScreen) {
            size = 150;
            logoSize = 10;

        }

        if (lgScreen) {
            size = 150;
            logoSize = 12;
        }

        // if(userType == "presenter"){
        //   size = Math.ceil(size*0.5);
        // }

        // if(userType == "spectator"){
        //   size = Math.ceil(size*0.25);
        // }

        return {
            playerSize: size,
            logoSize: logoSize
        };

    }

    const showError = err => {
        console.trace();
        console.error("JoinRoomView - Error", { error: err });
    }

    const timeout = (millis) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, millis || 0);
        });

    }

    const setupCamera = async () => {
        let camera ;
        if(props.userData.testStream){
            camera = new TestCamera(props.testCanvasEl);
        }else{
         
            camera = new Camera(navigator)

        }

            let hasPermission = await camera.hasPermission();
           
            if (hasPermission) {
    
                let devList = await camera.listDevices();
                console.log("devices listed", { list: devList });
                let camList = devList.filter(e => {
                    return e.kind === "videoinput";
                });
    
                let micList = devList.filter(e => {
                    return e.kind === "audioinput";
                });
    
                if (camList.length > 0) {
    
                    camList.forEach(e => {
                        console.log("camera detected", { dev: e, label: e.label, id: e.deviceId });
                    });
    
                    setSelectedCamera(camList[0].deviceId);
                    setAvailableCameras(camList);
    
                    if (props.userData.isPresenter) {
                        cameraConfig.video = defaultVideoConstraints;
                    } else {
                        cameraConfig.video = lowVideoConstraints;
                    }
    
                    cameraConfig.video.deviceId = camList[0].deviceId;
    
                } else {
                    console.warn("setupCamera -- No camera Detected! disabling camera ", { camList: camList });
                    cameraConfig.video = false;
    
                }
    
                if (micList.length > 0) {
    
                    micList.forEach(e => {
                        console.log("mic detected", { mic: e, label: e.label, id: e.deviceId });
                    });
    
                    setSelectedMic(micList[0].deviceId);
                    setAvailableMics(micList);
    
                    cameraConfig.audio.deviceId = micList[0].deviceId;
                } else {
                    console.warn("setupCamera -- No Mic Detected! Disabling audio ", { micList: micList });
                    cameraConfig.audio = false;
                }
    
                setCameraConfig({
                    ...cameraConfig
                });
    
                if (cameraConfig.audio || cameraConfig.video) {
                    await camera.start({
                        ...cameraConfig
                    });
    
                    if ((!props.userData.isOwner && !props.userData.isPresenter) || window.location.origin.indexOf("localhost") !== -1) {
                        camera.mute();
                    }
    
                    streamsStatus["camera"] = camera.isVideoEnabled();
                    streamsStatus["mic"] = camera.isAudioEnabled();
    
                    setCameraEnable(camera.isVideoEnabled());
                    setStreamsStatus({
                        ...streamsStatus
                    });
    
                    setCamera(camera);
        
                    props.onCamera(camera);
                } else {
                    console.warn("setupCamera -- No Devices Detected! camera won't be initialized", { micList: micList, camList: camList });
    
                }
    
                setCameraLoaded(true);
            }else{
                //does not have permission to list devices, 
                console.log("por aca ########3");
                setSelectedCamera(0);
                setAvailableCameras([{
                    deviceId:0,
                    label:"<no camera>"
                }]);
                
                setSelectedMic(0);
                setAvailableMics([{
                    deviceId:0,
                    label:"<no microphone>"
                }]);
               

                setCameraEnable(false);
                setStreamsStatus({
                    camera:false,
                    mic:false
                });

                setCameraConfig({
                    audio:false,
                    video:false
                });

                setCameraLoaded(true);

            }

        return camera;
    }

    useEffect(() => {

        if(props.testCanvasEl){
            setupCamera().then(() => {
                setUserName(props.userData.name);
                console.log("JoinRoomView - camera setup finished");
    
            }).catch(err => {
                console.log(err);
                showError(err);
            });
        }

    }, [props.testCanvasEl]);


    useEffect(() => {

        if (props.roomManager) {
            props.roomManager.addRoomEventCallbacks({
                "onRoomInfo": data => {
                    console.log("joinRoomView -- onRoomInfo ",{data:data});
                    setRoomInfo(data);
                    if(data && data.participants === data.maxPeers){

                        setUsNameFieldStatus({
                            type:"error",
                            message:"MAX_SESSION_PEERS_REACHED",
                            longMessage: "This room reached its maximum number of participants."
                        });
                    }
                },
                "onPeerScore": data => {
                    console.log("joinRoomView -- onPeerscore ",{data:data});
                    setPeerScore(data);
                }
            });

            props.roomManager.getRoomInfo(props.userData.roomId);

        }

    }, [props.roomManager]);

    useEffect(() => {

        if (props.roomManager && peerTestResults) {
            
            let obj = {
                capabilities: peerTestResults,
                isMobileDevice: props.userData.isMobileDevice
            }
            props.roomManager.requestPeerScore(obj);

        }

    }, [props.roomManager,peerTestResults]);

    useEffect(() => {
        let a = getPlayerSize("owner");
        setPlayerSize(a.playerSize);
        setLogoSize(a.logoSize);

    }, [xsScreen, mdScreen, lgScreen]);

    const toggleCamera = async () => {
        if (!camera.getStream()) {

            await camera.start();

        } else {

            if (camera.isVideoEnabled()) {
                setCameraEnable(false);
                camera.disableVideo();

            } else {
                setCameraEnable(true);
                camera.enableVideo();
            }

        }

        streamsStatus["camera"] = camera.isVideoEnabled();

        props.onCamera(camera);

        setStreamsStatus({
            ...streamsStatus
        });

    }

    const toggleMic = async () => {

        if (camera.isAudioEnabled()) {
            streamsStatus["mic"] = false;
            camera.mute();
        } else {
            streamsStatus["mic"] = true;
            camera.unmute();
        }

        streamsStatus["mic"] = camera.isAudioEnabled();


        props.onCamera(camera);

        setStreamsStatus({
            ...streamsStatus
        });

    }

    const joinBtnClicked = async e => {

        if(!userName){
            setUsNameFieldStatus({
                type:"error",
                message:"USERNAME_FIELD_EMPTY",
                longMessage:"Please, specify a user name."

            });
            return false;
        }

        if (file == ''){
            try{
                await props.joinRoom(userName, streamsStatus, peerTestResults, '');
                return true;
            }catch(err){

                let status = {
                    type:"error",
                    message:err.error,
                };

                switch(err.error){
                    case "MAX_SESSION_PEERS_REACHED": 
                        status.longMessage = "This room reached its maximum number of participants.";
                        setJoinDisabled(true);
                    break;
                }
                setUsNameFieldStatus(status);
            }
            
        }else{
            await uploadAvatar();
        }
        
       
           
        
    }

    const usernameChanged = async e => {
        clearTimeout(userNameTimeout);
        if(usNameFieldStatus && usNameFieldStatus.message === "MAX_SESSION_PEERS_REACHED"){
           return false;
        }
       
        if (e.target.value.length <= 14){
            setUserName(e.target.value);
            let unTO = setTimeout(async () => {
                let result ;
                try{
                    result = await props.roomManager.checkUsernameAvailability(e.target.value);
                    setUsNameFieldStatus(result);
                }catch(err){
                    setUsNameFieldStatus(result);
                }  

            },300); 

            setUserNameTimeout(unTO);
            
        }
            
    }

    const selectedCameraChanged = async e => {

        setSelectedCamera(e.target.value);
        console.log("selectedCameraChanged -- cambiÃ³ la cÃ¡mara fuente", { deviceId: e.target.value });
        cameraConfig.video.deviceId = e.target.value;

        await camera.start({
            ...cameraConfig
        });

        if ((!props.userData.isOwner && !props.userData.isPresenter) || window.location.origin.indexOf("localhost") !== -1) {
            camera.mute();
        }

        setCameraConfig({
            ...cameraConfig
        });

    }

    const selectedMicChanged = async e => {

        setSelectedMic(e.target.value);
        console.log("selectedMicChanged -- cambiÃ³ el mic fuente", { deviceId: e.target.value });
        cameraConfig.audio.deviceId = e.target.value;

        await camera.start({
            ...cameraConfig
        });

        if ((!props.userData.isOwner && !props.userData.isPresenter) || window.location.origin.indexOf("localhost") !== -1) {
            camera.mute();
        }

        setCameraConfig({
            ...cameraConfig
        });

    }

    const peerTestFinished = results => {
        console.debug("peerTestFinished -- results", { r: results });
        setPeerTestResults(results);
        let userData = {
            isMobileDevice: props.userData.isMobileDevice,
            capabilities:results
        }

        //props.roomManager.requestPeerScore(userData);
        setPeerTestHasFinished(true);
    }

    const onChange = e => {
        if (e.target.files.length == 0) return;
        setFile(URL.createObjectURL(e.target.files[0])); //Es un array y debe seleccionar el primero de los archivos
        setFilename(e.target.files[0].name);
        setFormFile(e.target.files[0])
        console.log(e.target.files[0]);
        toggleCamera();
        //uploadAvatar();
    };

    const clickInUploadInput = () => {
        fileInput.current.click();
    }

    //Gestionamos la subida como un envÃ­o de formulario
    const uploadAvatar = async e => {
        //e.preventDefault();
        console.log("Entrando a subir imagÃ©n")

        const formData = new FormData();
        formData.append('file', formFile);

        try {
            const res = await axios.post('/videocall/api/upload-avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            });
            console.log(res.data.filePath);

            console.log('Archivo subido satisfactoriamente ' + res.data.filePath);


            try{
                await props.joinRoom(userName, streamsStatus, peerTestResults, res.data.filePath);
                return true;
            }catch(err){

                let status = {
                    type:"error",
                    message:err.error,
                };

                switch(err.error){
                    case "MAX_SESSION_PEERS_REACHED": 
                        status.longMessage = "This room reached its maximum number of participants.";
                        setJoinDisabled(true);
                    break;
                }
                setUsNameFieldStatus(status);
            }

            
        } catch (err) {
            if (err.response.status === 500) {
                console.log('Ha ocurrido un problema con el servidor');
            } else {
                console.log(err.response.data.msg);
            }
        }
    };

    const testStreamAvailable = str => {
        console.log("llama a testStreamAvailable! ",{str:str});
    }

    return (

        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={classes.mainBox}>

                <div className={classes.logoBox}>
                    <img style={{
                        height: logoSize + "em",
                        width: "auto"
                    }} src={logoEyeBee} />
                </div>
                <div style={{
                    margin: "1em 0 1em 0"
                }}>
                    <PeerTestWidget showStats={props.showPeerTestStats} disabled={props.testDisabled} forcedScores={props.userData.forcedScores} onTestFinished={peerTestFinished} />
                </div>

                <div className={classes.mediaBox}>
                    <MediaPlayerWidget
                        isCameraEnable={cameraEnable}
                        nomedia={nomedia}
                        avatar={file}
                        playerSize={playerSize}
                        background={props.userData && props.userData.isPresenter ? "primary" : "secondary"} volume={0} stream={camera && camera.getStream()} />
                </div>



                <div className={classes.actionsBox}>
                    <Button color={camera && camera.isVideoEnabled() ? "primary" : "secondary"}
                        style={theme.actionBtn}
                        onClick={toggleCamera}>
                        {
                            streamsStatus.camera ?
                                (
                                    <Videocam style={theme.defaultIcon} />
                                )
                                :
                                (
                                    <VideocamOff style={theme.defaultIcon} />
                                )
                        }

                    </Button>
                    {
                        props.userData.isOwner || props.userData.isPresenter ?
                            (
                                <Button color={camera && camera.isAudioEnabled() ? "primary" : "secondary"}
                                    style={theme.actionBtn}
                                    onClick={toggleMic}>
                                    {
                                        streamsStatus.mic ?
                                            (
                                                <Mic style={theme.defaultIcon} />
                                            )
                                            :
                                            (
                                                <MicOff style={theme.defaultIcon} />
                                            )
                                    }

                                </Button>
                            )
                            :
                            (
                                <div />
                            )
                    }
                    <Button color={"primary"}
                        style={theme.actionBtn}
                        onClick={clickInUploadInput}>
                        <ImageIcon style={theme.defaultIcon} />
                    </Button>


                </div>


                <ThemeProvider theme={darkFormField} >
                    
                    <form autoComplete="on" >
                        <div className={classes.mediaSelectionBox}>
                            
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                className={classes.userNameField}
                                inputProps={{ style: { textAlign: 'center' } }}
                                value={userName}
                                variant="filled"
                                error={usNameFieldStatus ? usNameFieldStatus.type ==="error" : false}
                                helperText={usNameFieldStatus ? usNameFieldStatus.longMessage : ""}
                                autoComplete="username" label="User name" placeholder="ej: Francisco"
                                onChange={usernameChanged} />

                            <Box style={{
                                display: 'flex', flexDirection: "row", justifyContent: "center", alignItems: 'center'
                            }} >
                                <Videocam color='secondary' />
                                <Select
                                    inputProps={{ style: { textAlign: 'center' } }}
                                    value={selectedCamera}
                                    className={classes.deviceField}
                                    variant="filled"
                                    label="CÃ¡mara"
                                    onChange={selectedCameraChanged}

                                >

                                    {
                                        availableCameras.map((dev, index) => (

                                            <MenuItem key={index} value={dev.deviceId}>
                                                {dev.label}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </Box>

                            <Box style={{
                                display: 'flex', flexDirection: "row", alignItems: 'center'
                            }} >
                                <Mic color='secondary' />
                                <Select
                                    inputProps={{ style: { textAlign: 'center' } }}
                                    value={selectedMic}
                                    className={classes.deviceField}
                                    variant="filled"
                                    label="MicrÃ³fono"
                                    onChange={selectedMicChanged}

                                >

                                    {
                                        availableMics.map((dev, index) => (

                                            <MenuItem key={index} value={dev.deviceId}>
                                                {dev.label}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </Box>



                            <input ref={fileInput} accept="image/*" type="file" onChange={onChange} className={classes.hide} />
                        </div>
                    </form>

                </ThemeProvider>



                <ThemeProvider theme={lightButton} >
                    <Button id="joinBtn" disabled={joinDisabled || (usNameFieldStatus && usNameFieldStatus.type === "error")} variant="contained"
                        color="primary" className={`${classes.roundedBtn} ${classes.roomActionBtn}`}
                        onClick={joinBtnClicked}>Join</Button>
                </ThemeProvider>



                {
                    !props.userData.isOwner ?
                        (
                            <div className={classes.messageBox}>
                                {
                                    usNameFieldStatus && usNameFieldStatus.message === "MAX_SESSION_PEERS_REACHED" ?
                                    (
                                        <p className={classes.message}>Max session participants reached.</p>
                                    )
                                    :
                                    (
                                        <p className={classes.message}>
                                            {
                                                joinDisabled ?
                                                    "Wait a moment for the session to start"
                                                    :
                                                    "The session has started, you can enter"
                                            }
                                        </p>
                                    )
                                }
                                

                            </div>
                        )
                        :
                        (
                            <div />
                        )
                }




            </div>
        </ThemeProvider>

    );
};

export default JoinRoomView;