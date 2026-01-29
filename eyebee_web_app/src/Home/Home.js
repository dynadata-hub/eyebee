import React from "react";
import { Link } from "react-router-dom";

import "./Home.css";

const Home = () => {
  const [roomName, setRoomName] = React.useState("");
  const [isPresenter,setIsPresenter] = React.useState(false);
  const [isOwner,setIsOwner] = React.useState(false);

  const handleRoomNameChange = (event) => {
    setRoomName(event.target.value);
  };

  const [peerId, setPeerId] = React.useState("");

  const handlePeerIdChange = (event) => {
    setPeerId(event.target.value);
  };

  const handleIsPresenterChange = (event) => {
    setIsPresenter(event.target.checked);
  };

  const handleIsOwnerChange = (event) => {
    setIsOwner(event.target.checked);
    console.log("cheled? "+event.target.checked);
    setIsPresenter(event.target.checked);
  };

  return (
    <div className="home-container">
      <input
        type="text"
        placeholder="Room"
        value={roomName}
        onChange={handleRoomNameChange}
        className="text-input-field"
      />

      <input
        type="text"
        placeholder="PeerId"
        value={peerId}
        onChange={handlePeerIdChange}
        className="text-input-field"
      />

      <p>
      <input
        type="checkbox"
        value={isOwner}
        onChange={handleIsOwnerChange}
        className="text-input-field"
      />
      entrar como Owner?
      </p>

      <p>
      <input
        type="checkbox"
        value={isPresenter}
        onChange={handleIsPresenterChange}
        className="text-input-field"
      />
      entrar como presentador?
      </p>


      


      <Link to={`/${roomName}?peer_id=${peerId}&owner=${isOwner}&presenter=${isPresenter}`} className="enter-room-button">
        Entrar
      </Link>
    </div>
  );
};

export default Home;