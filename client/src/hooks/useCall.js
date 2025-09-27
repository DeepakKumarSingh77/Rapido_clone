import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "../services/socket";

export function useCall(userId, peerId) {
  const socket = getSocket();
  const pcRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);

  // 📴 End call
  const endCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;

    localStream?.getTracks().forEach((t) => t.stop());

    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
    setIncomingCall(null);

    // Notify the other peer
    socket?.emit("end-call", { fromId: userId, toId: peerId });
  }, [localStream, peerId, socket, userId]);

  // 🔔 Listen if the other peer ends the call
  useEffect(() => {
    if (!socket) return;

    const handlePeerEndCall = ({ fromId }) => {
      if (fromId === peerId) {
        alert("The other person ended the call.");
        pcRef.current?.close();
        pcRef.current = null;
        localStream?.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setInCall(false);
        setIncomingCall(null);
      }
    };

    socket.on("end-call", handlePeerEndCall);
    return () => socket.off("end-call", handlePeerEndCall);
  }, [socket, peerId, localStream]);

  // 🔔 Listen if the other peer declines an incoming call
  useEffect(() => {
    if (!socket) return;

    const handlePeerDecline = ({ fromId }) => {
      if (fromId === peerId) {
        alert("Call was declined by the other person.");
        endCall(); // Close call UI for both
      }
    };

    socket.on("call-declined", handlePeerDecline);
    return () => socket.off("call-declined", handlePeerDecline);
  }, [socket, peerId, endCall]);

  // 🔔 Handle incoming call
  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ fromId, offer }) => {
      setIncomingCall({ fromId, offer });
    });

    socket.on("call-answered", async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(answer);
      setInCall(true);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (candidate) pcRef.current?.addIceCandidate(candidate);
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
    };
  }, [socket]);

  // 📞 Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    const { fromId, offer } = incomingCall;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((t) => pcRef.current.addTrack(t, stream));

    const remote = new MediaStream();
    pcRef.current.ontrack = (e) => remote.addTrack(e.track);
    setRemoteStream(remote);

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate)
        socket.emit("ice-candidate", {
          fromId: userId,
          toId: fromId,
          candidate: event.candidate,
        });
    };

    await pcRef.current.setRemoteDescription(offer);
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    socket.emit("answer-call", { fromId: userId, toId: fromId, answer });

    setIncomingCall(null);
    setInCall(true);
  };

  // ❌ Decline incoming call
  const declineCall = () => {
    if (incomingCall) {
      socket.emit("call-declined", {
        fromId: userId,
        toId: incomingCall.fromId,
      });
    }
    setIncomingCall(null);
  };

  // 🚀 Start outgoing call
  const callPeer = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((t) => pcRef.current.addTrack(t, stream));

    const remote = new MediaStream();
    pcRef.current.ontrack = (e) => remote.addTrack(e.track);
    setRemoteStream(remote);

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate)
        socket.emit("ice-candidate", {
          fromId: userId,
          toId: peerId,
          candidate: event.candidate,
        });
    };

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    socket.emit("call-user", { fromId: userId, toId: peerId, offer });
    setInCall(true);
  };

  return {
    callPeer,
    localStream,
    remoteStream,
    inCall,
    incomingCall,
    acceptCall,
    declineCall,
    endCall,
  };
}
