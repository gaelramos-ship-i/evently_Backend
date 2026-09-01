const express = require('express')
const app = express()
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const port = 3000

require('dotenv').config()

const { sequelize, connectDB } = require('./config/db')
const startServer = async () => {
    await connectDB()
    await sequelize.sync({alter: false})
    console.log('Tables synchronized')
}
startServer()

const authRoutes = require('./routes/authRoutes')
const eventRoutes = require('./routes/eventRoutes')
const favRoutes = require('./routes/favRoutes')

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Fenetre de 15 minutes,
    limit: 100, // Max 100 requêtes par IP sur ce créneau
    message: { status: 429, error: 'Trop de requête, réessayez plus tard.'}
})
app.use(limiter)
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }) 
)
app.use(express.json())
const corsOptions = {
    origin: 'http://localhost:3000'
}
app.use(cors(corsOptions))

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/event', eventRoutes)
app.use('/api/v1/fav', favRoutes)

app.get('/', (req, res) => {
    res.send('Bienvenue sur mon API RESTful !')
})

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})