import React from "react";

import { createTheme, adaptV4Theme } from '@mui/material/styles';
import {grey,red } from '@mui/material/colors';


const darkFormField = createTheme(adaptV4Theme({
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
}));

export default darkFormField;