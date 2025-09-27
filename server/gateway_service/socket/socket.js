const { Server } = require("socket.io");
const { consumeFromQueue, publishToQueue } = require("../../rabbitmq");

let io;
const onlineUsers = new Map();
const onlineCaptains = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🔗 Client connected:", socket.id);

    socket.on("registerUser", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} online`);
    });

    socket.on("registerCaptain", (captainId) => {
      onlineCaptains.set(captainId, socket.id);
      console.log(`🚖 Captain ${captainId} online`);
    });

    // ✅ Captain accepts ride → Gateway pushes to RabbitMQ
    socket.on("acceptRide", async (data) => {
      // console.log("🚖 Ride accepted:", data);
      await publishToQueue("ride-accepted", data); // push event for User service
    });

     // Driver sends live location
  socket.on("driverLocation", (data) => {
    // data: { rideId, lat, lng }
        //  console.log(data);
    if (onlineUsers.has(data.userId)) {
      io.to(onlineUsers.get(data.userId)).emit("driverLocation", data);
    }
  });

  // 🔴 NEW: User sends live location
  socket.on("userLocation", (data) => {
    // data: { rideId, lat, lng }
    if (onlineCaptains.has(data.captainId)) {
      io.to(onlineCaptains.get(data.captainId)).emit("userLocation", data);
    }
  });

  socket.on("chatMessage", (msg) => {
  // Emit to user or captain depending on sender
  console.log("Chat message:", msg);
  if (msg.sender === "user" && onlineCaptains.has(msg.captainId)) {
    io.to(onlineCaptains.get(msg.captainId)).emit("chatMessage", msg);
  } else if (msg.sender === "captain" && onlineUsers.has(msg.userId)) {
    io.to(onlineUsers.get(msg.userId)).emit("chatMessage", msg);
  }
});

socket.on("RideStart", (data) => {
  // console.log("Ride started:", data);
  // console.log(data);
  if (onlineUsers.has(data.userId)) {
    io.to(onlineUsers.get(data.userId)).emit("RideStart", data);
  }
}
);

// ⚡ WebRTC Signaling
socket.on("call-user", ({ fromId, toId, offer }) => {
  const targetSocketId = onlineUsers.has(toId) ? onlineUsers.get(toId) : onlineCaptains.get(toId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("incoming-call", { fromId, offer });
  }
});

socket.on("answer-call", ({ fromId, toId, answer }) => {
  const targetSocketId = onlineUsers.has(toId) ? onlineUsers.get(toId) : onlineCaptains.get(toId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("call-answered", { fromId, answer });
  }
});

socket.on("ice-candidate", ({ fromId, toId, candidate }) => {
  const targetSocketId = onlineUsers.has(toId) ? onlineUsers.get(toId) : onlineCaptains.get(toId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("ice-candidate", { fromId, candidate });
  }
});


socket.on("call-declined", ({ fromId, toId }) => {
  const targetSocketId = onlineUsers.has(toId) ? onlineUsers.get(toId) : onlineCaptains.get(toId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("call-declined", { fromId });
  }
});


    socket.on("disconnect", () => {
      // console.log("❌ Disconnected:", socket.id);
      [...onlineUsers].forEach(([id, sId]) => {
        if (sId === socket.id) onlineUsers.delete(id);
      });
      [...onlineCaptains].forEach(([id, sId]) => {
        if (sId === socket.id) onlineCaptains.delete(id);
      });
    });
  });
}

function notifyUser(userId, event, data) {
  console.log("Notifying user:", userId, event, data);
  // console.log(onlineUsers);
  if (onlineUsers.has(userId)) {
    console.log("User is online, sending event");
    io.to(onlineUsers.get(userId)).emit(event, data);
  }
}

function notifyCaptain(captainId, event, data) {
  if (onlineCaptains.has(captainId)) {
    io.to(onlineCaptains.get(captainId)).emit(event, data);
  }
}

// ✅ Gateway listens to User service notifications
const startGatewayConsumer = async () => {
  await consumeFromQueue("gateway-notify", async (msg) => {
    // console.log("📩 Gateway received user-notify:", msg);
    const { userId, event, payload } = msg;

    // console.log(`📥 Gateway notifying user ${userId}:`, event);

    // send real-time WebSocket message to the user
    notifyUser(userId, event, payload);
  });
  await consumeFromQueue("gateway-notify-captains", async (msg) => {
    const { ride, captains } = JSON.parse(msg);
    // console.log("📥 Gateway notifying captains:", captains);
    // console.log(ride);
    // send real-time WebSocket message to the captains
    captains.forEach((captainId) => notifyCaptain(captainId, "newRide", { 
       rideId: ride.rideId,
    pickup: ride.pickup,
    drop: ride.drop,
    coordinates: ride.coordinates,
    rideType: ride.rideType,
    userId: ride.userId
    }));
  });
};

module.exports = { initSocket, notifyUser, notifyCaptain, startGatewayConsumer };
