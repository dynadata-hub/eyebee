import React, { useState, useEffect, useCallback } from "react";
import { makeStyles, createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import logoEyeBee from "../img/logo_eyebee_fondo_negrov2.jpg";
import ImageIcon from '@material-ui/icons/Image';
import { Input, Button, CssBaseline, InputAdornment, Box, InputLabel, IconButton, TextField, useMediaQuery, Select, MenuItem } from "@material-ui/core";
import axios from "axios"

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
    logoBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        margin: "1em 0"
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
        minWidth: "7em",
        fontSize: "1.2em"
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


const Login = props => {

    const xsScreen = useMediaQuery(theme.breakpoints.up("xs"));
    const mdScreen = useMediaQuery(theme.breakpoints.up("md"));
    const lgScreen = useMediaQuery(theme.breakpoints.up("lg"));
    const classes = useStyles();
    const [logoSize, setLogoSize] = useState(0);
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");


    const usernameChanged = (e) => {
        setUserName(e.target.value);
    }

    const passwordChanged = (e) => {
        setPassword(e.target.value);
    }

    const getPlayerSize = (userType) => {
        let size = 150;
        let logoSize = 8;

        if (mdScreen) {
            size = 150;
            logoSize = 10;

        }

        if (lgScreen) {
            size = 150;
            logoSize = 12;
        }

        return {
            playerSize: size,
            logoSize: logoSize
        };

    }

    useEffect(() => {
        let a = getPlayerSize("owner");
        setLogoSize(a.logoSize);
    }, [xsScreen, mdScreen, lgScreen]);

    const login = () => {
        //Todo Login
        const payload = { name: userName, password: password }
        axios.post("https://livelatency.com/api/v1/user/login", payload).then(result => {
            console.log(result);
            if (result.status === 200) {
                localStorage.setItem("auth", true);
                props.history.push({ pathname: '/admin/rooms', state: { user: result.data.data } });
            }
            else
                alert("Usuario o contraseña incorrecta");
        }).catch(error => alert("Incorrect user or password"));

    }



    return (
        <ThemeProvider theme={theme}>

            <div className={classes.mainBox}>
                <div className={classes.logoBox}>
                    <img style={{
                        height: logoSize + "em",
                        width: "auto"
                    }} src={logoEyeBee} />
                </div>


                <ThemeProvider theme={darkFormField} >

                    <form autoComplete="on" >
                        <div className={classes.mediaSelectionBox}>
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                className={classes.userNameField}
                                inputProps={{ style: { textAlign: 'center' } }}
                                value={userName}
                                variant="filled"
                                autoComplete="username" label="User" placeholder="bee"
                                onChange={usernameChanged} />

                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                className={classes.userNameField}
                                inputProps={{ style: { textAlign: 'center' } }}
                                value={password}
                                variant="filled"
                                type="password"
                                autoComplete="username" label="Password" placeholder="****"
                                onChange={passwordChanged} />

                        </div>
                    </form>

                    <ThemeProvider theme={lightButton} >
                        <Button onClick={login} variant="contained"
                            color="primary" className={`${classes.roundedBtn} ${classes.roomActionBtn}`}
                        >Login</Button>
                    </ThemeProvider>

                </ThemeProvider>


            </div>
        </ThemeProvider>

    )
}

export default Login;