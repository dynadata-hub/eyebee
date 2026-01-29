import React, { useEffect, useState } from "react";

import { Button, useMediaQuery, SvgIcon, Badge, Tooltip } from "@material-ui/core";
import { Mic, MicOff, Videocam, VideocamOff, Chat, CallEnd, PanTool, PeopleAlt } from "@material-ui/icons";
import { makeStyles, ThemeProvider, useTheme } from '@material-ui/core/styles';
import ShareScreenIcon from "../img/share-screen.png";

import { ReactComponent as SubRoomSVG } from '../img/subroom-icon.svg';
import { ReactComponent as ScreenShareSVG } from '../img/screen-share.svg';
import { ReactComponent as ScreenShareOnSVG } from '../img/screen-share-on.svg';

const useStyles = makeStyles(theme => ({
    mainBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
    },
    roomActionsBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "2",
        flexWrap: "wrap",
        [theme.breakpoints.down('xs')]: {
            flexDirection: "column",
        }
    },

    actionBtn: {
        minWidth: "52px",
        padding: "1em 0",
        textTransform: "none",
        [theme.breakpoints.up('md')]: {
            fontSize: "1em"
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: "0.7em"
        }
    },
    roundedBtn: {
        borderRadius: "0.2em"
    },
    leaveBtn: {
        minWidth: "52px",
        borderRadius: "0.2em",
        padding: "1em 0",
        margin: "0.5em",
        // padding: theme.breakpoints.between('md', 'lg') ? "0.8em 0" : "0.5em 0"  ,
        textTransform: "none",
        backgroundColor: "#D73939",
        [theme.breakpoints.down('sm')]: {
            fontSize: "0.7em"
        },
        [theme.breakpoints.up('md')]: {
            fontSize: "1em",
            // marginLeft:"1em"
        }

    },

    actionBoxLeftGap: {
        flex: "2",
        [theme.breakpoints.down('sm')]: {
            display: "none"
        }
    },
    upperBtnBox: {
        flex: "2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

    },
    lowerBtnBox: {
        [theme.breakpoints.up('sm')]: {
            display: "none"
        },

        [theme.breakpoints.down('xs')]: {
            display: "flex",
            justifyContent: "center"
        }

    }
}));

const ScreenShareIcon = props => {
    const classes = useStyles();
    return (
        <SvgIcon {...props} component={props.color === "primary" ? ScreenShareOnSVG : ScreenShareSVG} viewBox="0 0 32 23" />
    )
}

const SubRoomIcon = props => {
    const classes = useStyles();
    return (
        <SvgIcon {...props} component={SubRoomSVG} viewBox="0 0 34 27" />
    )
}

