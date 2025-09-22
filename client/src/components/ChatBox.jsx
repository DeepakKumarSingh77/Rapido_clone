import React, { useState, useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

const ChatBox = ({ rideId, userId, captainId, role, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      if (data.rideId === rideId) {
        setMessages((prev) => [...prev, data]);
      }
    };

    socket.on("chatMessage", handleMessage);
    return () => socket.off("chatMessage", handleMessage);
  }, [socket, rideId]);

  // Send a message
  const sendMessage = () => {
    if (!input.trim()) return;

    const msg = {
      rideId,
      sender: role,
      text: input,
      timestamp: new Date().toISOString(),
      userId,
      captainId,
    };

    socket.emit("chatMessage", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col z-1000">
      {/* Header with close button */}
      <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-100 rounded-t-xl">
        <span className="font-semibold text-gray-700">Chat</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 font-bold"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[75%] break-words ${
              msg.sender === role ? "bg-blue-100 self-end" : "bg-gray-200 self-start"
            }`}
          >
            <p className="text-xs text-gray-600 font-semibold">{msg.sender}</p>
            <p className="text-sm">{msg.text}</p>
            <p className="text-xs text-gray-500 text-right">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex p-2 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-200"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
