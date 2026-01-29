import React,{useEffect, useState} from "react";

import { makeStyles,ThemeProvider,useTheme} from '@material-ui/core/styles';
import {CssBaseline,IconButton,useMediaQuery} from "@material-ui/core";
import HexagonalAvatarWidget from "./HexagonalAvatarWidget";

const useStyles = makeStyles(theme => ({
    mainBox:{
      display:"flex",
      alignItems:"center",
      justifyContent:"flex-start",
      backgroundColor: "transparent",
      width:"100%",
      borderRadius:"0.5em",
      padding:"0.5em"
    },
    actionsBox:{
        display:"flex",
        flex:"2",
        alignItems:"center",
        justifyContent:"flex-start"
    },
    label:{
        fontWeight:"bold",
        margin:"0 0.5em"
    },
    message:{
        textAlign:"justify",
        backgroundColor: theme.palette.background.default,
        padding: "0.5em",
        borderRadius:"0.5em",
        wordBreak:"break-all",
        margin:"0"
    }
  }));

const ChatItem = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const xsScreen = useMediaQuery(theme.breakpoints.down("xs"));
    const [message,setMessage] = useState(null);
    const [label,setLabel] = useState(null);
    const [user,setUser] = useState(null);

    useEffect(() => {
        if(props.message){
            setMessage(props.message);
        }
    },[props.message]);

    useEffect(() => {
        if(props.label){
            setLabel(props.label);
        }
    },[props.label]);

    useEffect(() => {
        if(props.user){
            console.log("el user que pasa al chat item",{u:props.user});
            setUser(props.user);
        }
    },[props.user]);

    return (
        <ThemeProvider theme={theme} >
            <CssBaseline/>
            <div className={classes.mainBox}>
                <div style={{
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center"
                }}>
                    <HexagonalAvatarWidget background={user && user.presenter ? "primary": "secondary"} />
                </div>
                <div style={{
                    display:"flex",
                    flex:"2",
                    alignItems: "center",
                    justifyContent: "flex-start"
                }}>
                    <p className={classes.label}>{user ? (user.userName ? user.userName : user.id): ""}</p><p className={classes.message}>{props.message}</p>

                </div>
            </div>
        </ThemeProvider>
    );
};

export default ChatItem;