const RoomActionsWidget = props => {


    const classes = useStyles();
    const theme = useTheme();
    const [camera, setCamera] = useState(null);
    const [screen, setScreen] = useState(null);
    //const [sideBoxOpened,setSideBoxOpened] = useState(false);
    const [sideBoxState, setSideBoxState] = useState({
        opened: false,
        section: ""
    });
    const [streamsStatus, setStreamsStatus] = useState({
        camera: false,
        mic: false,
        screen: false
    });
    const [showHand, setShowHand] = useState(props.owner && !props.presenter);
    const [showMic, setShowMic] = useState(props.presenter);
    const [handRaised, setHandRaised] = useState(false);
    const [showScreen, setShowScreen] = useState(props.presenter);

    const xsScreen = useMediaQuery(theme.breakpoints.down("xs"));
    const smScreen = useMediaQuery(theme.breakpoints.up("sm"));

    useEffect(() => {
        if (props.camera) {
            setCamera(props.camera);
            setStreamsStatus({
                camera: props.camera.isVideoEnabled(),
                mic: props.camera.isAudioEnabled(),
                screen: false
            });

        }

    }, [props.camera]);

    useEffect(() => {
        if (props.screen) {
            let streams = {
                ...streamsStatus
            }
            streams.screen = props.screen.getStream() ? true : false;
            setStreamsStatus(streams);

        }

    }, [props.screen]);

    useEffect(() => {
       
    }, [xsScreen, smScreen]);

    const toggleCamera = async () => {
        if (!camera.getStream()) {
            // streamsStatus["camera"] = true;

            // setStreamsStatus({
            //     ...streamsStatus
            // });
            await camera.start();

            //setMicDisabled(false);
            //videoEl.current.volume = 0;

            //videoEl.current.srcObject =  camera.getStream();

            //props.onLocalStreamAdded(camera.getStream());
        } else {

            if (camera.isVideoEnabled()) {
                //streamsStatus["camera"] = false;
                camera.disableVideo();
            } else {
                //streamsStatus["camera"] = true;
                camera.enableVideo();
            }

        }

        streamsStatus["camera"] = camera.isVideoEnabled();

        setStreamsStatus({
            ...streamsStatus
        });
        props.onCameraStateChanged(camera.isVideoEnabled());

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

        setStreamsStatus({
            ...streamsStatus
        });

        props.onMicStateChanged(camera.isAudioEnabled());

    }

    const onScreenVideoEnded = () => {
        toggleScreen();
    }

    const toggleScreen = async () => {
        await props.toggleScreen();
        let streams = {
            ...streamsStatus
        }

        if (props.screen.getStream()) {
            props.screen.getStream().getVideoTracks()[0].addEventListener("ended", onScreenVideoEnded);
        }

        streams.screen = props.screen.getStream() ? true : false;
        setStreamsStatus(streams);

    }

    const toggleSideBox = (section) => {

        let sbState = {
            opened: !sideBoxState.opened,
            section: section
        }

        setSideBoxState(sbState);
    }

    useEffect(() => {

        if (props.camera) {
            let streams = {
                ...streamsStatus
            }
            streams.mic = props.camera && props.camera.isAudioEnabled();
            streams.camera = props.camera && props.camera.isVideoEnabled();


            setStreamsStatus(streams);
        }


        setShowHand(!props.owner && !props.presenter);
        setShowMic(props.presenter);
        setShowScreen(props.presenter);
    }, [props.presenter, props.owner]);

    useEffect(() => {
        props.toggleSideBox(sideBoxState);
    }, [sideBoxState])

    useEffect(() => {
        setHandRaised(props.presentationRequested);
    }, [props.presentationRequested])


    const togglePresentation = () => {
        if (props.presentationRequested) {
            props.cancelPresentation();
        } else {
            props.requestPresentation();
        }
    }

    return (

        <ThemeProvider theme={theme} >
            <div className={classes.mainBox}>
                <div className={classes.roomActionsBox}>
                    <div className={classes.upperBtnBox}>
                        <div style={{

                            flex: smScreen ? "2" : "1",
                        }}>
                            {
                                showHand ?
                                    (
                                        <Tooltip title="Raise your hand">
                                            <Button color="secondary"
                                                className={classes.actionBtn}
                                                style={{
                                                    ...theme.actionBtn,
                                                    color: handRaised ? "#4FC16F" : "white"
                                                }}

                                                onClick={togglePresentation}>
                                                <PanTool style={theme.defaultIcon} />

                                            </Button>
                                        </Tooltip>
                                    )
                                    :
                                    (
                                        <div />
                                    )
                            }
                        </div>


                        {
                            showScreen ?
                                (
                                    <Tooltip title="Share screen">
                                        <Button color={props.screen && props.screen.isVideoEnabled() ? "primary" : "secondary"}
                                            className={classes.actionBtn}
                                            style={theme.actionBtn}
                                            onClick={toggleScreen}>
                                            {
                                                streamsStatus.screen ?
                                                    (
                                                        <ScreenShareIcon style={{ ...theme.defaultIcon }} color="primary" />
                                                        // <StopScreenShare style={theme.defaultIcon} />
                                                    )
                                                    :
                                                    (
                                                        <ScreenShareIcon style={{ ...theme.defaultIcon }} color="secondary" />
                                                        // <ScreenShare style={theme.defaultIcon} />
                                                    )
                                            }

                                        </Button>
                                    </Tooltip>
                                )
                                :
                                (
                                    <div />
                                )
                        }
                        <Tooltip title={streamsStatus.camera ? "Disable camera" : "Enable camera"}>
                            <Button color={camera && camera.isVideoEnabled() ? "primary" : "secondary"}
                                className={classes.actionBtn}

                                style={{
                                    ...theme.actionBtn,
                                    color: "white",
                                    backgroundColor: streamsStatus.camera ? "#4FC16F" : theme.actionBtn.backgroundColor
                                }}

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
                        </Tooltip>
                        {
                            showMic ?
                                (
                                    <Tooltip title={streamsStatus.mic ? "Disable microphone" : "Enable microphone"}>
                                        <Button color={camera && camera.isAudioEnabled() ? "primary" : "secondary"}
                                            className={classes.actionBtn}
                                            style={{
                                                ...theme.actionBtn,
                                                color: "white",
                                                backgroundColor: streamsStatus.mic ? "#4FC16F" : theme.actionBtn.backgroundColor
                                            }}

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
                                    </Tooltip>
                                )
                                :
                                (
                                    <div />
                                )
                        }

                        {
                            smScreen ?
                                (
                                    <Tooltip title="Exit">
                                        <Button variant="contained" color="primary" className={`${classes.leaveBtn} ${classes.actionBtn}`} onClick={props.onLeave}>
                                            <CallEnd style={theme.defaultIcon} />
                                        </Button>
                                    </Tooltip>
                                )
                                :
                                (
                                    <div />
                                )
                        }

                        {!smScreen &&
                            <Tooltip title="Show users">
                                <Button color="secondary"
                                    className={classes.actionBtn}
                                    style={{
                                        ...theme.actionBtn,
                                        color: "white",
                                        //backgroundColor: sideBoxOpened ?  "#4FC16F" : theme.actionBtn.backgroundColor
                                    }}

                                    onClick={() => toggleSideBox("participants")}>
                                    <PeopleAlt style={theme.defaultIcon} />

                                </Button>
                            </Tooltip>
                        }

                        {!smScreen &&
                            <Tooltip title="Show chat">
                                <Button color="secondary"
                                    className={classes.actionBtn}
                                    style={{
                                        ...theme.actionBtn,
                                        color: "white",
                                        //backgroundColor: sideBoxOpened ?  "#4FC16F" : theme.actionBtn.backgroundColor
                                    }}

                                    onClick={e => toggleSideBox("chat")}>
                                    <Badge invisible={!props.newMessages} color="primary" variant="dot">
                                        <Chat style={theme.defaultIcon} />
                                    </Badge>
                                </Button>
                            </Tooltip>}

                        {!smScreen &&
                            <Tooltip title="Exit">
                                <Button variant="contained" color="primary" className={`${classes.leaveBtn} ${classes.actionBtn}`} onClick={props.onLeave}>
                                    <CallEnd style={theme.defaultIcon} />
                                </Button>
                            </Tooltip>}

                        {smScreen &&
                            <div style={{
                                display: "flex",
                                flex: smScreen ? "2" : "1",
                                justifyContent: "flex-end"
                            }}>
                                <Tooltip title="Show users">
                                    <Button color="secondary"
                                        className={classes.actionBtn}
                                        style={{
                                            ...theme.actionBtn,
                                            color: "white",
                                            //backgroundColor: sideBoxOpened ?  "#4FC16F" : theme.actionBtn.backgroundColor
                                        }}

                                        onClick={e => toggleSideBox("participants")}>
                                        <PeopleAlt style={theme.defaultIcon} />

                                    </Button>
                                </Tooltip>

                                <Tooltip title="Show chat">
                                    <Button color="secondary"
                                        className={classes.actionBtn}
                                        style={{
                                            ...theme.actionBtn,
                                            color: "white",
                                            //backgroundColor: sideBoxOpened ?  "#4FC16F" : theme.actionBtn.backgroundColor
                                        }}

                                        onClick={e => toggleSideBox("chat")}>
                                        <Badge invisible={!props.newMessages} color="primary" variant="dot">
                                            <Chat style={theme.defaultIcon} />
                                        </Badge>
                                    </Button>
                                </Tooltip>

                                {/* {
                                !smScreen ?
                                    (
                                        <Tooltip title="Exit">
                                            <Button variant="contained" color="primary" className={`${classes.leaveBtn} ${classes.actionBtn}`} onClick={props.onLeave}>
                                                <CallEnd style={theme.defaultIcon} />
                                            </Button>
                                        </Tooltip>
                                    )
                                    :
                                    (
                                        <div />
                                    )
                            } */}

                            </div>
                        }

                    </div>

                </div>
            </div >
        </ThemeProvider >

    )

}

export default RoomActionsWidget;