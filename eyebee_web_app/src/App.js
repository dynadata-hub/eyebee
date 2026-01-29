import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import VideoConference from "./VideoConference";
import Login from "./Authentication/login";
import Rooms from "./Rooms/Rooms";
import NewUser from "./Authentication/NewUser";
import LandingPage from "./LandingPage/LandingPage";

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={LandingPage} />
        <Route exact path="/videocall/:roomId" component={VideoConference} />
        <Route exact path="/admin/login" component={Login} />
        <Route exact path="/admin" component={Login} />
        <Route exact path="/admin/rooms" component={Rooms} />
        <Route exact path="/admin/newUser" component={NewUser} />
        {/* <Route exact path="/videocall/:roomId" component={Room} /> */}
      </Switch>
    </Router>
  );
}

export default App;