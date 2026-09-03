import React,{useEffect, useState} from "react";

import { ThemeProvider, StyledEngineProvider, useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import {CssBaseline,IconButton,useMediaQuery} from "@mui/material";

const useStyles = makeStyles(theme => ({
    mainBox:{
      display:"flex",
      alignItems:"center",
      justifyContent:"flex-start",
      backgroundColor: theme.palette.background.default,
      width:"100%",
      borderRadius:"0.5em",
      padding:"0.5em"
    },
    actionsBox:{
        display:"flex",
        alignItems:"center",
        justifyContent:"flex-start"
    },
    label:{
        fontWeight:"bold",
        flex:"2",
        wordBreak:"break-all"
    }
  }));

const PeerListItem = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const xsScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme} >
                <CssBaseline/>
                <div className={classes.mainBox}>
                    <div style={{
                        margin:"0 1em 0 0"
                    }}>
                        {props.avatar}
                    </div>
                    
                    <p className={classes.label}>{props.label}</p>
                    <div className={classes.actionsBox}>
                        {props.children}
                    </div>
                </div>
            </ThemeProvider>)
        </StyledEngineProvider>
    );
};

export default PeerListItem;