import { React, useEffect, useState, useRef, createRef } from "react";

//import useChat from "../useChat";
import { Close, PanTool, Send } from "@material-ui/icons";
import { Paper, Card, TextField, SvgIcon, Button, IconButton, ThemeProvider, CssBaseline } from "@material-ui/core";
import { makeStyles, createMuiTheme, useTheme } from '@material-ui/core/styles';
import ChatItem from "../ChatItem";
import { Share, Add } from '@material-ui/icons';
import { ReactComponent as SubRoomSVG } from '../img/subroom-icon.svg';
import AutoSizer from "react-virtualized-auto-sizer";



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
    }
}));


const SubRooms = (props) => {
    const classes = useStyles();
    const theme = useTheme();

    const createSubRoom = () => {
        props.toogleCreateNewSubRoom();
        props.toggleSideBox({ section: "subrooms", opened: false });
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={classes.mainBox}>
                <div className={classes.writeBox}>

                    {/* <ThemeProvider theme={darkFormField} >
                        <TextField
                            style={{
                                flex: "2",
                                backgroundColor: darkFormField.palette.background.default
                            }}
                            variant="filled"
                            value={roomName}
                            onChange={updateMessageField}
                            placeholder="Nombre de la sub sala"
                            variant="outlined"
                            rows={1}
                            rowsMax={1}
                        />
                    </ThemeProvider>

                    <ThemeProvider theme={darkFormField} >
                        <TextField
                            style={{
                                flex: "1",
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

                    <Button color={"primary"}
                        style={theme.actionBtn}
                        onClick={createSubRoom}
                    >
                        <Add style={theme.defaultIcon} />
                    </Button> */}
                    <a onClick={createSubRoom} style={{
                        flex: "2",
                        color: "#f19e3e"
                    }}>Crear sala</a>

                </div>
                <div className={classes.subRoomsBox}>{props.subRooms.map(item =>
                    <div className={classes.subRoomItem}>{item.roomName} | (0 / {item.roomMax})</div>
                )}
                </div>

            </div>



        </ThemeProvider >

    );
};

export default SubRooms;