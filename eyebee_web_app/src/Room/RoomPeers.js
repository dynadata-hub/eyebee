import React, { useState,useEffect,memo} from "react";
import { makeStyles,ThemeProvider,useTheme,createMuiTheme } from '@material-ui/core/styles';
import HexagonalAvatarWidget from "../HexagonalAvatarWidget";
import PeerListItem from "../PeerListItem";
import {MoreVert, PanTool,VideocamOff,Videocam,Mic,MicOff} from "@material-ui/icons";

import "./RoomPeers.css";
import { CssBaseline,IconButton,Menu,MenuItem } from "@material-ui/core";
//optimizations for later
import {FixedSizeList as List,areEqual} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import memoize from "memoize-one";



const darkFormField = createMuiTheme({
  palette:{
      background:{
          default: "#212121",
          paper:"#212121"
      },
      primary: {
          main: "#fafafa",
          contrastText:"#424242"
         
      },
      secondary:{
          main:"#fafafa",
          contrastText:"#424242"
      },
      text:{
          primary:"#fafafa",
          secondary:"#424242"
      },
      action:{
          disabled:"#ffe082",
          disabledBackground:"#ffe082",
          hover: "#F29F39"
      }
  }
});

const useStyles = makeStyles(theme => ({
  mainBox:{
    display:"flex",
    flexDirection:"column",
    alignItems:"flex-start",
    justifyContent:"flex-start",
    backgroundColor: theme.palette.background.default,
    flex:"2",
    width:"100%"
  },
  separator:{
    paddingLeft:"1em",
    width:"100%",
    color: theme.palette.secondary.contrastText
  },
  list:{
    display: "flex",
    flexDirection: "column",
    flex:"2",
    padding:"0.5em",
    width:"100%",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: theme.palette.lighterBg.main
  },
  listItem:{
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width:"100%",
    padding:"0.5em",
    backgroundColor: theme.palette.lighterBg.main
  },
  listItemBox:{
    display: "flex",
    padding:"0.5em 1em 1em 1em",
    alignItems: "center",
    justifyContent: "flex-start",
    width:"100%",
    backgroundColor: theme.palette.lighterBg.main
  },
  actionBtn:{
      textTransform:"none",
      [theme.breakpoints.up('md')]: {
          fontSize: "0.7em" 
      },
      [theme.breakpoints.down('sm')]: {
          fontSize: "0.7em" 
      }
  }
}));


const ListRow = memo(({data,index,style}) => {
  const theme = useTheme(); 
  const classes = useStyles();
  const {items,isOwner,userId,toggleMenu,handlePresentationRequest} = data; 
  const item = items[index];
  
  return (
      <div style={style}>
        <div className={classes.listItem} >
          <PeerListItem avatar={<HexagonalAvatarWidget background={item.presenter ? "primary" : "secondary"} />}  label={item.userName} >
              <p>{item.mic}</p>
              {
                !item.presenter ?
                (
                  <IconButton color="secondary" 
                  className={classes.actionBtn}
                  style={{...theme.actionBtn,
                    pointerEvents: !isOwner ? "none" : "initial",
                      backgroundColor:"transparent",
                      color: item.presentationRequested ?  theme.palette.primary.main : theme.palette.secondary.contrastText
                  }} 
                  
                    onClick={e => handlePresentationRequest(e,item)}> 
                      <PanTool style={theme.defaultIcon} />
                  
                  </IconButton>
                )
                :
                (<div/>)
              }



              <IconButton 
                color={
                  item.camera ?
                  "primary" : "secondary"} 
                  className={classes.actionBtn}
                  style={{...theme.actionBtn,
                    pointerEvents: !isOwner ? "none" : "initial",
                      backgroundColor:"transparent"
                  }}
                >
                {
                    item.camera ?
                    (
                        <Videocam style={theme.defaultIcon} />
                    )
                    :
                    (
                        <VideocamOff style={theme.defaultIcon} />
                    )
                }
              </IconButton>

              {
                  item.presenter ?
                  (
                      <IconButton color={item.mic ? "primary" : "secondary"} 
                      className={classes.actionBtn}
                      
                      > 
                          {
                              item.mic ?
                              (
                                  <Mic style={theme.defaultIcon} />
                              )
                              :
                              (
                                  <MicOff style={theme.defaultIcon} />
                              )
                          }
                      
                      </IconButton>
                  )
                  :
                  (
                      <div/>
                  )
              }
              
              <IconButton color="secondary" 
              className={classes.actionBtn}
              style={{...theme.actionBtn,
                  fontSize:"0.8em",
                  display: !isOwner ? "none":"initial",
                  visibility: isOwner && userId === item.id ? "hidden" : "visible",
                  backgroundColor:"transparent",
                  color: theme.palette.secondary.contrastText
              }} 
              
                onClick={e => toggleMenu(e,item)}> 
                  <MoreVert style={theme.defaultIcon} />
              
              </IconButton>
          </PeerListItem>
        </div>
      </div>
    
  )
},areEqual);


