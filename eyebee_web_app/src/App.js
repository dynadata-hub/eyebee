import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoConference from "./VideoConference";
import Login from "./Authentication/login";
import Rooms from "./Rooms/Rooms";
import NewUser from "./Authentication/NewUser";
import LandingPage from "./LandingPage/LandingPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/videocall/:roomId" element={<VideoConference />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/rooms" element={<Rooms />} />
        <Route path="/admin/newUser" element={<NewUser />} />
      </Routes>
    </Router>
  );
}

export default App;
