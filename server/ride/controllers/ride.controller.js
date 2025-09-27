// server/ride/controllers/ride.controller.js
const rideModel = require("../models/ride.model");
const { publishToQueue, consumeFromQueue } = require("../../rabbitmq");

// Get ride details
module.exports.RideDetail = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await rideModel.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    console.log(ride);
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  fare: data.fare, // ✅ save fare here
  coordinates: data.coordinates,
  status: "requested",
});

await newRide.save();

    await publishToQueue("ride-created", {
    userId: data.userId,
    rideId: newRide._id.toString(),
  });

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
    console.log("Looking for rideId:", data.rideId);
const rideExists = await rideModel.findById(data.rideId);
console.log("Ride exists in DB:", rideExists);


      const ride = await rideModel.findByIdAndUpdate(
    data.rideId,
    {
      status: "accepted",
      captain: data.captainId,
    },
    { new: true }
  );
  console.log("Updated ride:", ride);

  if (!ride || !ride.user) {
    console.error("Ride or user not found for user-notify");
    return;
  }

  // 2️⃣ Notify user service
  await publishToQueue("user-notify", {
    userId: ride.user.toString(), // ✅ now safe
    rideId: ride._id.toString(),
    captain: data.captain
  });
  });
};
