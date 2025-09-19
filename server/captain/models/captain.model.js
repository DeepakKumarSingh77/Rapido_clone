const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  isAvailable: { type: Boolean, default: false },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
});

module.exports = mongoose.model('Captain', captainSchema);
