import React from "react";

import {createTheme } from '@material-ui/core/styles';
import {grey,red } from '@material-ui/core/colors';


const darkFormField = createTheme({
    palette: {
        background: {
            default: "#101010",
            paper: "#101010"
        },
        primary: {
            main:"#fafafa",
            

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

export default darkFormField;