import React,{useEffect, useState} from "react";
import hexagonDark from "./img/hexagon-dark.png";
import hexagonFullDark from "./img/hexagon-full-dark.png";
import hexagonAmber from "./img/hexagon-amber.png";
import defaultAvatar from "./img/default-avatar.png";
import { makeStyles,ThemeProvider,useTheme} from '@material-ui/core/styles';
import {CssBaseline,useMediaQuery,Avatar} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    mainBox:{
      display:"flex",
      position:"relative",
      flexDirection:"column",
      alignItems:"flex-start",
      justifyContent:"flex-start",
      backgroundColor: "transparent",
      height:"100%",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition:"center",
      padding:"0.7em"
    }
    
  }));

const HexagonalAvatarWidget = (props) => {
    const theme = useTheme();
    const classes = useStyles();
    const xsScreen = useMediaQuery(theme.breakpoints.down("xs"));

    return (
        <ThemeProvider theme={theme} >
            <CssBaseline/>
            <div className={classes.mainBox} style={{
                backgroundImage:`url(${props.background === "primary" ? hexagonAmber : (props.background === "secondary" ? hexagonFullDark : hexagonDark) })`,
            }}>
                <Avatar style={{
                    height:"2em",
                    width:"2em",
                    padding: props.avatarImg ? "initial" : "0.2em"
                }} alt={props.label} src={props.avatarImg ? props.avatarImg : defaultAvatar} />
            </div>
        </ThemeProvider>
    );
};

export default HexagonalAvatarWidget;