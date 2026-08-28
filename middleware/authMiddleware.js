const jwt = require('jsonwebtoken')
const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

const JWT_SECRET = process.env.JWT_SECRET

exports.authMiddleware = async (req, res, next) => {
    try {
        let token
        if(req.headers.authorization?.startWith('Bearer'))
            token = req.headers.authorization.split(' ')[1]
        if(!token)
            return res.status(401).json({message: 'Not authorized, token missing'})
        const decoded = jwt.verify(token, JWT_SECRET)
        const id = decoded.id
        const user = await sequelize.query('SELECT * FROM "Users" WHERE user_id = :id', {
            type: QueryTypes.SELECT,
            replacements: {id}
        })
        if(!user)
            return res.status(401).json({message: "User no longer exists"})
        req.user = user
        next()
    } catch (err) {
        return res.status(401).json({message: 'Not authorized invalid token', error: err.message})
    }
}