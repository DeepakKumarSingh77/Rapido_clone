// server/ride/controllers/ride.controller.js
const rideModel = require("../models/ride.model");
const { publishToQueue, consumeFromQueue } = require("../../rabbitmq");

// Accept ride via REST or WebSocket
module.exports.acceptRide = async (req, res) => {
  try {
    const { rideId, captainId } = req.body;
    const ride = await rideModel.findById(rideId);

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = "accepted";
    ride.captain = captainId;
    await ride.save();

    // Notify user service
    await publishToQueue("user-notify", {
      rideId,
      captainId,
      userId: ride.user,
    });

    res.status(200).json({ message: "Ride accepted", ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Start consumers
module.exports.startRideConsumer = async () => {
  // 1️⃣ Consume ride requests from user
  await consumeFromQueue("ride_requests", async (data) => {
    console.log("✅ Ride Service received ride request:", data);

    const newRide = new rideModel({
      user: data.userId,
      pickup: data.pickup,
      destination: data.drop,
      distance: data.distance,
      duration: data.duration,
      rideType: data.rideType,
      coordinates: data.coordinates,
      status: "requested", // ✅ must match enum
    });

    await newRide.save();

    // Notify captain service
    await publishToQueue("captain-notify", {
      rideId: newRide._id,
      userId: data.userId,
      pickup: data.pickup,
      drop: data.drop,
      coordinates: data.coordinates,
      rideType: data.rideType,
    });
  });

  // 2️⃣ Consume ride acceptance (from gateway/captain)
  await consumeFromQueue("ride-accepted", async (data) => {
    console.log("📩 Ride Service got acceptance:", data);

    await rideModel.findByIdAndUpdate(data.rideId, {
      status: "accepted",
      captain: data.captainId,
    });

    // Notify user service
    await publishToQueue("user-notify", data);
  });
};
