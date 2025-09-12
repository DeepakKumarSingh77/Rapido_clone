const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const app = express()
const userRoutes = require('./routes/user.routes')
const connect = require('./db/db')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', userRoutes)

connect();

module.exports = app
