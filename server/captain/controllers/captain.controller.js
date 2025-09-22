const Captain = require('../models/captain.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { consumeFromQueue, publishToQueue } = require('../../rabbitmq');


// REGISTER
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const captain = await Captain.findOne({ email });

    if (captain) {
      return res.status(400).json({ message: 'Captain already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newCaptain = new Captain({ username, email, password: hash });
    await newCaptain.save();

    const token = jwt.sign({ id: newCaptain._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    delete newCaptain._doc.password;

    res.send({ token, captain: newCaptain });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const captain = await Captain.findOne({ email }).select('+password');

    if (!captain) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, captain.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: captain._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    captain.isAvailable = true; // reset availability on login
    await captain.save();
    delete captain._doc.password;

    res.send({ token, captain });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// LOGOUT
const logout = async (req, res) => {
  try {
    // if you want token blacklisting, make sure blacklisttokenModel exists
    res.clearCookie('token');
    res.send({ message: 'Captain logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GO ONLINE
const goOnline = async (req, res) => {
  try {
    const { captainId, lat, lng } = req.body;

    const captain = await Captain.findByIdAndUpdate(
      captainId,
      { isAvailable: true, coordinates: { lat, lng } },
      { new: true }
    );

    if (!captain) return res.status(404).json({ message: "Captain not found" });

    res.json({ message: "Captain is now online 🚖", captain });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// HELPER: Haversine formula
function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// CONSUMER
const startCaptainConsumer = async () => {
  await consumeFromQueue("captain-notify", async (data) => {
    console.log("📩 Captain Service received ride:", data);

    // find all available captains
    const captains = await Captain.find({ isAvailable: true });

    // filter captains within 1 km
    const nearbyCaptains = captains.filter((captain) => {
      if (!captain.coordinates) return false;
      const distance = haversineDistance(data.coordinates, captain.coordinates);
      return distance <= 1;
    });

    console.log("🚖 Nearby captains found:", nearbyCaptains);
     if (nearbyCaptains.length > 0) {
      // send to gateway via RabbitMQ
      console.log("hello");
      await publishToQueue(
        "gateway-notify-captains",
        JSON.stringify({
          ride: data,
          captains: nearbyCaptains.map((c) => c._id.toString()),
        })
      );
      console.log("📤 Published nearby captains to gateway queue");
    // TODO: notify one captain or broadcast
  }  });
};


const getCaptainDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const captain = await Captain.findById(id).select('-password');
    if (!captain) return res.status(404).json({ message: "Captain not found" });
    res.json(captain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// EXPORT all in one object
module.exports = {
  register,
  login,
  logout,
  goOnline,
  startCaptainConsumer,
  getCaptainDetails,
};
