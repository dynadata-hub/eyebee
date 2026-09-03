import React, { useEffect, useState } from "react";

import { ThemeProvider, StyledEngineProvider, useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import { CssBaseline } from "@mui/material";
import RemotePeerWidget from "./RemotePeerWidget";
import MediaPlayerWidget from "./MediaPlayerWidget";

const useStyles = makeStyles(theme => ({
    mainBox: {
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        flex: "2",
        overflow: "hidden"
    },
    peerItem: {
        margin: "0.3em",
        transition: "transform 0.2s ease-in-out"
    }
}));

const RoomGrid = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const [topPad, setTopPad] = useState(0);
    const [rows, setRows] = useState([]);
    const [roomUsers, setRoomUsers] = useState({});

    useEffect(() => {
        if(props.roomUsers){
            console.log("valor de userData en grid",{data:props.userData});
            let filteredRoomUsers = Object.keys(props.roomUsers).filter(u => {

                return props.userData.isPresenter ? true : ( props.roomUsers[u].presenter ? true: false);
            });

            let newRU = {};
            filteredRoomUsers.forEach(f => {
                newRU[f] = props.roomUsers[f];
            });

            setRoomUsers(newRU);
        }
    },[props.roomUsers]);



    useEffect(() => {
        if (roomUsers && Object.keys(roomUsers).length > 0) {
            // console.log(props.roomUsers);
            let rows = [];
            let prevRow = 0;
            let rowsNeeded = 1;
            for (let i = 1; i <= 6; i++) {
                let numItems = i * 6;
                rows.push(numItems + prevRow);
                if (numItems + prevRow < Object.keys(roomUsers).length) {
                    rowsNeeded = i + 1;
                }
                prevRow = prevRow + numItems;
            }

            // for (let i=1 ; i<= 6; i++){
            //     let numItems  = Math.pow(2,i+2);
            //     rows.push(numItems + prevRow);
            //     if(numItems + prevRow < Object.keys(props.roomUsers).length){
            //         rowsNeeded = i+1;
            //     }
            //     prevRow = prevRow + numItems;
            // }


            // console.log("las row", { r: rows, rowsNeeded: rowsNeeded });
            setRows(rows);

            setTopPad((rowsNeeded) * props.playerSizes["presenter"] * 0.8 + 200);
        }

        // console.log("revisando el rps en roomgrid", { rps: props.remotePeerStreams });

    }, [roomUsers]);

    const calculateRadius = (originalPlayerSize) => {
        if (originalPlayerSize >= 106)
            return 1.11;
        if (originalPlayerSize < 106 && originalPlayerSize >= 83)
            return 1.15;
        if (originalPlayerSize < 83 && originalPlayerSize >= 59)
            return 1.21;
    }
    const calculatePosition = (index, originalPlayerSize) => {
        let minItems = 0;

        let row = 1;
        let radius = originalPlayerSize;

        for (let i = 0; i < rows.length; i++) {

            if ((index + 1) <= rows[i]) {
                row = i + 1;
                break;
            }
        }

        minItems = rows[row - 1];


        let offset = 30;
        let angle = ((index + 1) - minItems) * (360 / (6 * row));
        let finalAngle = angle - offset;
        let distOffset = 0;
        if (row > 2) {

            distOffset += 8;
        }

        let adjusted = true;
        //radius = row * originalPlayerSize * 1.11;
        let percent = 0;

        radius = row * originalPlayerSize * calculateRadius(originalPlayerSize);
        if (row > 0) {

            let oddRow = row % 2 !== 0;

            adjusted = oddRow ? ((index + 1) - minItems) % row === 0 : ((index + 1) - minItems) % row === 0;

            radius = Math.ceil(adjusted ? radius : radius * 0.86);
        }

        let playerSize = originalPlayerSize;

        return {
            row: row,
            adjusted: adjusted,
            minItems: minItems,
            radius: radius,
            playerSize: playerSize,
            angle: angle,
            finalAngle: finalAngle
        }
    }

    const calculatePositionOriginal = (index, originalPlayerSize) => {
        let minItems = 0;

        let row = 1;
        let radius = originalPlayerSize;

        for (let i = 0; i < rows.length; i++) {

            if ((index + 1) <= rows[i]) {
                row = i + 1;
                break;
            }
        }

        if (row > 1) {
            minItems = rows[row - 2];
        }

        let offset = 22.5;
        let angle = ((index + 1) - minItems) * ((360 / Math.pow(2, row + 2)));

        // let adjusted = row === 1 ? angle >= 90 && angle <= 135 || angle >= 270 && angle <= 315 : 
        // ((index+1) - minItems) % 2 !== 0
        // ;
        let adjusted = false;
        let finalAngle = angle - offset;



        radius = props.playerSizes["owner"] / 2 + (row === 1 ? originalPlayerSize * 0.61 : row * originalPlayerSize * 0.8) + 10;

        // radius = adjusted ? (row === 1 ? Math.ceil( radius*1.07 ) : Math.ceil( radius*0.88 ) )  : 
        // (row ===1 ? radius : radius*1.05 ) ;

        let playerSize = props.playerSizes["presenter"] * (row === 1 ? 1 : 1 - 0.15 * row);
        //let playerSize = originalPlayerSize;

        return {
            row: row,
            adjusted: adjusted,
            minItems: minItems,
            radius: radius,
            playerSize: playerSize,
            angle: angle,
            finalAngle: finalAngle
        }
    }

    const getPeerStreamsByLabel = (roomUsers, remotePeerStreams, peerId) => {
        // console.debug("RoomGrid -- getPeerStreamsByLabel -- comenzando", {
        //     roomUsers: roomUsers,
        //     rps: remotePeerStreams, peerId: peerId
        // });

        let streams = {};

        if (roomUsers && roomUsers[peerId] && remotePeerStreams[peerId]) {
            let peerLocalStreamRefs = roomUsers[peerId].localStreams || {};

            // console.debug("RoomGrid -- getPeerStreamsByLabel -- peer's current local streams", { peerId: peerId, peerLocalStreams: peerLocalStreamRefs });

            Object.keys(peerLocalStreamRefs).forEach(ls => {
                let localStreamObj = remotePeerStreams[peerId][ls];

                if (localStreamObj) {
                    streams[peerLocalStreamRefs[ls].label] = localStreamObj;
                } else {
                    //search within other peer's cloned streams references
                    let userIds = Object.keys(roomUsers);
                    for (let i = 0; i < userIds.length; i++) {
                        let usrId = userIds[i];
                        if (roomUsers[usrId].clonedStreams && roomUsers[usrId].clonedStreams[peerId]) {
                            // console.debug("RoomGrid -- getPeerStreamsByLabel -- searching for this stream in cloned streams ",
                            //     { peerId: peerId, usrId: usrId, ls: ls, ru: roomUsers[usrId], clStr: roomUsers[usrId].clonedStreams })

                            let peerClonedStreamsRef = roomUsers[usrId].clonedStreams[peerId];

                            if (peerClonedStreamsRef && peerClonedStreamsRef[ls]) {
                                let clonedStreamIds = roomUsers[usrId].clonedStreams[peerId][ls].clonedStreamIds;
                                // console.debug("RoomGrid -- getPeerStreamsByLabel -- result of searching clonedStreamIds ",
                                //     { peerId: peerId, usrId: usrId, ls: ls, ru: roomUsers[usrId], clonedStreamIds: clonedStreamIds })

                                if (clonedStreamIds) {

                                    streams[peerLocalStreamRefs[ls].label] = remotePeerStreams[peerId][clonedStreamIds[0]];
                                    break;
                                }
                            } else {

                                // console.debug("RoomGrid -- getPeerStreamsByLabel -- could not find this streamId in this peer's cloned streams references. The target peerId has no clonedStreamIds defined with the current peer or the streamId does not have a reference inside it",
                                //     { peerId: peerId, usrId: usrId, ls: ls, ru: roomUsers[usrId], clonedStream: roomUsers[usrId].clonedStreams })

                                break;
                            }


                        }

                    }

                    if (!streams[peerLocalStreamRefs[ls].label]) {
                        console.debug("RoomGrid -- getPeerStreamsByLabel: could not find reference of this peer as cloned streams in roomUsers or remotePeerStreams",
                            {
                                roomUsers: roomUsers,
                                rps: remotePeerStreams, peerId: peerId
                            })
                    }


                }

            });

        } else {

            console.debug("RoomGrid -- getPeerStreamsByLabel: could not find reference of this peer in roomUsers or remotePeerStreams",
                {
                    roomUsers: roomUsers,
                    rps: remotePeerStreams, peerId: peerId
                })
        }

        return streams;

    }

    // const getPeerStreamByLabel = (roomUsers,remotePeerStreams,peerId,label) => {
    //     console.log("RoomGrid -- getPeerStreamByLabel -- comenzando",{roomUsers:roomUsers,
    //         rps:remotePeerStreams,peerId:peerId,label:label});
    //     let stream = null;

    //     if(roomUsers && roomUsers[peerId] && remotePeerStreams[peerId]){
    //       let peerLocalStreamRefs = roomUsers[peerId].localStreams || {};

    //       console.log("RoomGrid -- getPeerStreamByLabel -- peer's current local streams",{peerId:peerId,peerLocalStreams:peerLocalStreamRefs});


    //       let streamId = Object.keys(peerLocalStreamRefs).filter(ls => {
    //           if(peerLocalStreamRefs[ls].label === label){
    //             return true;
    //           }
    //       })[0];

    //       if(streamId){

    //         console.log("RoomGrid -- getPeerStreamByLabel -- streamId found for this peer and label",{peerId:peerId,label:label,peerLocalStreams:peerLocalStreamRefs});

    //         stream = remotePeerStreams[peerId][streamId];

    //       }else{
    //           console.warn("RoomGrid -- getPeerStreamByLabel: could not find streamId for this peerId and label",
    //           {roomUsers:roomUsers,
    //             rps:remotePeerStreams,peerId:peerId,label:label})
    //       }


    //     }else{
    //         console.warn("RoomGrid -- getPeerStreamByLabel: could not find reference of this peer in roomUsers or remotePeerStreams",
    //           {roomUsers:roomUsers,
    //             rps:remotePeerStreams,peerId:peerId,label:label})
    //     }


    //       return stream;
    //   }

    const getPeerStreamFromSFU = (roomUsers, remotePeerStreams, peerId, label) => {
        console.debug("RoomGrid -- getPeerStreamFromSFU -- comenzando", {
            roomUsers: roomUsers,
            rps: remotePeerStreams, peerId: peerId, label: label
        });
        let stream = null;

        if (roomUsers && roomUsers[peerId] && remotePeerStreams) {
            let peerLocalStreamRefs = roomUsers[peerId].localStreams || {};

            let sfus = Object.keys(roomUsers).filter(u => {
                if (roomUsers[u].sfu) {
                    return true;
                }
            });

            //for the time being, only one SFU in the room is considered



            let streamId = Object.keys(peerLocalStreamRefs).filter(ls => {
                if (peerLocalStreamRefs[ls].label === label) {
                    return true;
                }
            })[0];

            if (streamId && sfus && sfus.length > 0) {
                //let singleSFU = sfus[0];
                let singleSFU = roomUsers[props.userData.peerId].assignedSFU;

                let rp;
                if (singleSFU) {
                    rp = remotePeerStreams[singleSFU];
                    if (rp) {
                        stream = rp[streamId];
                    }
                } else {
                    console.warn("singleSFU not defined...user with no SFU assigned?", { localPeer: roomUsers[props.userData.peerId] })
                }



                // console.log("RoomGrid -- por obtener stream getPeerStream",{
                //     s:stream,sId: streamId,pId:peerId,label:label,
                //     peerLocalStreamRefs:peerLocalStreamRefs,
                //     rps:remotePeerStreams,
                //     rp:rp,
                // sfus:sfus,sfuOne:singleSFU,sfuStreams:stream});

            }


        }


        return stream;
    }


    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme} >
                <CssBaseline />
                {/* { !props.userData.sfu ? */}
                {true ?
                    (

                        <div className={classes.mainBox} style={{
                            //paddingTop: topPad+"px",
                            // paddingLeft: topPad+"px"
                        }} >

                            {
                                props.isMainPresenter ?
                                    (
                                        <MediaPlayerWidget
                                            isCameraEnable={props.localCamera ? props.localCamera.isVideoEnabled():false}
                                            avatar={props.userData.avatar}
                                            background={props.isPresenter ? "primary" : "secondary"}
                                            volume={0} label={props.userData && props.userData.userName || props.userData.peerId}
                                            playerSize={props.playerSizes["presenter"]} stream={props.localCamera && props.localCamera.getStream()} />

                                    )
                                    :
                                    (
                                        <div />
                                    )
                            }


                            {
                                Object.keys(roomUsers).filter(e => { if (e.owner) { return e.presenter } else { return e !== props.userData.peerId } })
                                    .sort((a, b) => { return roomUsers[a].presenter && !roomUsers[b].presenter ? -1 : 1 })
                                    .map((peerId, index) => {


                                        if (roomUsers[peerId].mainPresenter) {
                                            return (
                                                <RemotePeerWidget
                                                    key={peerId}
                                                    nomedia={props.nomedia}
                                                    showScreenIcon={true}
                                                    isCameraEnable={roomUsers[peerId].camera}
                                                    avatar={roomUsers[peerId].avatar}
                                                    background={roomUsers[peerId].presenter ? "primary" : "secondary"}
                                                    // playerSize={roomUsers[peerId].mainPresenter  ? props.playerSizes["presenter"]: (roomUsers[peerId].presenter ? props.playerSizes["presenter"] : props.playerSizes["spectator"]) }
                                                    playerSize={props.playerSizes["presenter"]}
                                                    label={roomUsers[peerId].userName || peerId}
                                                    presentationRequested={roomUsers[peerId].presentationRequested}
                                                    presentationGranted={roomUsers[peerId].presentationGranted}
                                                    onPresentationGranted={props.grantPresentation}
                                                    onPresentationRemoved={props.removePresentation}
                                                    localOwner={props.isOwner}
                                                    localStreams={roomUsers[peerId].localStreams}
                                                    streams={

                                                        getPeerStreamsByLabel(roomUsers, props.remotePeerStreams, peerId)


                                                        // ( props.remotePeerStreams[peerId] && props.remotePeerStreams[peerId][Object.keys(props.remotePeerStreams[peerId])[0]] ) ||

                                                        //         getPeerStreamFromSFU(roomUsers,props.remotePeerStreams,
                                                        //             peerId,"camera")




                                                    }
                                                    peerId={peerId} owner={roomUsers[peerId].owner}
                                                    presenter={roomUsers[peerId].presenter}
                                                    goToScreen={e => props.goToScreen(roomUsers[peerId])}
                                                />

                                            )
                                        } else {
                                            let pos = calculatePosition(index - 1, props.playerSizes["presenter"]);
                                            if (props.isMainPresenter) {
                                                pos = calculatePosition(index, props.playerSizes["presenter"]);
                                            }

                                            return (
                                                <div key={peerId} className={classes.peerItem}
                                                    style={{
                                                        position: roomUsers[peerId].owner ? "relative" : "absolute",
                                                        // transform: !roomUsers[peerId].owner ? "rotate("+( ((index*48)-46) / Math.pow(2,row-1)  )+"deg) translate("+(props.playerSizes["owner"]*0.85*row)+"px,"+((props.playerSizes["owner"]*0.33)*row)+"px) rotate("+(   (-(index*48)+46)  / Math.pow(2,row-1)  )+"deg) " : "none",
                                                        transform: !roomUsers[peerId].owner ? "rotate(" + pos.finalAngle + "deg) translate(" + (pos.radius) + "px) rotate(" + (-pos.finalAngle) + "deg) " : "none"

                                                    }}>

                                                    <RemotePeerWidget
                                                        nomedia={props.nomedia}
                                                        showScreenIcon={true}
                                                        isCameraEnable={roomUsers[peerId].camera}
                                                        avatar={roomUsers[peerId].avatar}
                                                        background={roomUsers[peerId].presenter ? "primary" : "secondary"}
                                                        playerSize={pos.playerSize}
                                                        label={roomUsers[peerId].userName || peerId}
                                                        presentationRequested={roomUsers[peerId].presentationRequested}
                                                        presentationGranted={roomUsers[peerId].presentationGranted}
                                                        onPresentationGranted={props.grantPresentation}
                                                        onPresentationRemoved={props.removePresentation}
                                                        localOwner={props.isOwner}
                                                        //streams={props.remotePeerStreams[peerId]}
                                                        localStreams={roomUsers[peerId].localStreams}
                                                        streams={
                                                            //    ( props.remotePeerStreams[peerId] && props.remotePeerStreams[peerId][Object.keys(props.remotePeerStreams[peerId])[0]] ) ||

                                                            //     getPeerStreamFromSFU(roomUsers,props.remotePeerStreams,peerId,"camera")
                                                            getPeerStreamsByLabel(roomUsers, props.remotePeerStreams, peerId)

                                                        }
                                                        peerId={peerId} owner={roomUsers[peerId].owner}
                                                        presenter={roomUsers[peerId].presenter}
                                                        goToScreen={e => props.goToScreen(roomUsers[peerId])}
                                                    />

                                                </div>


                                            )
                                            //}

                                        }
                                    })
                            }

                        </div>
                    )
                    :
                    (
                        <div />
                    )
                }

            </ThemeProvider>)
        </StyledEngineProvider>
    );
};

export default RoomGrid;