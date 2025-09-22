const mongoose = require('mongoose');

function generateOtp() {
  // Generate 4-digit OTP
  return Math.floor(1000 + Math.random() * 9000);
}

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
  otp: { type: Number, default: generateOtp }, 
}, { timestamps: true });

module.exports = mongoose.model("Ride", rideSchema);
