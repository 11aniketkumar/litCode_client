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

// Connect to backend
const socket = io(
    import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5000"
);

function Editor() {
    const [code, setCode] = useState("");
    const [isMuted, setIsMuted] = useState(false); // New state for mute status
    const { roomId } = useParams();
    const navigate = useNavigate();
    const peerConnections = useRef({});
    const localStream = useRef(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // Map of socketId to audio stream

    // WebRTC configuration
    const configuration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }, // Free STUN server
        ],
    };

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

        // Listen for real-time code changes
        socket.on("code-change", (newCode) => {
            setCode(newCode);
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
    }, [roomId]);

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
        socket.emit("code-change", { roomId, code: value });
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
            <CodeMirror
                value={code}
                theme="dark"
                extensions={[javascript()]}
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
