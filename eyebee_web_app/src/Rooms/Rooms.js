import React, { useState, useEffect, useCallback } from "react";
import { makeStyles, createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles';
import logoEyeBee from "../img/logo_eyebee_fondo_negrov2.jpg";
import ImageIcon from '@material-ui/icons/Image';
import { Input, Button, CssBaseline, InputAdornment, Box, InputLabel, IconButton, TextField, useMediaQuery, Select, MenuItem } from "@material-ui/core";
import DeleteIcon from '@material-ui/icons/Delete';
import { useLocation } from "react-router-dom";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import NewRoom from "./NewRoom"
import axios from "axios"
import LinksRooms from "./LinksRooms";

const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
        color: 'white',
    },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
    root: {
        backgroundColor: "#232222",
        color: 'white',
    },
    label: {
        color: 'white',
    },
    body: {
        color: 'white',
    },
}))(TableRow);


const theme = createMuiTheme({
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
});


const useStyles = makeStyles(theme => ({

    mainBox: {
        display: "flex",
        flex: "2",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "#000"
    },
    large: {
        marginTop: "16px",
        marginRight: "5px"
    },
    container: {
        width: "100%",
        margin: "auto"
    },
    header: {
        width: "80%",
    },
    logoBox: {
        float: "left"
    },
    iconBox: {
        float: "right"
    },
    title: {
        color: "white"
    },
    mediaBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center"
    },
    mediaSelectionBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        margin: "1em 0"
    },
    [theme.breakpoints.up("md")]: {
        mediaSelectionBox: {
            margin: "2em 0"
        },
        deviceField: {
            maxWidth: "25em"
        },
        userNameField: {
            maxWidth: "25em"
        }
    },
    [theme.breakpoints.down("sm")]: {
        mediaSelectionBox: {
            margin: "1em 0"
        },
        deviceField: {
            maxWidth: "17em"
        },
        userNameField: {
            maxWidth: "17em"
        }
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
    },
    roomActionBtn: {
        margin: "0 1em",
        minWidth: "3em",
        fontSize: "0.8em"
    },
    statusBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        color: "#424242"
    },
    statusText: {
        margin: "0.5em 1em"
    },
    sideBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        backgroundColor: "#292929",
        color: "#f5f5f5"
    },
    roomPlayersBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#000"
    },
    actionBtn: {
        padding: "1em 0",
        backgroundColor: theme.palette.lightbg
    },
    userNameField: {
        width: "100%"
    },
    deviceField: {
        margin: "1em 0",
        width: "100%"
    },
    messageBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1em",
        textAlign: "justify"
    },
    message: {
        color: theme.palette.primary.main,
        fontWeight: "bold"
    }
    ,
    hide: {
        visibility: "hidden"
    },
    link: {
        color: "white",
        cursor: "pointer"
    }
}));

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


