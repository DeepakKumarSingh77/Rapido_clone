import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import UserNavber from "./UserNavber";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    const res = await axios.get("http://localhost:3000/chat/api/messages");
    setMessages(res.data);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Optimistically add user message
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const res = await axios.post("http://localhost:3000/chat/api/message", { text: input });
    setMessages((prev) => [...prev, res.data]); // Add bot response
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <UserNavber />
      <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full p-4">
        <div className="flex-1 overflow-y-auto bg-white rounded-3xl p-4 shadow-md flex flex-col gap-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl break-words ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
