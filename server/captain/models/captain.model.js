const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  phone: { type: String },             // added
  photo: { type: String },             // added
  vehicle: { type: String },           // added
  vehicleType: { type: String },       // added: Cab, Bike, Auto
  rating: { type: Number, default: 5 }, // added
  isAvailable: { type: Boolean, default: false },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
},{ timestamps: true });

module.exports = mongoose.model('Captain', captainSchema);
