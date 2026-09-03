import React, { useEffect, useState, useRef, createRef } from "react";

//import useChat from "../useChat";
import { Close, PanTool, Send } from "@mui/icons-material";
import {
    FormGroup,
    TextField,
    RadioGroup,
    FormControlLabel,
    Switch,
    Radio,
    SvgIcon,
    Button,
    IconButton,
    ThemeProvider,
    StyledEngineProvider,
    CssBaseline,
    adaptV4Theme,
} from "@mui/material";
import { createTheme, useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import LinkIcon from '@mui/icons-material/Link';
import crypto from 'crypto-js';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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
        padding: "0.3em",
        alignItems: "center",
        justifyContent: "center",
        height: "100px",
        display: "flex"
    },
    subRoomsBox: {
        width: "100%",
        padding: "0em",
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
        width: "95vw",
        height: "77vh",
        left: "50%",
        top: "40%",
        transform: "translate(-50%, -50%)",
        WebkitTransform: "translate(-50%, -50%)",
        zIndex: "100",
        background: "#292929",
        borderRadius: "5px"
    }
}));


const LinksRooms = (props) => {

    const classes = useStyles();
    const theme = useTheme();
    const [mainUser, setMainUser] = useState();
    const [presenter, setPresenter] = useState();
    const [regularUser, setRegularUser] = useState();
    const [nonSFU, setNonSFU] = useState();
    const [open, setOpen] = useState(false);
    const [smallRoom, setSmallRoom] = useState(false);


    useEffect(() => {
        let mainLink = `https://livelatency.com/videocall/${props.room_id}`;
        const paramsM = crypto.AES.encrypt(smallRoom ? "owner=true&presenter=true&testDisabled=true&sfu=true" : "owner=true&presenter=true", "human hive eyebee").toString();
        
        const paramsP = crypto.AES.encrypt(smallRoom ? "presenter=true&testDisabled=true&sfu=true" : "presenter=true", "human hive eyebee").toString();
        
        const paramsR = crypto.AES.encrypt(smallRoom ? "presenter=false&testDisabled=true&sfu=true" : "presenter=false", "human hive eyebee").toString();
        const paramsN = crypto.AES.encrypt("presenter=true&testDisabled=true&sfu=false", "human hive eyebee").toString();
        console.log(paramsN);
        console.log(crypto.AES.decrypt(paramsN, "human hive eyebee").toString(crypto.enc.Utf8));
        //console.log(mainLink);
        setMainUser(`${mainLink}?p=${paramsM}`);
        setPresenter(`${mainLink}?p=${paramsP}`);
        setRegularUser(`${mainLink}?p=${paramsR}`);
        setNonSFU(`${mainLink}?p=${paramsN}`);
    }, [smallRoom]);


    const handleSwitchChange = (e) => {
        console.log(e.target.checked);
        setSmallRoom(e.target.checked);
    }

    const copy = (value) => {
        navigator.clipboard.writeText(value);
        handleClick();
    }

    const openLink = (url) => {
        var win = window.open(url, '_blank');
        win.focus();
    }

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    };

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme}>
                <CssBaseline />
                <div className={classes.newSubRoom} id="new-room">

                    <div className={classes.writeBox} style={{
                        height:"4em"
                    }}>
                        <StyledEngineProvider injectFirst>
                            <ThemeProvider  theme={theme} >
                                

                                <FormGroup>
                                    <FormControlLabel
                                    style={{
                                        color:theme.palette.primary.contrastText
                                    }}
                                    
                                    control={<Switch 
                                    color="primary"
                                        checked={smallRoom}
                                        onChange={handleSwitchChange}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    >

                                    </Switch>} label="Small room" />
                               
                                </FormGroup>
                                
                            </ThemeProvider>
                        </StyledEngineProvider>

                    </div>

                    <div className={classes.writeBox}>
                        <StyledEngineProvider injectFirst>
                            <ThemeProvider theme={darkFormField} >
                                <TextField style={{
                                    flex: "2",
                                    backgroundColor: darkFormField.palette.background.default
                                }} label="Main user" value={mainUser} />
                                <FileCopyIcon onClick={() => copy(mainUser)} style={{ color: "#767676" }}></FileCopyIcon>
                                <LinkIcon onClick={() => openLink(mainUser)} style={{ color: "#767676" }}></LinkIcon>
                            </ThemeProvider>
                        </StyledEngineProvider>
                    </div>

                    <div className={classes.writeBox}>
                        <StyledEngineProvider injectFirst>
                            <ThemeProvider theme={darkFormField} >
                                <TextField style={{
                                    flex: "2",
                                    backgroundColor: darkFormField.palette.background.default
                                }} id="standard-basic" label="Presenters" value={presenter} />
                                <FileCopyIcon onClick={() => copy(presenter)} style={{ color: "#767676" }}></FileCopyIcon>
                                <LinkIcon onClick={() => openLink(presenter)} style={{ color: "#767676" }}></LinkIcon>
                            </ThemeProvider>
                        </StyledEngineProvider>
                    </div>

                    <div className={classes.writeBox}>
                        <StyledEngineProvider injectFirst>
                            <ThemeProvider theme={darkFormField} >
                                <TextField style={{
                                    flex: "2",
                                    backgroundColor: darkFormField.palette.background.default
                                }} id="standard-basic" label="Regular users" value={regularUser} />
                                <FileCopyIcon onClick={() => copy(regularUser)} style={{ color: "#767676" }}></FileCopyIcon>
                                <LinkIcon onClick={() => openLink(regularUser)} style={{ color: "#767676" }}></LinkIcon>
                            </ThemeProvider>
                        </StyledEngineProvider>
                    </div>

                    <div className={classes.writeBox}>
                        <StyledEngineProvider injectFirst>
                            <ThemeProvider theme={darkFormField} >
                                <TextField style={{
                                    flex: "2",
                                    backgroundColor: darkFormField.palette.background.default
                                }} id="standard-basic" label="Non SFU presenters" value={nonSFU} />
                                <FileCopyIcon onClick={() => copy(nonSFU)} style={{ color: "#767676" }}></FileCopyIcon>
                                <LinkIcon onClick={() => openLink(nonSFU)} style={{ color: "#767676" }}></LinkIcon>
                            </ThemeProvider>
                        </StyledEngineProvider>
                    </div>

                    <div className={classes.writeBox}>
                        <Button color={"primary"}
                            style={{
                                flex: "1",
                                border: "solid 2px #4e4d4d",
                                color: "#4e4d4d",
                                borderRadius: "5px",
                                padding: "5px",
                                maxWidth: "120px",
                                margin: "10px"
                            }}
                            onClick={props.toogleShowLinks}
                        >
                            Close
                        </Button>
                    </div>
                    <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity="info">
                            Copy to clipboard
                        </Alert>
                    </Snackbar>
                </div>
            </ThemeProvider>)
        </StyledEngineProvider>
    );
}

export default LinksRooms;