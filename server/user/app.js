const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const app = express()
const userRoutes = require('./routes/user.routes')
const connect = require('./db/db')
const { connectRabbitMQ } = require('../rabbitmq');
const { startUserConsumer } = require('./controllers/user.controller');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', userRoutes)

connect();
connectRabbitMQ().then(() => {
  startUserConsumer(); // this calls consumeFromQueue()
});

module.exports = app
