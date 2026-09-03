import React,{useEffect, useState} from "react";

import { ThemeProvider, StyledEngineProvider, useTheme, createTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import {CssBaseline,Tabs,Tab,useMediaQuery} from "@mui/material";

const FilledTabs = withStyles({
    indicator: {
      display: 'flex',
      justifyContent: 'center',
      display:"none",
      padding:"0.5em"
    },
  })((props) => <Tabs {...props}  />);



const FilledTab = withStyles((theme) => ({
  root: {
    textTransform: 'none',
    color: '#fff',
    minWidth:"9em",
    padding:"0.5em 0",
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightRegular,
    transition: "background-color 0.2s ease-in-out",
    border: "0.3em solid "+theme.palette.background.default,
    borderRadius:"0.5em",
    '&:focus': {
      opacity: 1,
    },
  },
  selected:{
    backgroundColor: theme.palette.action.selected
  }
}))((props) => <Tab disableRipple {...props} />);

const FilledTabsWidget = (props) => {
    const theme = useTheme();
    const [value,setValue] = useState(0);
    const xsScreen = useMediaQuery(theme.breakpoints.down('sm'));


    const handleChange = (e,value) => {
        console.log("tab seleted",{e:e});
        setValue(value);
        if(props.onTabChanged){
          props.onTabChanged(value);
        }
        
    }

    useEffect(() => {
      setValue(props.value);
    },[props.value]);

    return (
        <StyledEngineProvider injectFirst>
            (<ThemeProvider theme={theme} >
                <CssBaseline/>
                <div style={{
                    display:"flex",
                    justifyContent:"center",
                    width:"100%"
                }}>
                  
                    <FilledTabs 
                    variant="scrollable"
                    indicatorColor="primary" scrollButtons={xsScreen  ? "on" : "off"} style={{
                     
                      backgroundColor: theme.palette.background.default,
                      borderRadius: "0.3em"
                    }} value={value} onChange={handleChange} aria-label="filled tabs">
                        {
                            props.options && props.options.map((op,index) => {
                                return (
                                    <FilledTab key={index} label={op} />
                                )
                            })
                        }
                    </FilledTabs>
                    
                </div>
            </ThemeProvider>)
        </StyledEngineProvider>
    );
};

export default FilledTabsWidget;