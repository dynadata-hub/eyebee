import React, { useEffect, useState, useRef } from "react";

import "./hexagon1.css";
import "./bgHex.css";
import { ThemeProvider, StyledEngineProvider, useTheme, createTheme, adaptV4Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import { CssBaseline } from "@mui/material";
import testImg from "./img/default-avatar.png";

const secondaryTheme = createTheme(adaptV4Theme({
    palette: {
        background: {
            default: "#000",
        },
        primary: {
            main: "#212121"
        }
    }
}));

const useStyles = makeStyles(theme => ({
    mainBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5em",
        borderRadius: "0.3em",
        height: "100%"
    },
    userNameBox: {
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5em 0.5em",
        fontSize: "0.8em",
        backgroundColor: theme.palette.primary.main,
        zIndex: "3",
        bottom: "0",
        width: "100%"
    },
    bgBox: {
        position: "absolute",
        width: "88%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bottom: "0",
        zIndex: "0",
        top: "0",

    }
}));

const MediaPlayerWidget = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const [mediaStream, setMediaStream] = useState(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [vidHeight, setVidHeight] = useState(150);
    const [vidWidth, setVidWidth] = useState(150);
    const videoEl = useRef();
    const [showLabel, setShowLabel] = useState(true);
    // const { messages, sendMessage } = useChat(props.roomId); // Creates a websocket and manages messaging

    useEffect(() => {
        if (mediaStream) {
            
            videoEl.current.muted = props.volume === 0;
            videoEl.current.srcObject = mediaStream;
            videoEl.current.volume = props.volume && props.volume !== 0 ? props.volume : 0;

        }
    }, [mediaStream]);

    useEffect(() => {
        if (videoEl && videoEl.current) {
            videoEl.current.onloadedmetadata = () => {
                if(videoEl.current){

                    setVidHeight(videoEl.current.videoHeight);
                    setVidWidth(videoEl.current.videoWidth);
                    setShowPlayer(true);
                }
                
            }

        }
    }, [videoEl]);

    useEffect(() => {

        if (props.stream) {
            // console.debug("ingresando al useEffect de mediaplayerwidget",{stream:props.stream,st:props.stream.getTracks()});
            // let mStream = new MediaStream();
            // props.stream.getTracks().forEach(track => {
            //     console.log("un track");
            //     console.log(track);
            //     mStream.addTrack(track,props.stream);
            // });
            // console.log(mStream);
            setMediaStream(props.stream);


            // videoEl.current.play().then(() => {
            //     console.log("playing!");
            // }).catch(err => {
            //     console.error(err);
            // });

        }
    }, [props.stream]);

    useEffect(() => {
        if (props.playerSize < 70) {
           
            setShowLabel(false);
        } else {
            
            setShowLabel(true);
        }
    }, [props.playerSize]);

    useEffect(() => {

        if (props.nomedia) {
           
            // setVidHeight(videoEl.current.videoHeight);
            // setVidWidth(videoEl.current.videoWidth);
            setShowPlayer(true);
        }
    }, [props.nomedia]);

    // const generateNewStream = () => {
    //     if(videoEl && videoEl.current){
    //         return 
    //     }else{
    //         console.warn("generateNewStream -- could not generate new stream...is video defined?",{videoEl:videoEl});
    //     }
    // }

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={props.background === "primary" ? theme : secondaryTheme} >
                <CssBaseline />
                <div className={classes.mainBox} style={{
                    position: "relative",


                }}>

                    <div className={classes.bgBox} >
                        <div className="hex" style={{
                            color: props.background === "primary" ? theme.palette.primary.main : secondaryTheme.palette.primary.main
                        }} >

                        </div>



                        <svg style={{
                            visibility: "hidden",
                            position: "absolute"
                        }} width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
                            <defs>
                                <filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                                </filter>
                            </defs>
                        </svg>
                    </div>

                    <div className="hexagon hexagon1" style={{
                        zIndex: "0",
                        position: "relative",
                        visibility: showPlayer ? "visible" : "hidden",
                        width: props.playerSize ? (props.playerSize * 1.3) + "px" : "100px",
                    }}>

                        <div className="hexagon-in1" style={{
                            zIndex: "-1",
                            visibility: showPlayer ? "visible" : "hidden",
                            position: "relative"
                        }}>
                            <div className="hexagon-in2">
                                <div style={{
                                    display: "flex",
                                    position: "relative",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    visibility: showPlayer ? "visible" : "hidden",
                                    height: props.playerSize ? props.playerSize + "px" : "100px",
                                    width: props.playerSize ? (props.playerSize * 1.3) + "px" : "100px",
                                    overflow: "hidden"

                                }}>

                                    <img style={{
                                        height: props.playerSize ? props.playerSize + "px" : "150px",
                                        width: "auto",
                                        zIndex: "-1",
                                        position: "absolute",
                                        backgroundColor: "black",
                                        visibility: props.isCameraEnable ? "hidden" : "visible"
                                    }}
                                        src={props.avatar != '' ? props.avatar : testImg}
                                    />
                                    <video
                                    playsInline
                                   
                                        style={{
                                            visibility: props.isCameraEnable ? "visible" : "hidden",
                                            width: "auto",
                                            height: props.playerSize ? props.playerSize + "px" : "150px",
                                            zIndex: "-1",
                                            position: "absolute",
                                            backgroundColor: "black",
                                            transform: "rotateY(180deg) scale(" + (vidHeight > vidWidth ? "1.5)" : "1)")
                                        }} ref={videoEl} autoPlay />

                                    {
                                        props.label && showLabel ?
                                            (
                                                <div id="label" className={classes.userNameBox} >
                                                    <p style={{
                                                        margin: "0",
                                                        maxWidth: "55%",
                                                        textAlign: "center"
                                                    }}>{props.label}</p>

                                                </div>
                                            )
                                            :
                                            (
                                                <div />
                                            )
                                    }

                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </ThemeProvider>)
        </StyledEngineProvider>
    );
};

export default MediaPlayerWidget;