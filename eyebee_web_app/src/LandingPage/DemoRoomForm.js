import React, { useState, useEffect, useCallback } from "react";

import {CssBaseline, Typography,TextField,Button,FormGroup,FormControlLabel,Switch} from "@material-ui/core";

import {Share,PlayArrow} from "@material-ui/icons";

import { makeStyles, createTheme, ThemeProvider } from '@material-ui/core/styles';

import DarkFormTheme from "../DarkFormTheme";

import MainTheme from "../MainTheme";

import RoomLinkGenerator from "../RoomLinkGenerator";

import crypto from 'crypto-js';


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
    formBox:{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
        width: "100%",
        padding:"1em",
        flex: "2"
    },
    form:{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding:"1em",
        backgroundColor:"#212121",
        borderRadius:"0.3em",
        boxShadow:"0 0 1em #101010",
        [theme.breakpoints.up('sm')]: {
            width:"45em"
        },
        [theme.breakpoints.down('sm')]: {
            width:"35em"
        },
        [theme.breakpoints.down('xs')]: {
            width:"95%"
        },
    },
    textField:{
        width:"100%"
    },
    title:{
        marginBottom:"1em",
        color: theme.palette.primary.contrastText,
        fontWeight:"bold"
    },
    formRow:{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin:"1em 0",
        [theme.breakpoints.up('sm')]: {
            flexDirection: "row",
        },
        [theme.breakpoints.down('xs')]: {
            flexDirection: "column",
        },
    },
    formBtn:{
        width:"13em",
        margin:"2em 0.5em"
    },
    roomTypeBox:{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
        width: "100%"
    },
    columnBox:{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
        width: "100%"
    }


}));

const DemoRoomForm = props => {

    const classes = useStyles();
    const [ownerRoomURL,setOwnerRoomURL] = useState("");
    const [roomURL,setRoomURL] = useState("");
    const [copied,setCopied] = useState(false);
    const [largeRoom, setLargeRoom] = useState(false);


    useEffect(() => {
        let roomGen = new RoomLinkGenerator(window,crypto);
        let links = roomGen.generateLinks(null,{
            demo:true,
            largeRoom:largeRoom
        });
        
        if(largeRoom){
            setOwnerRoomURL(links.owner);
        }else{
            setOwnerRoomURL("");
        }
       
        setRoomURL(links.presenters);
       
    }, [largeRoom]);

    const onOpenLink = () => {

        props.onOpenLink(ownerRoomURL ? ownerRoomURL : roomURL);
    }

    const onCopyLink = async () => {

        await props.onCopyLink(roomURL);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        },1000);

    }

    const handleSwitchChange = e => {
        setLargeRoom(e.target.checked);
    }

    return (

        <ThemeProvider theme={DarkFormTheme}>
            <div className={classes.formBox}>
                <div className={classes.form}>
                    <Typography className={classes.title} >Start a room</Typography>

                    <ThemeProvider theme={MainTheme}>
                        <div className={classes.formRow} style={{
                            margin:"2em 0"
                        }}>
                            <div className={classes.roomTypeBox}>
                                <FormGroup>
                                    <FormControlLabel
                                    style={{
                                        color:MainTheme.palette.primary.contrastText
                                    }}
                                    
                                    control={<Switch 
                                    color="primary"
                                        checked={largeRoom}
                                        onChange={handleSwitchChange}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    >

                                    </Switch>} label={largeRoom ? "Large Room": "Small Room" } />
                                
                                </FormGroup>
                                <Typography style={{
                                    maxWidth:"80%",
                                    color: MainTheme.palette.secondary.contrastText,
                                    textAlign:"justify"
                                    
                                }}>
                                    {
                                        largeRoom ? 
                                        "The session can scale beyond 5 participants. This mode requires a certain number of peers to have good device capabilities."
                                        :
                                        "Allows anyone to join the session regardless of their device's capabilities. Suitable for a small number of participants (5 max)."
                                        
                                    }
                                </Typography>
                            </div>
                        

                            
                        </div>
                    </ThemeProvider>
                    
                    {
                        largeRoom ?
                        (
                            <div className={classes.columnBox}>
                                <TextField color="primary" className={classes.textField} multiline={true} variant="outlined"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    helperText="Link to start the session"
                                    label="Owner Room Link" value={ownerRoomURL} />
                                 <ThemeProvider theme={MainTheme}>
                                    <Button color="primary" variant="contained" className={classes.formBtn} startIcon={
                                                <PlayArrow/>
                                    } onClick={onOpenLink}>Start Session</Button>
                                 </ThemeProvider>
                                

                                <TextField color="primary" className={classes.textField} multiline={true} variant="outlined"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    helperText="Shareable link for others to join as presenters"
                                    label="Presenters Room Link" value={roomURL} />
                                 <ThemeProvider theme={MainTheme}>
                                    <Button color="primary" variant="contained" className={classes.formBtn} startIcon={
                                        <Share/>
                                    } onClick={onCopyLink}>{copied ? "Copied" : "Copy Link"}</Button>
                                 </ThemeProvider>
                               
                            </div>
                        )
                        :
                        (       
                            <div className={classes.columnBox}>
                                <TextField color="primary" className={classes.textField} multiline={true} variant="outlined"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                helperText="Share this link to others"
                                label="Presenters Room Link" value={roomURL} />
                                
                                <div className={classes.formRow}>
                        
                                    <ThemeProvider theme={MainTheme}>
                                        <Button color="primary" variant="contained" className={classes.formBtn} startIcon={
                                            <PlayArrow/>
                                        } onClick={onOpenLink}>Start Session</Button>
                                        <Button color="primary" variant="contained" className={classes.formBtn} startIcon={
                                            <Share/>
                                        } onClick={onCopyLink}>{copied ? "Copied" : "Copy Link"}</Button>
                                    </ThemeProvider>
                                    
                                </div>
                            </div>             
                            

                        )
                    }



                </div>
            </div>
        </ThemeProvider>

    )

}



export default DemoRoomForm;