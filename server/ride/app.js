const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const connect = require('./db/db');
connect();
const rideRoutes = require('./routes/ride.routes');
const { connectRabbitMQ } = require("../rabbitmq");
const { startRideConsumer } = require("./controllers/ride.controller");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectRabbitMQ().then(() => startRideConsumer());

app.use('/', rideRoutes);


module.exports = app;