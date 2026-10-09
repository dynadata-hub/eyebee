import { useEffect, useRef, useState } from "react";
import socketIOClient from "socket.io-client";
import config from './config';

const NEW_CHAT_MESSAGE_EVENT = "newmessage"; // Name of the event
const SOCKET_SERVER_URL = config.socketEndpoint;

const useChat = (roomId) => {
  const [messages, setMessages] = useState([]); // Sent and received messages
  const socketRef = useRef();

  useEffect(() => {
    
    // Creates a WebSocket connection
    socketRef.current = socketIOClient(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      query: { roomId },
    });
    
    // Listens for incoming messages
    socketRef.current.on(NEW_CHAT_MESSAGE_EVENT, (message) => {
      const incomingMessage = {
        ...message,
        ownedByCurrentUser: message.senderId === socketRef.current.id,
      };
      setMessages((messages) => [...messages, incomingMessage]);
    });
    
    // Destroys the socket reference
    // when the connection is closed
    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  // Sends a message to the server that
  // forwards it to all users in the same room
  const sendMessage = (messageBody) => {
    socketRef.current.emit(NEW_CHAT_MESSAGE_EVENT, {
      body: messageBody,
      senderId: socketRef.current.id,
    });
  };

  return { messages, sendMessage };
};

export default useChat;