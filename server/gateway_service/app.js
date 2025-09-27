const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const { initSocket, startGatewayConsumer } = require('./socket/socket');
const { connectRabbitMQ } = require('../rabbitmq');

const app = express();
app.use(cors());
app.use(express.json());

const startServer = async () => {
  // ✅ 1. Connect RabbitMQ first
  await connectRabbitMQ();

  // ✅ 2. Then start socket + consumers
  const server = app.listen(3000, () => {
    console.log('Gateway server listening on port 3000');
  });

  initSocket(server); // socket.io needs http.Server, not express()
  startGatewayConsumer(); // this calls consumeFromQueue()
  
  // ✅ 3. Setup routes
  app.use('/user', proxy('http://localhost:3001'));
  app.use('/captain', proxy('http://localhost:3002'));
  app.use('/ride', proxy('http://localhost:3003'));
  app.use('/chat', proxy('http://localhost:3004'));
};

startServer();
