import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

// Connect to backend (Cloud Functions URL or local for dev)
const socket = io(import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000');

function Editor() {
  const [code, setCode] = useState('');
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) {
      // Fetch a new random room ID
      fetch(`${import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000'}/api/new`)
        .then((res) => res.json())
        .then((data) => {
          navigate(`/${data.roomId}`);
        })
        .catch((error) => console.error('Error fetching new room:', error));
      return;
    }

    // Join the room
    socket.emit('join-room', roomId);

    // Listen for loaded code
    socket.on('load-code', (loadedCode) => {
      setCode(loadedCode);
    });

    // Listen for real-time code changes
    socket.on('code-change', (newCode) => {
      setCode(newCode);
    });

    // Handle errors
    socket.on('error', (message) => {
      console.error('Socket error:', message);
    });

    // Cleanup socket listeners
    return () => {
      socket.off('load-code');
      socket.off('code-change');
      socket.off('error');
    };
  }, [roomId]);

  const handleChange = (value) => {
    setCode(value);
    socket.emit('code-change', { roomId, code: value });
  };

  return (
    <div style={{ height: '90vh', width: '97vw', margin: '10px auto', fontSize: '16px' }}>
      <h2 style={{ color: 'white', fontFamily: 'arial' }}>
        Socket Share: <code>{roomId || 'Loading...'}</code>
      </h2>
      <CodeMirror
        value={code}
        theme="dark"
        extensions={[javascript()]}
        onChange={(value) => handleChange(value)}
        height="85vh"
        style={{
          border: '1px solid #77777799',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: '10px 0px'
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:roomId?" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;
