import React, { useEffect, useState, useRef } from "react";

import { ThemeProvider, StyledEngineProvider, useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import { CssBaseline, IconButton } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import MediaPlayerWidget from "./MediaPlayerWidget";
import RemotePeerWidget from "./RemotePeerWidget";


const useStyles = makeStyles(theme => ({
    mainBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5em",
        flex: "3",
        borderRadius: "0.3em",
        height: "100%"
    },
    userList: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.9em",
        width: "100%",
        overflowX: "auto",
    }
}));

const ScreenView = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const [screenStream, setScreenStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const videoEl = useRef();
    const [presenterStreams, setPresenterStreams] = useState(null);

    const onScreenVideoEnded = (stream) => {
        console.log("ScreenView onScreenVideoEnded!!!");
        props.onLeaveScreenView(stream,true);
    }

    useEffect(() => {

        let presenterScreenStream = getPeerStreamsByLabel(props.roomUsers,props.remotePeerStreams,props.presenterData.id)["screen"];
        let streamId = null;
        if (presenterScreenStream && (!videoEl.current.srcObject || videoEl.current.srcObject !== presenterScreenStream)) {
            streamId = presenterScreenStream.id;
            console.debug("ScreenView -- useEffect: loading presenter's screen stream",
            {presenter:props.presenterData,ru:props.roomUsers,rps:props.remotePeerStreams});
            videoEl.current.srcObject = presenterScreenStream;
            //videoEl.current.volume = props.volume && props.volume !== 0 ? props.volume : 0;
            presenterScreenStream.onremovetrack = () => {
                console.log("entra por onremovetrack en ScreenView!",{prScrStr: presenterScreenStream});
                //onScreenVideoEnded(presenterScreenStream);
            }
            setTimeout(() => {
                setShowPlayer(true);
            }, 100);
        }

        // if (props.roomUsers && Object.keys(props.roomUsers).length > 0) {
        //     console.log("From ScreenView 1" + props.roomUsers);
        //     console.log("From ScreenView 2" + Object.keys(props.roomUsers));
        //     console.log("From ScreenView 3" + Object.keys(props.roomUsers).length);
        // }
        // console.log("From ScreenView" + props.roomUsers);


    }, [props.presenterData,props.remotePeerStreams]);

    // const filterStreamByType = (streams,streamsReference,type) => {
    //     console.log("ScreenView -- filterStreamByType ",
    //     {streamsReference:streamsReference,stream:streams,type:type});
    //     let filtered = Object.keys(streamsReference).filter(strId => {
    //         console.log("screenview -- comparando ",{strRefId:strId,stream:streams[strId],strRefLabel:streamsReference[strId].label,type:type});
    //         if(streamsReference[strId].label === type){
    //             return true;
    //         }
    //     });
    //     console.log("ScreenView -- resultado filtrado",{filtered:filtered});
    //     return streams[
    //         filtered[0]
    //     ];
    // }

    // const getPeerStreamsByLabel = (roomUsers,remotePeerStreams,peerId) => {
    //     console.log("RoomGrid -- getPeerStreamsByLabel -- comenzando",{roomUsers:roomUsers,
    //         rps:remotePeerStreams,peerId:peerId});

    //     let streams = {};

    //     if(roomUsers && roomUsers[peerId] && remotePeerStreams[peerId]){
    //       let peerLocalStreamRefs = roomUsers[peerId].localStreams || {};
          
    //       console.log("RoomGrid -- getPeerStreamsByLabel -- peer's current local streams",{peerId:peerId,peerLocalStreams:peerLocalStreamRefs});
            
    //         Object.keys(peerLocalStreamRefs).filter(ls => {
    //             streams[peerLocalStreamRefs[ls].label] = remotePeerStreams[peerId][ls];
    //         });
         
    //     }else{
    //         console.warn("RoomGrid -- getPeerStreamsByLabel: could not find reference of this peer in roomUsers or remotePeerStreams",
    //           {roomUsers:roomUsers,
    //             rps:remotePeerStreams,peerId:peerId})
    //     }
    
    //     return streams;

    // }


    const getPeerStreamsByLabel = (roomUsers,remotePeerStreams,peerId) => {
        console.log("ScreenView -- getPeerStreamsByLabel -- comenzando",{roomUsers:roomUsers,
            rps:remotePeerStreams,peerId:peerId});

        let streams = {};

        if(roomUsers && roomUsers[peerId] && remotePeerStreams[peerId]){
          let peerLocalStreamRefs = roomUsers[peerId].localStreams || {};
          
          console.log("ScreenView -- getPeerStreamsByLabel -- peer's current local streams",{peerId:peerId,peerLocalStreams:peerLocalStreamRefs});
            
            Object.keys(peerLocalStreamRefs).forEach(ls => {
                let localStreamObj = remotePeerStreams[peerId][ls];

                if(localStreamObj){
                    streams[peerLocalStreamRefs[ls].label] =  localStreamObj;
                }else{
                     //search within other peer's cloned streams references
                    let userIds = Object.keys(roomUsers);
                    for(let i=0; i < userIds.length;i++){
                        let usrId = userIds[i];
                        if(roomUsers[usrId].clonedStreams && roomUsers[usrId].clonedStreams[peerId]){
                            console.log("ScreenView -- getPeerStreamsByLabel -- searching for this stream in cloned streams ",
                            {peerId:peerId,usrId:usrId,ls:ls, ru:roomUsers[usrId],clStr:roomUsers[usrId].clonedStreams})

                            let peerClonedStreamsRef = roomUsers[usrId].clonedStreams[peerId];

                            if(peerClonedStreamsRef && peerClonedStreamsRef[ls]){
                                let clonedStreamIds = roomUsers[usrId].clonedStreams[peerId][ls].clonedStreamIds;
                                console.log("ScreenView -- getPeerStreamsByLabel -- result of searching clonedStreamIds ",
                                {peerId:peerId,usrId:usrId,ls:ls, ru:roomUsers[usrId],clonedStreamIds:clonedStreamIds})

                                if(clonedStreamIds){
                                
                                    streams[peerLocalStreamRefs[ls].label] = remotePeerStreams[peerId][clonedStreamIds[0]];
                                    break;
                                }
                            }else{

                                console.log("ScreenView -- getPeerStreamsByLabel -- could not find this streamId in this peer's cloned streams references. The target peerId has no clonedStreamIds defined with the current peer or the streamId does not have a reference inside it",
                                {peerId:peerId,usrId:usrId,ls:ls, ru:roomUsers[usrId],clonedStream:roomUsers[usrId].clonedStreams})

                                break;
                            }

                            
                        }
                        
                    }

                    if(!streams[peerLocalStreamRefs[ls].label]){
                        console.warn("ScreenView -- getPeerStreamsByLabel: could not find reference of this peer as cloned streams in roomUsers or remotePeerStreams",
                        {roomUsers:roomUsers,
                            rps:remotePeerStreams,peerId:peerId})
                    }

                    
                }

               


            });
         
        }else{
            
            console.warn("ScreenView -- getPeerStreamsByLabel: could not find reference of this peer in roomUsers or remotePeerStreams",
              {roomUsers:roomUsers,
                rps:remotePeerStreams,peerId:peerId})
        }
    
        return streams;

    }

    const leaveScreenView = cond => {
        console.log("leaveScreenView -- starting",{pd: props.presenterData});
        let localStreamIds = Object.keys(props.presenterData.localStreams || {});
        
        let localStreamId = localStreamIds.find( ls => {
            return props.presenterData.localStreams[ls].label === "screen";
        });

        console.log("leaveScreenView -- screenId encontrado ",{localStreamIds,localStreamId,pd: props.presenterData});
        let screenStream = props.presenterStreams[localStreamId];
        props.onLeaveScreenView(screenStream);
    }

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme} >
                <CssBaseline />
                <div className={classes.mainBox} >
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%"
                    }}>
                        <div style={{
                            display: "flex"
                        }}>
                            <IconButton
                                variant="contained"
                                color="primary"
                                onClick={e => leaveScreenView(false)}
                                size="large">
                                <ArrowBackIos style={theme.defaultIcon} />
                            </IconButton>
                        </div>
                        <div style={{
                            display: "flex",
                            flex: "2",
                            justifyContent: "center"
                        }}>
                            <MediaPlayerWidget
                                isCameraEnable={true}
                                background="primary"
                                volume={0} label={props.userData.userName}
                                playerSize={props.presenterPlayerSize}
                                stream={props.localCamera ? props.localCamera.getStream() : null}
                            />
                        </div>

                    </div>

                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%"
                    }}>
                        
                        <div className={classes.userList}>
                            {

                                Object.keys(props.roomUsers)
                                    .sort((a, b) => { return props.roomUsers[a].presenter && !props.roomUsers[b].presenter ? -1 : 1 })
                                    .map((peerId, index) => {
                                        // console.log("los datos calculados", {
                                        //     label: props.roomUsers[peerId].userName || peerId
                                        // });

                                        //getPeerStreamsByLabel(props.roomUsers,props.remotePeerStreams,peerId)["screen"]
                                        if (props.roomUsers[peerId].localStreams && Object.keys(props.roomUsers[peerId].localStreams).find( ls => { return props.roomUsers[peerId].localStreams[ls].label === "screen"  }))
                                            return (
                                                <RemotePeerWidget
                                                    key={peerId}
                                                    background={"primary"}
                                                    isCameraEnable={false}
                                                    avatar={props.roomUsers[peerId].avatar}
                                                    playerSize={70}
                                                    label={props.roomUsers[peerId].userName || peerId}
                                                    localOwner={false}
                                                    nomedia={true}
                                                    streams={null}
                                                    clickable={true}
                                                    onClick={e => props.goToScreen(props.roomUsers[peerId])}
                                                    localStreams={props.roomUsers[peerId].localStreams}
                                                    peerId={peerId} owner={props.roomUsers[peerId].owner}
                                                    presenter={props.roomUsers[peerId].presenter}
                                                    goToScreen={e => props.goToScreen(props.roomUsers[peerId])}
                                                />)
                                    })
                            }
                        </div>
                    </div>
                    <div style={{
                        display: "flex",
                        flex: "auto",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center"
                    }} >
                        <video
                            style={{
                                width: "45%",
                                height: "auto",
                                backgroundColor: "black"
                            }} ref={videoEl} controls autoPlay />
                    </div>

                </div>
            </ThemeProvider>)
        </StyledEngineProvider>
    );
};

export default ScreenView;