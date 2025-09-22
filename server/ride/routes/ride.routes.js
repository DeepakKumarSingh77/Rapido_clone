const express = require('express');
const { RideDetail } = require('../controllers/ride.controller');
const router = express.Router();

// const { acceptRide } = require("../controllers/ride.controller");
// router.post("/accept", acceptRide);
router.get("/:rideId", RideDetail);

module.exports = router;