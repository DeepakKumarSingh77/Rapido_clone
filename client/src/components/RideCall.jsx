import React from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { useCall } from "../hooks/useCall";

const RideCall = ({ userId, peerId }) => {
  const {
    callPeer,
    localStream,
    remoteStream,
    inCall,
    incomingCall,
    acceptCall,
    declineCall,
    endCall,
  } = useCall(userId, peerId);

  return (
    <div >
      {/* Default Call Button */}
      {!inCall && !incomingCall && (
        <button
          onClick={callPeer}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
        >
          📞 Call
        </button>
      )}

      {/* Incoming Call UI */}
    {incomingCall && (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 bg-opacity-90 z-[2000]">
    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl w-80 text-center shadow-2xl border border-white/20">
      
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white text-4xl shadow-lg animate-pulse">
          📞
        </div>
        <h2 className="text-white text-xl font-semibold mt-4">Incoming Call</h2>
        <p className="text-gray-300 text-sm mt-1">From: Customer</p>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-8 mt-4">
        {/* Decline */}
        <button
          onClick={declineCall}
          className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition flex items-center justify-center"
        >
          <PhoneOff size={28} />
        </button>

        {/* Accept */}
        <button
          onClick={acceptCall}
          className="p-5 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-lg transform hover:scale-110 transition flex items-center justify-center"
        >
          <Phone size={28} />
        </button>
      </div>
    </div>
  </div>
)}


      {/* Active Call UI */}
    {inCall && (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black z-2000">
    <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl w-96 text-center shadow-2xl border border-white/20">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white text-3xl shadow-lg">
          📞
        </div>
        <h2 className="text-white text-xl font-semibold mt-4">On Call</h2>
        <p className="text-gray-300 text-sm">Connected • 00:25</p>
      </div>

      {/* Controls */}
      <div className="flex gap-6 justify-center">
        {/* Mute */}
        <button
          className="p-4 bg-gray-600 text-white rounded-full hover:bg-gray-700 shadow-md"
        >
          <MicOff size={22} />
        </button>

        {/* End Call */}
        <button
          onClick={endCall}
          className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition"
        >
          <PhoneOff size={28} />
        </button>

        {/* Speaker */}
        <button
          className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md"
        >
          🔊
        </button>
      </div>

      {/* Audio Streams (hidden but active) */}
      <audio autoPlay ref={(el) => el && (el.srcObject = localStream)} muted />
      <audio autoPlay ref={(el) => el && (el.srcObject = remoteStream)} />
    </div>
  </div>
)}

    </div>
  );
};

export default RideCall;
