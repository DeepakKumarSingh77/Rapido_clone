const express = require('express');
const router = express.Router();

const { acceptRide } = require("../controllers/ride.controller");
router.post("/accept", acceptRide);

module.exports = router;