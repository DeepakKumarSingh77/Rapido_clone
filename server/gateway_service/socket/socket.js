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
      console.log("🚖 Ride accepted:", data);
      await publishToQueue("ride-accepted", data); // push event for User service
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
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
  if (onlineUsers.has(userId)) {
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
    const { userId, event, payload } = JSON.parse(msg);

    console.log(`📥 Gateway notifying user ${userId}:`, event);

    // send real-time WebSocket message to the user
    notifyUser(userId, event, payload);
  });
};

module.exports = { initSocket, notifyUser, notifyCaptain, startGatewayConsumer };