const createItemData = memoize((items,isOwner,userId,toggleMenu,handlePresentationRequest) => ({
  items: items,
  isOwner:isOwner,
  userId:userId,
  toggleMenu:toggleMenu,
  handlePresentationRequest:handlePresentationRequest
}));

const RoomPeers = (props) => {
  const theme = useTheme();
  const classes = useStyles();
  const { roomId,peerId,joined } = props;
  const [peers, setPeers] = useState([]);
  const [moderator, setModerator] = useState(null);
  const [presenters, setPresenters] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [spectatorAnchorEl, setSpectatorAnchorEl] = useState(null);
  const [presReqAnchorEl, setPresReqAnchorEl] = useState(null);

  const timeout = millis => {
   return new Promise((resolve,reject) => {
      setTimeout(() => {
        resolve();
      },millis || 100);
    });
  }

  const generateSampleUserList = async () => {

    //let peers = [{"id":106.96365974167831,"userName":"user-106.96365974167831","presenter":false,"owner":false},{"id":571.5109058375963,"userName":"user-571.5109058375963","presenter":true,"owner":false},{"id":336.8614758723576,"userName":"user-336.8614758723576","presenter":false,"owner":false},{"id":859.8258609125245,"userName":"user-859.8258609125245","presenter":true,"owner":false},{"id":342.7246648889839,"userName":"user-342.7246648889839","presenter":false,"owner":false},{"id":41.22430140825828,"userName":"user-41.22430140825828","presenter":false,"owner":false},{"id":872.0027813885531,"userName":"user-872.0027813885531","presenter":true,"owner":false},{"id":939.4173798136522,"userName":"user-939.4173798136522","presenter":true,"owner":false},{"id":70.14158307516038,"userName":"user-70.14158307516038","presenter":false,"owner":false},{"id":607.8403564505948,"userName":"user-607.8403564505948","presenter":true,"owner":false},{"id":829.1696748557564,"userName":"user-829.1696748557564","presenter":true,"owner":false},{"id":132.6597249913084,"userName":"user-132.6597249913084","presenter":false,"owner":false},{"id":271.7734203379352,"userName":"user-271.7734203379352","presenter":false,"owner":false},{"id":184.52874354711236,"userName":"user-184.52874354711236","presenter":false,"owner":false},{"id":396.16347093666127,"userName":"user-396.16347093666127","presenter":false,"owner":false},{"id":741.2439545545504,"userName":"user-741.2439545545504","presenter":true,"owner":false},{"id":510.19398598270425,"userName":"user-510.19398598270425","presenter":true,"owner":false},{"id":332.9438466569883,"userName":"user-332.9438466569883","presenter":false,"owner":false},{"id":691.0497431219185,"userName":"user-691.0497431219185","presenter":true,"owner":false},{"id":931.991701603897,"userName":"user-931.991701603897","presenter":true,"owner":false},{"id":809.7239216833641,"userName":"user-809.7239216833641","presenter":true,"owner":false},{"id":916.3661949787245,"userName":"user-916.3661949787245","presenter":true,"owner":false},{"id":783.982864318913,"userName":"user-783.982864318913","presenter":true,"owner":false},{"id":471.1962167741734,"userName":"user-471.1962167741734","presenter":false,"owner":false},{"id":219.88338620819837,"userName":"user-219.88338620819837","presenter":false,"owner":false}];
    
    
    let peers = [];
    for(let i=0; i< 250 ; i++){
      let rand = Math.ceil(Math.random()*1000);
      let pr = rand >= 500 ;
      
      peers.push({
        id: rand,
        userName: "user-"+rand,
        presenter: pr,
        owner : false

      })
      await timeout(100);
    }
    //console.log(JSON.stringify(peers));
    return peers;

  }

  useEffect(() => {

    const keys = Object.keys(props.peers);
    
    let peers = [];
    keys.forEach(e => {
      peers.push(props.peers[e]);
    });
    // generateSampleUserList().then(uList => {
      
    //   let ps = peers.concat(uList);
      
    //   setPresenters(ps.filter(p => {return p.presenter}));
    //   setSpectators(ps.filter(p => {return !p.owner && !p.presenter;}));
    //   let mod = ps.filter(p => {return p.owner});
    //   mod = mod[0];
    //   setModerator(mod);

    // });
    //console.log("se modificó otra vez la lista de peers",{p:props.peers,peers:peers});
    setPresenters(peers.filter(p => {return p.presenter}));
    setSpectators(peers.filter(p => {return !p.owner && !p.presenter;}));
    let mod = peers.filter(p => {return p.owner});
    mod = mod[0];
    setModerator(mod);

   
    // setOwner(peers.filter(p => { return p.owner})[0]);

  },[props.peers]);

  useEffect(() => {

    //console.log("el valor de remoteStreams");
    Object.keys(props.remoteStreams).forEach(p => {
      let stream = props.remoteStreams[p][Object.keys(props.remoteStreams[p])[0]];
      //console.log("el track de video de "+p,{track: stream.getVideoTracks()});
    });

  },[props.remoteStreams]);

  const handlePresentationRequest = e => {
    console.log("toco presentatonRequest");
  }

  const toggleMenu = (e,peer) => {
    setSelectedPeer(peer);
    //console.log("en toogle presenter menu");
    setAnchorEl(e.currentTarget);

  }

  const toggleSpectatorMenu = (e,peer) => {
    setSelectedPeer(peer);
    console.log("en toogle spectator menu");
    setSpectatorAnchorEl(e.currentTarget);
  }

  const togglePresReqMenu = (e,peer) => {
    setSelectedPeer(peer);
    console.log("en toogle pres req menu");
    setPresReqAnchorEl(e.currentTarget);
  }

  const handleClose = () => {
    console.log("se sale del resenter menu");
    setSelectedPeer(null);
    setAnchorEl(null);
    setSpectatorAnchorEl(null);
    setPresReqAnchorEl(null);
  }

  const removePresentation = () => {
    console.log("removiendo presentacion del peer ",{peer:selectedPeer});
    props.removePresentation(selectedPeer.id);
    handleClose();
  }

  const assignAsPresenter = () => {
    console.log("asignando presentacion al peer ",{peer:selectedPeer});
    props.grantPresentation(selectedPeer.id);
    handleClose();
  }

  const expel = () => {
    console.log("echando al peer ",{peer:selectedPeer});
    handleClose();
  }

  const mutePeer = () => {
    console.log("poniendo en mute al peer ",{peer:selectedPeer});
    handleClose();
  }

  const sendMessage = () => {
    console.log("enviando mensaje al peer ",{peer:selectedPeer});
    handleClose();
  }


  const acceptAsPresenter = () => {
    console.log("aceptando como  presentador al peer ",{peer:selectedPeer});
    props.grantPresentation(selectedPeer.id);
    handleClose();
  }

  const rejectAsPresenter = () => {
    //console.log("rechazando presentacion al peer ",{peer:selectedPeer});
    props.removePresentation(selectedPeer.id);
    handleClose();
  }

  const presenterListData = createItemData(presenters,props.owner,props.userId,toggleMenu);
  const spectatorListData = createItemData(spectators,props.owner,props.userId,toggleSpectatorMenu,togglePresReqMenu);
  return (
    <ThemeProvider theme={theme} >
      <CssBaseline/>
      <div className={classes.mainBox}>
        <div className={classes.listItemBox}>
            <div className={classes.listItem}>
              
              <PeerListItem avatar={<HexagonalAvatarWidget background="primary" />}  label={moderator ? moderator.userName+" (Moderator)":"(Moderator)"} >
              </PeerListItem>
              
            </div>
        </div>
        

        <div className={classes.separator}>
          <p>Presenters</p>
        </div>
        <div className={classes.list}>

          {
            presenters && presenters.length === 0 ? 
            (
              <div className="room-peers-item">
                  <p className="room-peers-name">No Presenters</p>
                </div>  
            )
            :
            (
              <div/>
            )
          }

          {
            presenters && presenters.length > 0 ? 
            (
              <div style={{
                width:"100%",
                flex:"2"
              }}>
                <AutoSizer>
                  {
                    ({height, width}) => (
                      <List height={height}
                      itemCount={presenters.length}
                      itemData={presenterListData}
                      itemSize={70}
                      width={width}>
                          {ListRow}
                      </List>
                    )
                  }
                </AutoSizer>
              </div>
            )
            :
            (
              <div/>
            )
          }



        </div>

          
        {/* <div className={classes.list}>

          {
            peers && peers.length === 0 ? 
            (
              <div className="room-peers-item">
                  <p className="room-peers-name">No Presenters</p>
                </div>  
            )
            :
            (
              <div/>
            )
          }
          
          {
            peers && peers.length > 0 && peers.filter(p => {
              return p.presenter;
            }).map( peer => {
              return (
                <div key={peer.id} className={classes.listItem}>
                  <PeerListItem avatar={<HexagonalAvatarWidget background="primary" />}  label={peer.userName} >
                      <IconButton color="secondary" 
                      className={classes.actionBtn}
                      style={{...theme.actionBtn,
                          fontSize:"0.8em",
                          display: !props.owner ? "none":"initial",
                          backgroundColor:"transparent",
                          color: theme.palette.secondary.contrastText
                      }} 
                      
                        onClick={e => toggleMenu(e,peer)}> 
                          <MoreVert style={theme.defaultIcon} />
                      
                      </IconButton>
                  </PeerListItem>
                </div>


                // <div key={peer.id} className="room-peers-item">
                //   <p className="room-peers-name">{peer.userName} {peer.owner ? "(Moderador)" : ""}</p>
                // </div>
              )
            })
          }

        </div> */}
        <div className={classes.separator}>
          <p>Participants</p>
        </div>
        <div className={classes.list}>
            {
            spectators && spectators.length === 0 ? 
              (
                <div className="room-peers-item">
                  <p className="room-peers-name">No Participants</p>
                </div>  
              )
              :
              (
                <div/>
              )
            }

            {
                spectators && spectators.length > 0 ? 
                (
                <div style={{
                width:"100%",
                flex:"2"
                }}>
                  <AutoSizer>
                    {
                      ({height, width}) => (
                        <List height={height}
                        itemCount={spectators.length}
                        itemData={spectatorListData}
                        itemSize={70}
                        width={width}>
                            {ListRow}
                        </List>
                      )
                    }
                  </AutoSizer>
                </div>  
              )
              :
              (
                <div/>
              )
            }

        </div>
        {/* <div className={classes.list}>

          {
            peers && peers.length === 0 ? 
            (
              <div className="room-peers-item">
                <p className="room-peers-name">No Participants</p>
              </div>  
            )
            :
            (
              <div/>
            )
          }

          {
            peers && peers.length > 0 && peers.filter(p => {
              return !p.owner && !p.presenter;
            }).map( peer => {
              return (
                <div key={peer.id} className={classes.listItem}>
                  <PeerListItem avatar={<HexagonalAvatarWidget background="secondary" />}  label={peer.userName} >

                    
                    <IconButton disabled={!props.owner && peer.id !== props.userId} color="secondary" 
                    className={classes.actionBtn}
                    style={{...theme.actionBtn,
                        backgroundColor:"transparent",
                        color: peer.presentationRequested ?  theme.palette.primary.main : theme.palette.secondary.contrastText
                    }} 
                    
                      onClick={handlePresentationRequest}> 
                        <PanTool style={theme.defaultIcon} />
                    
                    </IconButton>


                    <IconButton disabled={!props.owner} 
                    color={
                          peer.camera ?
                      "primary" : "secondary"} 
                      className={classes.actionBtn}

                     >
                      {
                          peer.camera ?
                          (
                              <Videocam style={theme.defaultIcon} />
                          )
                          :
                          (
                              <VideocamOff style={theme.defaultIcon} />
                          )
                      }
                        
                    </IconButton>

                    <IconButton color="secondary" 
                      className={classes.actionBtn}
                      style={{...theme.actionBtn,
                          fontSize:"0.8em",
                          display: !props.owner ? "none":"initial",
                          backgroundColor:"transparent",
                          color: theme.palette.secondary.contrastText
                      }} 
                      
                        onClick={e => toggleSpectatorMenu(e,peer)}> 
                          <MoreVert style={theme.defaultIcon} />
                      
                    </IconButton>
                  </PeerListItem>
                </div>
              )
            })
          }

        </div> */}
        <ThemeProvider theme={darkFormField} >
          <Menu
            color="primary"
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={removePresentation}>Remove Presentation</MenuItem>
            <MenuItem onClick={mutePeer}>Mute</MenuItem>
            <MenuItem onClick={sendMessage}>Send Message</MenuItem>
          </Menu>


          <Menu
            color="primary"
            id="simple-menu"
            anchorEl={spectatorAnchorEl}
            keepMounted
            open={Boolean(spectatorAnchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={assignAsPresenter}>Assign as presenter</MenuItem>
            <MenuItem onClick={expel}>Expel</MenuItem>
            <MenuItem onClick={sendMessage}>Send Message</MenuItem>
          </Menu>


          <Menu
            color="primary"
            id="simple-menu"
            anchorEl={presReqAnchorEl}
            keepMounted
            open={Boolean(presReqAnchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={acceptAsPresenter}>Accept</MenuItem>
            <MenuItem onClick={rejectAsPresenter}>Reject</MenuItem>
          </Menu>

        </ThemeProvider>
        

      </div>
    </ThemeProvider>

  );
};

export default RoomPeers;