import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from "react-router-dom";
import axiosInstance from '../../helpers/axiosInstance';
import config from '../../configs/app';
import { useWebSocket } from '../../providers/WebSocketProvider';
import './chat.css';

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [draftMessage, setDraftMessage] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false); // For loading state of sending messages   
    const chatBodyRef = useRef(null);
    const { userId } = useParams();
    const location = useLocation();
    const displayName = location.state?.displayName || "User";
    const { ws } = useWebSocket();    
    const LIMIT = 25; // Default limit for fetching messages
    const [isScrolling, setIsScrolling] = useState(true);

    // Fetch chat conversations with limit and skip
    const fetchMessages = async (sort="recent") => {
        let messagesLength = messages.length;
        try {
            setMessageLoading(true);    
            let sortId = sort==="recent"?messages[(messagesLength-1)]?._id:messages[0]?._id;            
            const response = await axiosInstance.get(`${config.baseURL}/chat/conversations/${userId}`, {
                params: {                   
                    limit: LIMIT,
                    sort: sort,
                    sortId: sortId
                },
            });        
    
            // Fallback to an empty array if no messages are returned
            const fetchedMessages = response.data?.messages || [];
            if(response.data.draftMessage){  
                setDraftMessage(response.data.draftMessage); 
                if(response.data.draftMessage.message){
                    setNewMessage(response.data.draftMessage.message);
                } 
            }else{
                setDraftMessage(null);
            }
            if (fetchedMessages.length > 0) {
                setMessages((prevMessages) => {                 
                    if (messagesLength === 0) {
                        return fetchedMessages;
                    }
                    if(sort==="recent"){                                              
                        return [...prevMessages, ...fetchedMessages];
                    }else{                     
                        return [...fetchedMessages, ...prevMessages];
                    }                    
                });                  
            } else if (messagesLength === 0) {              
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {      
            if (messagesLength === 0) {           
                setTimeout(() => {  scrollToBottom();  }, 100);
            }      
            setMessageLoading(false);
        }
    };    
    

    // Send a message or file
    const sendMessage = async () => {
        if (!newMessage && (draftMessage.media_files?.length??0)==0) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('message', newMessage);        
        // if (selectedFile) { formData.append('file', selectedFile);   }
        try {
            const response = await axiosInstance.post(`${config.baseURL}/chat/send/${userId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessages((prev) => [...prev, response.data.message]);
            setNewMessage('');
            setSelectedFile(null);            
            setTimeout(() => {  scrollToBottom();  }, 100);
             
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };


   
    const sendFile = async (e) => {
        const files = e.target.files; 
        setSelectedFile(files);  
        if (!files || files.length === 0) return;          
        setLoading(true);
        const formData = new FormData();
        formData.append('userId', userId);        
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);  // Append each file with the key 'files'
        }              
        try {
            await axiosInstance.post(`${config.baseURL}/chat/send/${userId}/draft`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });   
            e.target.value = null;       
            setSelectedFile(null);  // Clear the selected file after sending
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);  
            e.target.value = null;       
            setSelectedFile(null);
        }
    };
    


    // Scroll to the bottom of the chat body    
    const scrollToBottom = () => {
        setIsScrolling(true);  // Disable scroll handler      
        const chatBody = chatBodyRef.current;
        if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight; // Scrolls to the bottom
        }
        
        // Reset the flag after the scroll is completed
        setTimeout(() => {
            setIsScrolling(false);
        }, 600);  // Time should match the scroll behavior duration
    };

    // Detect when the user scrolls to the bottom 
    const handleScroll = (() => {    
        if (isScrolling) return;
        let throttleTimeout = null; // To manage throttling
    
        return () => {
            const chatBody = chatBodyRef.current;
            if (!chatBody) return;
    
            // Throttling logic
            if (throttleTimeout) return;
    
            throttleTimeout = setTimeout(() => {
                throttleTimeout = null; // Reset throttle timeout      
                if(!messageLoading){      
                    if (chatBody.scrollTop === 0) {      // Fetch Previous           
                        fetchMessages("previous");  // Uncomment to fetch messages
                    }else if (chatBody.scrollHeight === chatBody.scrollTop + chatBody.clientHeight) {
                        fetchMessages();
                    }
                }
            }, 500); // Throttle interval (1 second)
        };
    })();

    // Handle WebSocket incoming messages
    const handleNewMessage = (data) => {
        console.log("New message from WebSocket:", data);
        if(!messageLoading){  
         fetchMessages(); 
        }
        // setMessages((prev) => [...prev, data.message]);
    };

    useEffect(() => {
        if(!messageLoading){ fetchMessages();  }          
        if (ws) {
            ws.on('new-message', handleNewMessage);
        }
        // Cleanup WebSocket listener on unmount
        return () => {
            if (ws) {
                ws.off('new-message', handleNewMessage);
            }
        };
    }, [userId, ws]);

    // useEffect(() => {      
    //     scrollToBottom();      
    // }, [messages]);

    // useLayoutEffect(() => {
    //     if (skip === 0) {
    //         scrollToBottom();
    //     }
    // }, [messages]);

    return (
        <div className="container">
            <div className="chat-screen card">
                {/* Header */}
                <div className="chat-header card-header">
                    <h3>{displayName}</h3>
                </div>

                {/* Chat Body */}
                <div className="chat-body" ref={chatBodyRef} onScroll={handleScroll}>
                    {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.receiver_id === userId ? 'other' : 'self'}`}>
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
                </div>

            
                <div className='draft-message'>
                    {draftMessage?.media_files?.map((fileObj, index) => (
                        <div key={index} className='file-temp'>
                            {fileObj.filename ? (
                                fileObj.mimeType?.startsWith('image') ? (
                                    <img
                                        src={fileObj.preview}
                                        alt={fileObj.filename}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <video
                                        src={fileObj.preview}
                                        controls
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                )
                            ) : (
                                <div>
                                    <p>{fileObj.filename}</p>
                                    <p>{fileObj.mimeType === "application/pdf" ? "PDF File" : "Unsupported Type"}</p>
                                </div>
                            )}
                        
                            <button className="close-btn" aria-label="Close" type="button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                                    <path d="M12.854 1.146a1 1 0 0 1 0 1.414L9.414 6l3.44 3.44a1 1 0 0 1-1.415 1.415L8 7.414l-3.44 3.44a1 1 0 0 1-1.415-1.415L6.586 6 3.146 2.56a1 1 0 0 1 1.415-1.415L8 4.586l3.44-3.44a1 1 0 0 1 1.414 0z"/>
                                </svg>
                            </button>

                        </div>
                    ))}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <input
                        type="file"
                        onChange={sendFile}
                        style={{ display: 'none' }}
                        id="fileInput"
                    />
                    {/* <label htmlFor="fileInput" className="attach-button">📎</label> */}
                    <button onClick={sendMessage} disabled={loading}>
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatScreen;