const Rooms = props => {
    const location = useLocation();
    const classes = useStyles();
    const [createRoom, setCreateRoom] = useState(false);
    const [showLinks, setShowLinks] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState();
    const [activeRoomSmall, setActiveRoomSmall] = useState(false);

    useEffect(() => {

        const auth = localStorage.getItem("auth");
        if (auth == false || auth == null)
            props.history.push('/admin/login');
        loadRooms();
    }, []);

    const logout = () => {
        //Todo Login
        localStorage.setItem("auth", false);
        props.history.push('/admin/login');
    }

    function createData(name, calories, fat, carbs, protein) {
        return { name, calories, fat, carbs, protein };
    }

    const toogleCreateNewSubRoom = () => {
        setCreateRoom(!createRoom);
    }

    const toogleShowLinks = (roomId) => {
        setActiveRoom(roomId);
        setShowLinks(!showLinks);
    }

    const deleteRoom = (room_id) => {
        axios.delete("/api/v1/rooms/delete/" + room_id).then(result => {
            if (result.status === 200) {
                let index = rooms.map(r => r.room_id).indexOf(room_id);
                let newRooms = rooms.slice();
                newRooms.splice(index, 1);
                setRooms(newRooms);
            }
        }).catch(error => alert("Server error"));
    }

    const loadRooms = () => {
        axios.get("/api/v1/rooms/"+( location.state ? "filter/" + location.state.user.user_id:"")).then(result => {
            console.log(result);
            if (result.status === 200) {
                let roomsFromServer = result.data.data.map(r => {
                    let d = new Date(r.date);
                    let day = d.getDate()
                    let month = d.getMonth() + 1
                    let year = d.getFullYear();
                    let roomFromServer = { room_id: r.room_id, name: r.name, users: parseInt(r.usuarios), type: "Webinar", date: `${day}-${month}-${year}` };
                    return roomFromServer;
                });

                console.log(roomsFromServer);
                setRooms(roomsFromServer);
            }
        }).catch(error => alert("Server error"));
    }

    const createNewRoom = (roomName, roomMax) => {
        let date = new Date()
        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear();

        const payload = { active: true, date: new Date(), name: roomName, type: "Webinar", usuarios: roomMax, room_uuid: "params", user_id: location.state.user.user_id }
        axios.post("/api/v1/rooms/", payload).then(result => {
            console.log(result);
            if (result.status === 201) {
                console.log("room created");
                setRooms([...rooms, { room_id: result.data.data.room_id, name: roomName, users: roomMax, type: "Webinar", date: `${day}-${month}-${year}` }]);
            }
        }).catch(error => alert("Server error"));
    }

    return (
        <ThemeProvider theme={theme}>

            <div className={classes.mainBox}>
                {createRoom && <NewRoom toogleCreateNewSubRoom={toogleCreateNewSubRoom} createSubRoom={createNewRoom}></NewRoom>}
                {showLinks && <LinksRooms room_id={activeRoom} toogleShowLinks={toogleShowLinks}></LinksRooms>}

                <div className={classes.header}>
                    <div className={classes.logoBox}>
                        <img style={{
                            height: 8 + "em",
                            width: "auto"
                        }} src={logoEyeBee} />
                    </div>
                    <div className={classes.iconBox}>
                        <Avatar alt={location && location.state ? location.state.user.name : ""} src="/static/img/default-avatar.png" className={classes.large} />
                        <a className={classes.link} onClick={logout}>Logout</a>
                    </div>
                </div>
                <div className={classes.header}>
                    <div className={classes.logoBox}>
                        <h3 className={classes.title}>Rooms</h3>
                    </div>
                    <div className={classes.iconBox}>
                        <ThemeProvider theme={lightButton} >
                            <Button onClick={toogleCreateNewSubRoom} variant="contained"
                                color="primary" className={`${classes.roundedBtn} ${classes.roomActionBtn}`}
                            >New room</Button>
                        </ThemeProvider>
                    </div>
                </div>

                <div className={classes.header}>
                    <TableContainer className={classes.container} component={Paper}>
                        <Table aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>Name</StyledTableCell>
                                    <StyledTableCell align="right">Type</StyledTableCell>
                                    <StyledTableCell align="right">Users</StyledTableCell>
                                    <StyledTableCell align="right">Date</StyledTableCell>
                                    <StyledTableCell align="right"></StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rooms.map((room) => (
                                    <StyledTableRow key={room.name}>
                                        <StyledTableCell component="th" scope="row">
                                            {room.name}
                                        </StyledTableCell>
                                        <StyledTableCell align="right">{room.type}</StyledTableCell>
                                        <StyledTableCell align="right">{room.users}</StyledTableCell>
                                        <StyledTableCell align="right">{room.date}</StyledTableCell>
                                        <StyledTableCell align="right"> <ThemeProvider theme={lightButton} >
                                            <Button variant="contained"
                                                color="primary" className={`${classes.roundedBtn} ${classes.roomActionBtn}`}
                                                onClick={() => toogleShowLinks(room.room_id)} >Get Links</Button>
                                            <DeleteIcon onClick={() => deleteRoom(room.room_id)} style={{ color: "#767676" }} />
                                        </ThemeProvider></StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        </ThemeProvider>

    )
}

export default Rooms;