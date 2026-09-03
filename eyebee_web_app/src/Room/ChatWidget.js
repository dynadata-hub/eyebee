import React, {useEffect,useState,useRef,createRef} from "react";

//import useChat from "../useChat";

import { Close,PanTool,Send } from "@material-ui/icons";
import {Paper,Card,TextField,Button,IconButton,ThemeProvider, CssBaseline} from "@material-ui/core";
import { makeStyles,createMuiTheme, useTheme } from '@material-ui/core/styles';
import ChatItem from "../ChatItem";

const darkFormField = createMuiTheme({
    palette:{
        background:{
            default: "#212121",
            paper:"#212121"
        },
        primary: {
            main: "#fafafa",
           
        },
        secondary:{
            main:"#fafafa",
            contrastText:"#fafafa"
        },
        text:{
            primary:"#fafafa",
            secondary:"#bdbdbd"
        },
        action:{
            disabled:"#ffe082",
            disabledBackground:"#ffe082" 
        }
    }
});

const useStyles = makeStyles(theme => ({
    mainBox:{
        display: "grid",
        gridTemplateColumns:"1fr",
        gridTemplateRows:"minmax(0, 80%) 20%",
        flex:"2",
        width:"100%"
    },
    messagesBox:{
        display: "flex",
        padding:"0.5em",
        overflowY:"hidden",
        position:"relative"
    },
    messagesInnerBox:{
        display: "flex",
        position:"absolute",
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
        margin:"0.5em",
        flexDirection:"column",
        overflowY:"auto",
    },
    writeBox:{
        display: "flex",
        padding:"0.5em",
        alignItems:"center",
        justifyContent:"center"
    },
    messageItemBox:{
        display: "flex",
        padding:"0",
        alignItems:"center",
        justifyContent:"center"
    },
    fromLabel:{
        marginRight:"0.5em",
        fontSize:"0.9em",
        fontWeight:"bold"
    },
    text:{
        fontSize:"0.9em"
    }
  }));


const ChatWidget = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [message,setMessage] = useState("");
    const [target,setTarget] = useState(null);
    const listRef = createRef();

    const updateMessageField = e => {
        setMessage(e.target.value);
        
    }

    useEffect(() => {

        listRef.current.scrollIntoView({ behavior: "smooth" });
    },[props.messages,listRef]);


    useEffect(() => {

        console.log("participants modificado",{participants:props.participants});

    },[props.participants]);

    const send = () => {
        if(message){
            props.sendMessage(props.roomId, props.userId,target,message);
            setMessage("");
        }
       
    }


    const keyPressed = e => {
        if(e.keyCode === 13){
            send();
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={classes.mainBox}>
                <div className={classes.messagesBox}>
                    <div className={classes.messagesInnerBox}>
                        {
                            props.messages && props.messages.map( (msg,index) => {
                                return (
                                <div key={index} className={classes.messageItemBox} >
                                    {/* <p style={{
                                        flex:"2",
                                        fontSize:"0.9em",
                                        margin:"0.5em 0"
                                    }}>
                                        <label
                                            className={classes.fromLabel}
                                        >{props.participants && props.participants[msg.from] ? props.participants[msg.from].userName : "desconocido"}
                                        </label> 
                                        {msg.message}
                                    </p> */}

                                    <ChatItem user={props.participants && props.participants[msg.from] ? props.participants[msg.from] : null}
                                    label={props.participants && props.participants[msg.from] ? props.participants[msg.from].userName : null} message={msg.message}></ChatItem>
                                </div>
                                )
                            })
                        }
                        <div style={{ float:"left", clear: "both" }}
                            ref={listRef}>
                        </div>
                    </div>
                </div>
                <div className={classes.writeBox}>
                    <ThemeProvider theme={darkFormField} >
                        <TextField 
                            multiline
                            style={{
                                flex:"2",
                                backgroundColor:darkFormField.palette.background.default
                            }}
                            variant="filled"
                            value={message}
                            onKeyUp={keyPressed}
                            onChange={updateMessageField}
                            placeholder="Escribe un mensaje"
                            variant="outlined"
                            rows={2}
                            rowsMax={2}
                        />
                    </ThemeProvider>
                    <IconButton
                        color="primary"
                        
                        onClick={send}
                    >
                        <Send style={{
                            width:"2em",
                            height:"2em"
                        }} />
                    </IconButton>
                </div>
            </div>
        </ThemeProvider>

    );
};

export default ChatWidget;