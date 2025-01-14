import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { io } from 'socket.io-client';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null); 
  const { user } = useAuth();

  useEffect(() => {
    let socket;

    if (user) {
      console.log("socket connected");
      // Initialize the WebSocket connection when the user is available
      socket = io('http://localhost:4000', { withCredentials: true });
      setWs(socket);

      // Listen for incoming messages
      socket.on('receive_message', (data) => {
        console.log('Message received:', data);
      });
    }

    // Cleanup on unmount or when user changes
    return () => {
      if (socket) {
        console.log("socket disconnected")
        socket.disconnect();
      }
    };
  }, [user]);  // Re-run the effect when `user` changes

  // Return the context provider to wrap the app
  return (
    <WebSocketContext.Provider value={{ ws }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context in components
export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
