import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'

//import route
import authRoutes from './Router/authRoutes.js'
import employeeRoutes from './Router/employeeRoutes.js'
import commonRoutes from './Router/commonRoutes.js'

import connectDB from './utils/connectDB.js'
import tokenMiddleware from './Middleware/AuthMiddleware.js'

const PORT = process.env.PORT || 3001
const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: 'GET,PUT,POST,DELETE',
    credentials: true
}))

app.use(express.json());
app.use(cookieParser())
app.use(express.static('Public'))

//route
app.use('/api', commonRoutes)
app.use('/api/employee', tokenMiddleware.tokenMiddleware, employeeRoutes)
app.use('/api/auth', [tokenMiddleware.tokenMiddleware, tokenMiddleware.isAdmin], authRoutes)

connectDB();

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})