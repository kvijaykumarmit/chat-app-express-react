import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import ProtectedRoute from './ProtectedRoute';

import './App.css';
import Login from './pages/login/Login';
import ChatUsersList from './pages/chat_users/ChatUsersList';
import ChatScreen from './pages/chat/ChatScreen';

const PageNotFound = ()=>(<h1>PageNotFound</h1>);

const Chat = ()=>(<h1>Welcome to chat page</h1>);

function App() {
  return (<AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<ProtectedRoute element={<ChatUsersList />} />} /> 
        <Route path="/conversations/:userId" element={<ProtectedRoute element={<ChatScreen />} />} />     
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>  
  </AuthProvider>);
}
export default App;
