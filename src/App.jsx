import React, { useEffect, useState, useRef } from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    useNavigate,
    useParams,
} from "react-router-dom";
import io from "socket.io-client";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";

const socket = io(
    import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5000"
);
const themes = {
    ocean: EditorView.theme({
        "&": { backgroundColor: "#1e3a5f", color: "#d1e8ff" }, 
        ".cm-scroller": { backgroundColor: "#1e3a5f" }, 
        ".cm-content": { backgroundColor: "#1e3a5f", caretColor: "#00bcd4" ,caretWidth:"5px" }, 
        ".cm-selectionBackground": { backgroundColor: "#3b82f6" },
        ".cm-activeLine": { backgroundColor: "#2a4365" },
        ".cm-keyword": { color: "#ff6f61" },
        ".cm-variableName": { color: "#ffd54f" },
        ".cm-function": { color: "#4caf50" },
        ".cm-string": { color: "#81c784" },
    }, { dark: true }),

    midnight: EditorView.theme({
        "&": { backgroundColor: "#121212", color: "#e0e0e0" },
        ".cm-scroller": { backgroundColor: "#121212" },
        ".cm-content": { backgroundColor: "#121212", caretColor: "#bb86fc" },
        ".cm-selectionBackground": { backgroundColor: "#3700b3" },
        ".cm-activeLine": { backgroundColor: "#1f1f1f" },
        ".cm-keyword": { color: "#03dac6" },
        ".cm-variableName": { color: "#cf6679" },
        ".cm-function": { color: "#bb86fc" },
        ".cm-string": { color: "#ffb74d" },
    }, { dark: true }),

    lavender: EditorView.theme({
        "&": { backgroundColor: "#f3e5f5", color: "#4a148c" },
        ".cm-scroller": { backgroundColor: "#f3e5f5" },
        ".cm-content": { backgroundColor: "#f3e5f5", caretColor: "#7b1fa2" },
        ".cm-selectionBackground": { backgroundColor: "#ce93d8" },
        ".cm-activeLine": { backgroundColor: "#e1bee7" },
        ".cm-keyword": { color: "#ab47bc" },
        ".cm-variableName": { color: "#8e24aa" },
        ".cm-function": { color: "#6a1b9a" },
        ".cm-string": { color: "#ba68c8" },
    }, { dark: false }),
    dracula: EditorView.theme({
        "&": { backgroundColor: "#282a36", color: "#f8f8f2" },
        ".cm-scroller": { backgroundColor: "#282a36" },
        ".cm-content": { backgroundColor: "#282a36", caretColor: "#ff79c6" },
        ".cm-selectionBackground": { backgroundColor: "#44475a" },
        ".cm-activeLine": { backgroundColor: "#3d3f4b" },
        ".cm-keyword": { color: "#ff79c6" },
        ".cm-variableName": { color: "#50fa7b" },
        ".cm-function": { color: "#8be9fd" },
        ".cm-string": { color: "#f1fa8c" },
    }, { dark: true }),

    solarizedLight: EditorView.theme({
        "&": { backgroundColor: "#fdf6e3", color: "#2aa198" },
        ".cm-scroller": { backgroundColor: "#fdf6e3" },
        ".cm-content": { backgroundColor: "#fdf6e3", caretColor: "#2aa198" },
        ".cm-selectionBackground": { backgroundColor: "#eee8d5" },
        ".cm-activeLine": { backgroundColor: "#eee8d5" },
        ".cm-keyword": { color: "#268bd2" },
        ".cm-variableName": { color: "#b58900" },
        ".cm-function": { color: "#6c71c4" },
        ".cm-string": { color: "#859900" },
    }, { dark: false }),

    monokai: EditorView.theme({
        "&": { backgroundColor: "#272822", color: "#f8f8f2" },
        ".cm-scroller": { backgroundColor: "#272822" },
        ".cm-content": { backgroundColor: "#272822", caretColor: "#66d9ef" },
        ".cm-selectionBackground": { backgroundColor: "#49483e" },
        ".cm-activeLine": { backgroundColor: "#3e3d32" },
        ".cm-keyword": { color: "#f92672" },
        ".cm-variableName": { color: "#a6e22e" },
        ".cm-function": { color: "#66d9ef" },
        ".cm-string": { color: "#e6db74" },
    }, { dark: true }),

    nord: EditorView.theme({
        "&": { backgroundColor: "#2e3440", color: "#d8dee9" },
        ".cm-scroller": { backgroundColor: "#2e3440" },
        ".cm-content": { backgroundColor: "#2e3440", caretColor: "#88c0d0" },
        ".cm-selectionBackground": { backgroundColor: "#4c566a" },
        ".cm-activeLine": { backgroundColor: "#3b4252" },
        ".cm-keyword": { color: "#81a1c1" },
        ".cm-variableName": { color: "#88c0d0" },
        ".cm-function": { color: "#8fbcbb" },
        ".cm-string": { color: "#a3be8c" },
    }, { dark: true }),

    highContrast: EditorView.theme({
        "&": { backgroundColor: "#ffffff", color: "#000000" },
        ".cm-scroller": { backgroundColor: "#ffffff" },
        ".cm-content": { backgroundColor: "#ffffff", caretColor: "#000000" },
        ".cm-selectionBackground": { backgroundColor: "#b3d7ff" },
        ".cm-activeLine": { backgroundColor: "#e6e6e6" },
        ".cm-keyword": { color: "#0000ff", fontWeight: "bold" },
        ".cm-variableName": { color: "#2e7d32" },
        ".cm-function": { color: "#d81b60" },
        ".cm-string": { color: "#006400" },
    }, { dark: false }),
    vim: EditorView.theme({
    "&": {
        backgroundColor: "#1e1e1e", 
        color: "#dcdcdc", 
    },
    ".cm-scroller": {
        backgroundColor: "#1e1e1e", 
        color: "#dcdcdc",
    },
    ".cm-content": {
        backgroundColor: "#1e1e1e",
        caretColor: "#00ff00",
    },
    ".cm-cursor": {
        // borderLeft: "8px solid #00ff00", 
        borderRight: "none",
        backgroundColor: "#00ff00",
        width: "8px",
    },
    ".cm-selectionBackground": {
        backgroundColor: "#264f78", // Blue selection
    },
    ".cm-activeLine": {
        backgroundColor: "#2d2d2d", // Slightly lighter background for active line
    },
    ".cm-keyword": {
        color: "#00ff00", // Blue for keywords
        fontWeight: "bold",
    },
    ".cm-variableName": {
        color: "#9cdcfe", // Light blue for variables
    },
    ".cm-function": {
        color: "#dcdcaa", // Yellow for functions
    },
    ".cm-string": {
        color: "#ce9178", // Orange for strings
    },
    ".cm-comment": {
        color: "#6a9955", // Green for comments
        fontStyle: "italic",
    },
    }, { dark: true })
};


