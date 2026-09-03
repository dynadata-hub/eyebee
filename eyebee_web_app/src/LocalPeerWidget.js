import React, { useState,useEffect,  useRef } from "react";


import "./hexagon1.css";
import Camera from "./Camera";
import Screen from "./Screen";
import {Paper,Card,Button,IconButton} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import {Mic,MicOff,Videocam,VideocamOff,ScreenShare,StopScreenShare,PanTool,Close} from "@mui/icons-material";

const useStyles = makeStyles(theme => ({

    peerItem: {
        margin:"0.3em"
    },
    roundedBtn:{
        textTransform: "none",
        borderRadius: "4em"
    },
    actionsBox:{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding:"0.5em",
        borderRadius: "0.3em",
        backgroundColor:"#5f5f5f"
    },
    videoElementsBox:{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding:"0.5em",
        height:"15em",
        width:"100%"
    }
  }));

// import useChat from "./useChat";

const LocalPeerWidget = (props) => {

    const classes = useStyles();
    // const { messages, sendMessage } = useChat(props.roomId); // Creates a websocket and manages messaging
    const [camera,setCamera] = useState(null);
    const [screen,setScreen] = useState(null);
    const [micDisabled,setMicDisabled] = useState(false);
    const [presentationRequested,setPresentationRequested] = useState(false);
    const [presentationCancelled,setPresentationCancelled] = useState(false);
    const [presentationGranted,setPresentationGranted] = useState(false);
    const [streamsStatus,setStreamsStatus] =  useState({
        camera:false,
        mic:false,
        screen:false
    });

    const videoEl = useRef(null);
    const screenVideoEl = useRef(null);

    useEffect(() => {
        let cam = new Camera(window.navigator);
        let scr = new Screen(window.navigator);
        setCamera(cam);
        setScreen(scr);

        return () => {
            scr.stop();
            cam.stop();
        }

    },[]);

    useEffect(() => {
        if(camera){
            
            toggleCamera();
        }else{
            setMicDisabled(true);
        }
       

    },[camera]);

    const toggleCamera = async () => {
        if(!camera.getStream()){
            streamsStatus["camera"] = true;
           
           
            setStreamsStatus({
                ...streamsStatus
            });
            await camera.start();

            //setMicDisabled(false);
            videoEl.current.volume = 0;

            videoEl.current.srcObject =  camera.getStream();
            
            props.onLocalStreamAdded(camera.getStream());
        }else{

            if(camera.isVideoEnabled()){
                streamsStatus["camera"] = false;
                camera.disableVideo();
            }else{
                streamsStatus["camera"] = true;
                camera.enableVideo();
            }
            
            //streamsStatus["mic"] = false;
            
        }
       
    }

    const toggleMic = async () => {

        if(camera.isAudioEnabled()){
            streamsStatus["mic"] = false;
            camera.mute();
        }else{
            streamsStatus["mic"] = true;
            camera.unmute();
        }

       

        setStreamsStatus({
            ...streamsStatus
        });

    }


    const toggleScreen = async () => {
        if(!screen.getStream()){
            streamsStatus["screen"] = true;
           
           
            setStreamsStatus({
                ...streamsStatus
            });
            await screen.start();

            //setMicDisabled(false);
            screenVideoEl.current.volume = 0;

            screenVideoEl.current.srcObject =  screen.getStream();
            
            props.onLocalStreamAdded(screen.getStream());
        }else{
           
           
            streamsStatus["screen"] = false;

            props.onLocalStreamRemoved(screen.getStream());

            setStreamsStatus({
                ...streamsStatus
            });

            screen.stop();
            //streamsStatus["mic"] = false;
            
        }
    }

    const requestPresentation = e => {
        console.log("requesting presentation");
        console.log(e);
        // if(presentationRequested){
        //     setPresentationRequested(false);
        //     props.cancelPresentation(props.peerId);
        // }else{
        //     setPresentationRequested(true);
            
        // }

        props.requestPresentation(props.peerId);
    }

    const cancelPresentation = e => {
        props.cancelPresentation(props.peerId);
    }

    return (
        <div className="pw-container">
            <strong className="pw-name">{props.peerId} {props.isOwner ? "(Owner)" :  props.isPresenter ? "(Presenter)" : ""  }</strong>
            {
                !props.isOwner && !props.isPresenter ? 
                (
                    <div className={classes.actionsBox}>
                        <IconButton onClick={requestPresentation} size="large">
                                <PanTool style={{
                                        color: props.presentationRequested ? "#ffc107" : props.presentationGranted ? "#4caf50"  :  "#424242"
                                }}/>
                        </IconButton>
                    </div>
                )
                :
                (
                    <div /> 
                )
            }
            {
                 !props.isOwner && props.isPresenter ? 
                (
                    <div className={classes.actionsBox}>
                        <IconButton onClick={cancelPresentation} size="large">
                            <Close style={{
                                    color: "#424242"
                            }}/>
                        </IconButton>
                    </div>
                    
                )
                :
                (
                    <div /> 
                )
            }

            <div className={classes.videoElementsBox}>
                        {/* <div className="hex">
                            <video className="pw-video-el" ref={videoEl} autoPlay />
                        </div> */}
                

                    <div style={{
                        display:"flex",
                        width:"100%",
                        height:"100%"
                    }}>
                    
                    
                        <div className="hexagon hexagon1">
                            <div className="hexagon-in1">
                                <div className="hexagon-in2">
                                    <div style={{
                                        display:"flex",
                                        flexDirection:"column",
                                        alignItems:"center",
                                        justifyContent:"center",
                                        width:"100%",
                                        height:"100%"
                                    }}>
                                        <video className="pw-video-el" ref={videoEl} autoPlay />
                                        
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        display:"flex",
                        flexDirection:"column",
                        alignItems:"center",
                        justifyContent:"center",
                        width:"100%",
                        height:"100%"
                    }}>
                        <video style={{
                            position: streamsStatus.screen ? "relative" :"absolute",
                            width: streamsStatus.screen ? "auto" :"0",
                            height: streamsStatus.screen ? "15em" :"0",
                        }} className="pw-video-el" ref={screenVideoEl} controls autoPlay />

                    </div>               

            </div>
            <div className={classes.actionsBox}>
                <IconButton onClick={toggleCamera} size="large">
                    {
                        streamsStatus.camera ?
                        (
                            <Videocam />
                        )
                        :
                        (
                            <VideocamOff />
                        )
                    }
                
                </IconButton>
                
                <IconButton onClick={toggleMic} size="large"> 
                    {
                        streamsStatus.mic ?
                        (
                            <Mic />
                        )
                        :
                        (
                            <MicOff />
                        )
                    }
                
                </IconButton>
                <IconButton onClick={toggleScreen} size="large">
                {
                        streamsStatus.screen ?
                        (
                            <ScreenShare />
                        )
                        :
                        (
                            <StopScreenShare />
                        )
                    }
                    
                </IconButton>
                {/* <button onClick={toggleCamera} className="pw-action-button">
                    c
                </button>
                <button onClick={toggleMic} className="pw-action-button">
                    m
                </button>
                <button onClick={toggleScreenSharing} className="pw-action-button">
                    s
                </button> */}
            </div>
        </div>
    );
};

export default LocalPeerWidget;