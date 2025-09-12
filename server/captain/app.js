const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const app = express()
const connect = require('./db/db')
connect()
const captainRoutes = require('./routes/captain.routes')


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', captainRoutes)

module.exports = app