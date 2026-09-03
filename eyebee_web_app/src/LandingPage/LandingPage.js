import React, { useState, useEffect, useCallback } from "react";

import queryString from "query-string";

import { CssBaseline, Typography, adaptV4Theme } from "@mui/material";

import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

import logoEyeBee from "./../img/logo_eyebee_fondo_negrov2.jpg";

import DemoRoomForm from "./DemoRoomForm";

const theme = createTheme(adaptV4Theme({
    palette: {
        background: {
            default: "#000",
        },
        primary: {
            main: "#F29F39",
            contrastText: "#ffffff"
        },
        secondary: {
            main: "#fafafa",
            contrastText: "#8E8E8E"
        },
        action: {
            backgroundColor: "#aaaaaa",
            selected: "#2D2D2D"
        },
        lighterBg: {
            main: "#292929"
        }
    },
    actionBtn: {
        backgroundColor: "#212121",
        margin: "0.5em",
    },
    defaultIcon: {
        fontSize: "1.5em"
    },
    typography: {
        fontSize: "0.9em"
    }
}));


const useStyles = makeStyles(theme => ({

    mainBox: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        flexDirection: "column",
        width: "100%",
        color: "#424242",
        flex: "2"
    },
    logoBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width:"100%",   
        margin: "1em 0"
    },
    manifestoBox:{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width:"100%",
        textAlign:"center",
        margin: "1em 0",
        padding:"1em"
    },
    manifesto:{
        fontSize: "1.2em",
        fontStyle:"italic"
    },
    demoRoomBox:{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        flexDirection: "column",
        width: "100%",
        flex: "2"
    }
}));

const LandingPage = props => {

    const classes = useStyles();

    useEffect(() => {

    }, []);

    const openRoomURL = url => {
        var win = window.open(url, '_blank');
        win.focus();
    }

    const copyLinkToClipboard = async url => {
        await navigator.clipboard.writeText(url);
        return true;
    }

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme}>
                <CssBaseline />
                <div className={classes.mainBox}>

                    <div className={classes.logoBox}>
                        <img style={{
                            height: "10em",
                            width: "auto"
                        }} src={logoEyeBee} />
                    </div>
                    <div className={classes.manifestoBox}>
                        <Typography color="primary" className={classes.manifesto}>
                        Our principles act as tools for thinking, communication, and decentralized decision making
                        </Typography>
                        
                    </div>

                    <div className={classes.demoRoomBox}>
                       <DemoRoomForm onOpenLink={openRoomURL} onCopyLink={copyLinkToClipboard}></DemoRoomForm>
                        
                    </div>


                    
                </div>

            </ThemeProvider>)
        </StyledEngineProvider>
    );

}



export default LandingPage;