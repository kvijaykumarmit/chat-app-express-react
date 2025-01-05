import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from "react-router-dom";
import axiosInstance from '../../helpers/axiosInstance';
import config from '../../configs/app';
import './chat.css';


const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const chatBodyRef = useRef(null);
    const { userId } = useParams();
    const location = useLocation();
    const displayName = location.state?.displayName || "User";


    // Fetch chat conversations
    const fetchMessages = async () => {
        try {
            const response = await axiosInstance.get(`${config.baseURL}/chat/conversations/${userId}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Send a message or file
    const sendMessage = async () => {
        if (!newMessage && !selectedFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('message', newMessage);
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        try {
            const response = await axiosInstance.post(`${config.baseURL}/chat/send/${userId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setMessages((prev) => [...prev, response.data.message]);
            setNewMessage('');
            setSelectedFile(null);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    // Scroll to the bottom of the chat body
    const scrollToBottom = () => {
        chatBodyRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMessages();
        scrollToBottom();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="chat-screen">
            {/* Header */}
            <div className="chat-header">
                <h3>{displayName}</h3>
            </div>

            {/* Chat Body */}
            <div className="chat-body">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.user_id === userId ? 'self' : 'other'}`}>
                        {msg.mediaUrl ? (
                            msg.mediaType === 'image' ? (
                                <img src={msg.mediaUrl} alt="attachment" className="chat-media" />
                            ) : (
                                <video src={msg.mediaUrl} controls className="chat-media" />
                            )
                        ) : (
                            <p>{msg.message}</p>
                        )}
                    </div>
                ))}
                <div ref={chatBodyRef}></div>
            </div>

            {/* Chat Input */}
            <div className="chat-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="fileInput"
                />
                <label htmlFor="fileInput" className="attach-button">
                    📎
                </label>
                <button onClick={sendMessage} disabled={loading}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatScreen;
