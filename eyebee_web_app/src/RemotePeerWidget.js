import { Close, PanTool, ScreenShare } from "@material-ui/icons";
import React, { useEffect } from "react";
import MediaPlayerWidget from "./MediaPlayerWidget";
import { IconButton, CssBaseline, SvgIcon } from "@material-ui/core";
import { makeStyles, ThemeProvider, useTheme } from '@material-ui/core/styles';
import { ReactComponent as ScreenShareOnSVG } from './img/screen-share-on2.svg';
import { ReactComponent as HandOnSVG } from './img/hand-on.svg';


const useStyles = makeStyles(theme => ({
    label: {
        color: theme.palette.primary.contrastText
    },
    peerItem: {
        margin: "0.3em"
    },
    roundedBtn: {
        textTransform: "none",
        borderRadius: "4em"
    },
    actionsBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding: "0.5em",
        borderRadius: "0.3em"
    },
    videoElementsBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding: "0.5em",
    },
    mainBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5em",
        borderRadius: "0.3em",
        position: "relative"
    }
}));

const ScreenShareIcon = props => {
    const classes = useStyles();
    return (
        <SvgIcon {...props} component={ScreenShareOnSVG} viewBox="0 0 47.32 36.15" style={{ fontSize: "300%" }} />
    )
}

const HandIcon = props => {
    const classes = useStyles();
    return (
        <SvgIcon {...props} component={HandOnSVG} viewBox="0 0 47.32 36.15" style={{ fontSize: "300%" }} />
    )
}

const RemotePeerWidget = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    // const { messages, sendMessage } = useChat(props.roomId); // Creates a websocket and manages messaging

    const grantPresentation = () => {
        props.onPresentationGranted(props.peerId);
    }

    const removePresentation = () => {
        props.onPresentationRemoved(props.peerId);
    }

    // useEffect(() => {
    //     console.log("RemotePeerWidget - lo que aparece en streams",{streams:props.streams});
    // },[props.streams])
    const widgetClicked = () => {
        if(props.clickable && props.onClick){
            props.onClick();
        }
       
    }

    return (

        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={classes.mainBox} onClick={widgetClicked} >

                {
                    props.presentationRequested ?
                        (
                            // <div style={{
                            //     display: "flex",
                            //     position: "absolute",
                            //     top: props.playerSize * 0.035,
                            //     left: "0",
                            //     width: "100%",
                            //     justifyContent: "center",
                            //     zIndex: "3"
                            // }}>
                            //     <IconButton style={{
                            //         backgroundColor: "transparent"
                            //     }} onClick={grantPresentation}>
                            //         <PanTool style={{
                            //             marginRight: "1em",
                            //             color: theme.palette.primary.main
                            //         }} />
                            //     </IconButton>
                            //     <IconButton style={{
                            //         backgroundColor: "transparent"
                            //     }} onClick={removePresentation}>
                            //         <Close style={{
                            //             color: "#424242"
                            //         }} />
                            //     </IconButton>

                            // </div>

                            <div style={{
                                position: "absolute",
                                left: "17px",
                                zIndex: "3"
                            }}>
                                <IconButton style={{
                                    backgroundColor: "transparent"
                                }} onClick={grantPresentation}>
                                    <HandIcon style={{ ...theme.defaultIcon }} color="primary" />


                                </IconButton>

                            </div>


                        )
                        :
                        (
                            <div />
                        )
                }

                {
                    props.showScreenIcon && props.localStreams && Object.keys(props.localStreams).find(l => { return props.localStreams[l].label === "screen" }) ?
                        (
                            <div style={{
                                position: "absolute",
                                right: "17px",
                                zIndex: "3"
                            }}>
                                <IconButton style={{
                                    backgroundColor: "transparent"
                                }} onClick={props.goToScreen}>
                                    <ScreenShareIcon style={{ ...theme.defaultIcon }} color="primary" />

                                    {/* <ScreenShare style={{
                                        marginRight:"1em",
                                        color: "#4FC16F"
                                }}/> */}


                                </IconButton>

                            </div>

                        )
                        :
                        (
                            <div />
                        )
                }

                    <MediaPlayerWidget
                                nomedia={props.nomedia}
                                isCameraEnable={props.isCameraEnable}
                                avatar={props.avatar}
                                playerSize={props.playerSize || "8em"}
                                background={props.presenter ? "primary" : "secondary"}
                                label={props.label} volume={1}
                                stream={props.streams ? props.streams["camera"] : null}
                                // generateNewStream={props.generateNewStream}
                                />

                {/* {
                    props.nomedia || (props.streams ) ?
                        (
                            <MediaPlayerWidget
                                nomedia={props.nomedia}
                                isCameraEnable={props.isCameraEnable}
                                avatar={props.avatar}
                                playerSize={props.playerSize || "8em"}
                                background={props.presenter ? "primary" : "secondary"}
                                label={props.label} volume={1}
                                stream={props.streams ? props.streams["camera"] : null} />
                        )
                        :
                        (
                            <div />
                        )
                } */}


            </div>
        </ThemeProvider>

    );
};

export default RemotePeerWidget;