const express = require('express');
const router = express.Router();
const captainController = require('../controllers/captain.controller');


router.post('/register', captainController.register);
router.post('/login', captainController.login);
router.get('/logout', captainController.logout);
router.post("/go-online", captainController.goOnline);


module.exports = router;