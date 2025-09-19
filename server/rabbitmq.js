const amqp = require('amqplib');

let channel, connection;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    channel = await connection.createChannel();
    console.log('RabbitMQ connected');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
  }
};

const publishToQueue = async (queueName, data) => {
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
};

const consumeFromQueue = async (queueName, callback) => {
  await channel.assertQueue(queueName, { durable: true });
  channel.consume(queueName, (msg) => {
    callback(JSON.parse(msg.content.toString()));
    channel.ack(msg);
  });
};

module.exports = { connectRabbitMQ, publishToQueue, consumeFromQueue };
