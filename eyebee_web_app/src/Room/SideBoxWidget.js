import React, { useEffect, useState } from "react";

import { ThemeProvider, StyledEngineProvider, useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import ChatWidget from "./ChatWidget";
import RoomPeers from "./RoomPeers";
// import SubRooms from "./SubRooms";
import { CssBaseline } from '@mui/material';
import PropTypes from 'prop-types';
import FilledTabsWidget from "../FilledTabsWidget";

const useStyles = makeStyles(theme => ({
    mainBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        borderRadius: "0.5em",
        backgroundColor: theme.palette.lighterBg.main,
        flex: "2",
        width: "100%"
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
                alignItems: "flex-start",
                justifyContent: "flex-start",
                position: "relative",
                overflowY: "auto"
            }}

        >
            {value === index && (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    position: "absolute",
                    bottom: "0",
                    top: "0",
                    left: "0",
                    right: "0"
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

const SideBoxWidget = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const [sideTab, setSideTab] = useState(0);
    const tabChanged = newValue => {
        setSideTab(newValue);
    }

    useEffect(() => {
        if (props.defaultSection) {
            switch (props.defaultSection) {
                case "participants": setSideTab(0); break;
                case "chat": setSideTab(1); break;
                // case "subrooms": setSideTab(2); break;
            }
        }
    }, [props.defaultSection]);

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme} >
                <CssBaseline />
                <div className={classes.mainBox}>
                    <div style={{
                        padding: "2em 0.5em 0.5em 0.5em",
                        width: "100%"
                    }}>
                        <FilledTabsWidget
                            style={{
                                fontSize: "0.5em"
                            }}
                            value={sideTab}
                            options={["Participants (" + Object.keys(props.roomUsers).length + ")", "Chat"]}
                            onTabChanged={tabChanged}
                        />
                    </div>

                    <div style={{
                        display: "flex",
                        flex: "2",
                        width: "100%"
                    }}>
                        <TabPanel value={sideTab} index={0}>
                            <RoomPeers
                                remoteStreams={props.remotePeerStreams}
                                owner={props.userData.isOwner}
                                presenter={props.userData.isPresenter}
                                roomId={props.userData.roomId}
                                userId={props.userData.peerId}
                                peers={props.roomUsers}
                                removePresentation={props.removePresentation}
                                grantPresentation={props.grantPresentation}
                            />
                        </TabPanel>
                        <TabPanel value={sideTab} index={1}>
                            <ChatWidget style={{
                                flex: "2"
                            }}
                                roomId={props.userData.roomId}
                                userId={props.userData.peerId}
                                sendMessage={props.sendMessage}
                                participants={props.roomUsers} messages={props.messages}
                            />
                        </TabPanel>
                        {/* <TabPanel value={sideTab} index={2}>
                            <SubRooms style={{
                                flex: "2"
                            }}
                                toggleSideBox={props.toggleSideBox}
                                toogleCreateNewSubRoom={props.toogleCreateNewSubRoom}
                                roomId={props.userData.roomId}
                                userId={props.userData.peerId}
                                sendMessage={props.sendMessage}
                                participants={props.roomUsers}
                                createSubRoom={props.createSubRoom} subRooms={props.subRooms} />
                        </TabPanel> */}
                    </div>



                </div>
            </ThemeProvider>)
        </StyledEngineProvider>
    );
};

export default SideBoxWidget;