const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Captain"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  pickup: { type: String, required: true },
  destination: { type: String, required: true },
  distance: Number,
  duration: Number,
  rideType: { type: String, enum: ["Bike", "Auto", "Cab"] },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  status: {
    type: String,
    enum: ["requested", "accepted", "started", "completed"],
    default: "requested",
  },
}, { timestamps: true });

module.exports = mongoose.model("Ride", rideSchema);
