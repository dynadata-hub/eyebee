import React, { useState, useEffect, createRef } from "react";

import {Button, CssBaseline, ThemeProvider, useMediaQuery} from "@material-ui/core";
import { makeStyles, createMuiTheme, useTheme } from '@material-ui/core/styles';

//import { Adb, Mic, MicOff, Videocam, VideocamOff } from '@material-ui/icons';

import logoEyeBee from "./img/logo_eyebee_fondo_negrov2.jpg";

import axios from 'axios';

const darkFormField = createMuiTheme({
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
});

const lightButton = createMuiTheme({
    palette: {
        primary: {
            main: "#F29F39",
            contrastText: "#ffffff"

        },
        secondary: {
            main: "#fafafa",
            contrastText: "#212121"
        },
        text: {
            primary: "#fafafa",
            secondary: "#bdbdbd"
        },
        action: {
            disabled: "black",
            disabledBackground: "#292929"
        }
    }
});

const useStyles = makeStyles(theme => ({
    mainBox: {
        display: "flex",
        flex: "2",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start"
    },
    logoBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        margin: "1em 0"
    },
    
    [theme.breakpoints.up("md")]: {
        
    },
    [theme.breakpoints.down("sm")]: {
        
    },
    actionsBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        margin: "1em 0"
    },
    roundedBtn: {
        textTransform: "none",
        borderRadius: "0.5em"
    }
    ,
    messageBox:{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        margin: "1em 0"
    },
    mainMessage:{
        textAlign:"justify"
    }

}));


const AfterSessionView = (props) => {
    const classes = useStyles();
    const theme = useTheme();

    const xsScreen = useMediaQuery(theme.breakpoints.up("xs"));
    const mdScreen = useMediaQuery(theme.breakpoints.up("md"));
    const lgScreen = useMediaQuery(theme.breakpoints.up("lg"));
    const [logoSize, setLogoSize] = useState(0);

    const getLogoSize = () => {
        let logoSize = 8;

        if (mdScreen) {
            logoSize = 10;

        }

        if (lgScreen) {
            logoSize = 12;
        }


        return logoSize;

    }

    useEffect(() => {
        let a = getLogoSize();
        setLogoSize(a); 

    }, [xsScreen, mdScreen, lgScreen]);


    return (

        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={classes.mainBox}>

                <div className={classes.logoBox}>
                    <img style={{
                        height: logoSize + "em",
                        width: "auto"
                    }} src={logoEyeBee} />
                </div>
                

                <div className={classes.messageBox}>
                    <h4 className={classes.mainMessage}>Thanks for joining. See you on your next session</h4>
                </div>

                <div className={classes.actionsBox}>
                    <ThemeProvider theme={lightButton} >
                        <Button variant="contained"
                            color="primary" className={`${classes.roundedBtn} ${classes.roomActionBtn}`}
                            onClick={props.toJoinRoomView}>Join again</Button>
                    </ThemeProvider>

                </div>

            </div>
        </ThemeProvider>

    );
};

export default AfterSessionView;