function Editor() {
    const [code, setCode] = useState("");
    const [isMuted, setIsMuted] = useState(false); // New state for mute status
    const { roomId } = useParams();
    const navigate = useNavigate();
    const peerConnections = useRef({});
    const localStream = useRef(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // Map of socketId to audio stream
    const isUpdating = useRef(false); // to prevent self=overwriting
    const debounceTimeout = useRef(null); // Timeout for debouncing

    // WebRTC configuration
    const configuration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }, // Free STUN server
        ],
    };

    const [theme, setTheme] = useState("nord");
    const themeOptions = ["ocean", "midnight", "lavender", "dracula", "solarizedLight","monokai", "nord", "highContrast", "vim"];


    useEffect(() => {
        // Initialize audio stream
        async function initAudio() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                localStream.current = stream;
                // Initially set audio tracks based on mute state
                stream.getAudioTracks().forEach((track) => {
                    track.enabled = !isMuted;
                });
            } catch (error) {
                console.error("Error accessing audio:", error);
            }
        }
        initAudio();

        if (!roomId) {
            fetch(
                `${
                    import.meta.env.VITE_APP_BACKEND_URL ||
                    "http://localhost:5000"
                }/api/new`
            )
                .then((res) => res.json())
                .then((data) => {
                    navigate(`/${data.roomId}`);
                })
                .catch((error) =>
                    console.error("Error fetching new room:", error)
                );
            return;
        }

        // Join the room
        socket.emit("join-room", roomId);

        // Listen for loaded code
        socket.on("load-code", (loadedCode) => {
            setCode(loadedCode);
        });

        socket.on("code-change", ({ code: newCode, socketId }) => {
            if (socketId !== socket.id) { // to prevent self-overwriting
                setCode(newCode);
            }
        });

        // Handle new user connection
        socket.on("user-connected", (userId) => {
            createPeerConnection(userId, true);
        });

        // Handle user disconnection
        socket.on("user-disconnected", (userId) => {
            if (peerConnections.current[userId]) {
                peerConnections.current[userId].close();
                delete peerConnections.current[userId];
                setRemoteStreams((prev) => {
                    const newStreams = { ...prev };
                    delete newStreams[userId];
                    return newStreams;
                });
            }
        });

        // Handle WebRTC offer
        socket.on("offer", async ({ offer, from }) => {
            if (!peerConnections.current[from]) {
                createPeerConnection(from, false);
            }
            const peerConnection = peerConnections.current[from];
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", { roomId, answer, to: from });
        });

        // Handle WebRTC answer
        socket.on("answer", ({ answer, from }) => {
            const peerConnection = peerConnections.current[from];
            peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        });

        // Handle ICE candidate
        socket.on("ice-candidate", ({ candidate, from }) => {
            const peerConnection = peerConnections.current[from];
            if (peerConnection) {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Handle errors
        socket.on("error", (message) => {
            console.error("Socket error:", message);
        });
        socket.on("code-update", (newCode) => {
            if (!isUpdating.current) {
                isUpdating.current = true; // Prevent feedback loop
                setCode(newCode);
                setTimeout(() => {
                    isUpdating.current = false; // Allow updates again
                }, 50); // Small delay to prevent rapid updates
            }
        });


        // Cleanup
        return () => {
            socket.off("load-code");
            socket.off("code-change");
            socket.off("user-connected");
            socket.off("user-disconnected");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("error");
            // Stop local stream
            if (localStream.current) {
                localStream.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }
            // Close all peer connections
            Object.values(peerConnections.current).forEach((pc) => pc.close());
            peerConnections.current = {};
        };
    }, [roomId,isMuted]);

    // Create a peer connection
    function createPeerConnection(userId, initiateOffer) {
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnections.current[userId] = peerConnection;

        // Add local stream to peer connection
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream.current);
            });
        }

        // Handle incoming stream
        peerConnection.ontrack = (event) => {
            setRemoteStreams((prev) => ({
                ...prev,
                [userId]: event.streams[0],
            }));
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    roomId,
                    candidate: event.candidate,
                    to: userId,
                });
            }
        };

        // Create offer if initiator
        if (initiateOffer) {
            peerConnection.createOffer().then((offer) => {
                peerConnection.setLocalDescription(offer);
                socket.emit("offer", { roomId, offer, to: userId });
            });
        }
    }

    // Toggle mute/unmute
    const toggleMute = () => {
        if (localStream.current) {
            const newMutedState = !isMuted;
            localStream.current.getAudioTracks().forEach((track) => {
                track.enabled = !newMutedState; // Enable/disable audio track
            });
            setIsMuted(newMutedState);
        }
    };

    const handleChange = (value) => {
        setCode(value);
        isUpdating.current = true;

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            socket.emit("code-change", { roomId, code: value });
        }, 300); // Emit updates every 300ms
    };

    const handleThemeChange = (e) => {
        setTheme(e.target.value);
    };

    return (
        <div
            style={{
                height: "90vh",
                width: "97vw",
                margin: "10px auto",
                fontSize: "16px",
            }}
        >
            <h2 style={{ color: "white", fontFamily: "arial" }}>
                Socket Share: <code>{roomId || "Loading..."}</code>
            </h2>
            <div style={{ marginBottom: "10px" }}>
                <label htmlFor="theme-select" style={{ marginRight: "10px" }}>
                    Theme:
                </label>
                <select
                    id="theme-select"
                    value={theme}
                    onChange={handleThemeChange}
                    style={{ marginBottom: "10px" }}
                >
                    {themeOptions.map((themeName) => (
                        <option key={themeName} value={themeName}>
                            {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
            <CodeMirror
                value={code}
                theme="dark"
                extensions={[javascript(),themes[theme]]}
                onChange={(value) => handleChange(value)}
                height="70vh"
                style={{
                    border: "1px solid #77777799",
                    borderRadius: "20px",
                    overflow: "hidden",
                    padding: "10px 0px",
                }}
            />
            <div style={{ marginTop: "10px" }}>
                <h3 style={{ color: "white" }}>Audio Chat</h3>
                <button
                    onClick={toggleMute}
                    style={{
                        padding: "8px 16px",
                        background: isMuted ? "#ff4444" : "#44ff44",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        marginBottom: "10px",
                    }}
                >
                    {isMuted ? "Unmute" : "Mute"}
                </button>
                {Object.entries(remoteStreams).map(([userId, stream]) => (
                    <audio
                        key={userId}
                        ref={(audio) => {
                            if (audio && stream) audio.srcObject = stream;
                        }}
                        autoPlay
                    />
                ))}
            </div>
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
