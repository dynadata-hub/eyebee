import React, { useEffect, useState, useRef, createRef } from "react";

//import useChat from "../useChat";
import { Close, PanTool, Send } from "@mui/icons-material";
import {
    FormGroup,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    SvgIcon,
    Button,
    IconButton,
    ThemeProvider,
    StyledEngineProvider,
    CssBaseline,
    Switch,
    adaptV4Theme,
} from "@mui/material";
import { createTheme, useTheme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

const darkFormField = createTheme(adaptV4Theme({
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
}));

const useStyles = makeStyles(theme => ({
    mainBox: {
        flex: "2",
        width: "100%"
    },
    fromLabel: {
        marginRight: "0.5em",
        fontSize: "0.9em",
        fontWeight: "bold"
    },
    text: {
        fontSize: "0.9em"
    },
    writeBox: {
        padding: "0.5em",
        alignItems: "center",
        justifyContent: "center",
        height: "100px",
        display: "flex"
    },
    subRoomsBox: {
        width: "100%",
        padding: "0.5em",
        position: "relative",
        overflowY: "auto",
    },
    subRoomItem: {
        width: "100%",
        padding: "1em",
        position: "relative",
        background: "#000",
        margin: "0px 0px 10px 0px",
        borderRadius: "10px",
        fontSize: "0.8em"
    },
    newSubRoom: {
        position: "absolute",
        width: "70vw",
        height: "50vh",
        left: "50%",
        top: "40%",
        transform: "translate(-50%, -50%)",
        WebkitTransform: "translate(-50%, -50%)",
        zIndex: "100",
        background: "#292929",
        borderRadius: "5px"
    }
}));


const NewRoom = (props) => {

    const classes = useStyles();
    const theme = useTheme();
    const [roomName, setroomName] = useState("");
    const [roomMax, setRoomMax] = useState();
    const [type, setType] = useState('publica');
    const [smallRoom, setSmallRoom] = useState(false);


    const updateMessageField = e => {
        setroomName(e.target.value);
    }

    const updateRoomMaxField = e => {
        setRoomMax(e.target.value);
    }

    const createSubRoom = () => {
        props.createSubRoom(roomName, roomMax,smallRoom);
        props.toogleCreateNewSubRoom();
    }

    const handleChange = (event) => {
        setType(event.target.value);
    };

    return (
        <StyledEngineProvider injectFirst>(<ThemeProvider theme={theme}>
                    <CssBaseline />
                    <div className={classes.newSubRoom} id="new-room">
                        <div className={classes.writeBox} >
                            <StyledEngineProvider injectFirst>
                                <ThemeProvider theme={darkFormField} >
                                    <TextField
                                        style={{
                                            flex: "2",
                                            backgroundColor: darkFormField.palette.background.default
                                        }}
                                        variant="filled"
                                        value={roomName}
                                        onChange={updateMessageField}
                                        placeholder="Sala 1"
                                        variant="outlined"
                                        rows={1}
                                        maxRows={1}
                                    />
                                </ThemeProvider>
                            </StyledEngineProvider>



                        </div>
                        <div className={classes.writeBox}>
                            <StyledEngineProvider injectFirst>
                                <ThemeProvider theme={darkFormField} >
                                    <TextField
                                        style={{
                                            flex: "2",
                                            backgroundColor: darkFormField.palette.background.default
                                        }}
                                        variant="filled"
                                        value={roomMax}
                                        onChange={updateRoomMaxField}
                                        placeholder="Usuarios"
                                        variant="outlined"
                                        type="number"
                                    />
                                </ThemeProvider>
                            </StyledEngineProvider>

                        </div>

                        <div className={classes.writeBox}>
                            <Button color={"secondary"}
                                style={{
                                    flex: "1",
                                    border: "solid 2px #4e4d4d",
                                    color: "#4e4d4d",
                                    borderRadius: "5px",
                                    padding: "5px",
                                    maxWidth: "120px",
                                    margin: "10px"
                                }}
                                onClick={props.toogleCreateNewSubRoom}
                            >
                                Close
                            </Button>
                            <Button color={"primary"}
                                style={{
                                    flex: "1",
                                    border: "solid 2px #f29f3f",
                                    borderRadius: "5px",
                                    padding: "5px",
                                    background: "#f29f3f",
                                    color: "#fff",
                                    maxWidth: "120px",
                                    margin: "10px"
                                }}
                                onClick={createSubRoom}
                            >
                                Create
                            </Button>

                        </div>
                    </div>
                </ThemeProvider>)
                    </StyledEngineProvider>
    );
}

export default NewRoom;