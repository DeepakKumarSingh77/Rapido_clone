const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectRabbitMQ, publishToQueue, consumeFromQueue } = require('../../rabbitmq');

connectRabbitMQ();

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    const newUser = new userModel({ username, email, password: hash });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.send({ token, newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.send({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.send({ message: 'User logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestRide = async (req, res) => {
  try {
    const { userId, pickup, drop, distance, duration, rideType, coordinates } = req.body;
    const rideRequest = { userId, pickup, drop, distance, duration, rideType, coordinates, status: "requested", createdAt: new Date() };
    await publishToQueue("ride_requests", rideRequest);
    res.status(200).json({ message: "Ride request sent successfully", rideId: Date.now().toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to request ride" });
  }
};

const startUserConsumer = async () => {
  await consumeFromQueue("user-notify", async (data) => {
    await publishToQueue("gateway-notify", {
      userId: data.userId,
      event: "rideAccepted",
      payload: { rideId: data.rideId, captain: data.captain }
    });
    console.log("📢 User Service forwarded event to Gateway:", { userId: data.userId, event: "rideAccepted" });
  });
};

// ✅ Export all functions in a single object
module.exports = {
  register,
  login,
  logout,
  requestRide,
  startUserConsumer
};
