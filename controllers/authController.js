const jwt = require('jsonwebtoken')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const { sequelize } = require('../config/db')
const { QueryTypes } = require('sequelize')

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '24h'

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    })
}

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body

        const existingUser = await sequelize.query('SELECT COUNT(email_user) FROM "Users" WHERE email_user = :email', {
            type: QueryTypes.SELECT,
            replacements: { email}
        })

        if(existingUser[0].count == 1)
            return res.status(400).json({message: 'Email is already use'})

        const isPasswordOK = validator.isStrongPassword(password, {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })

        if(!isPasswordOK){
            return res.status(400).json({message: 'Password must have 1 lower, 1 upper, 1 number and 1 symbol and must be at least 6 caracters long'})
        }

        const isEmailOK = validator.isEmail(email)
        if(!isEmailOK){
            return res.status(400).json({message: 'You must provide a valid email'})
        }

        const hash = await bcrypt.hash(password, 15)

        await sequelize.query('INSERT INTO "Users"(name_user, email_user, pass_user) VALUES (:name, :email, :password) ', {
            type: QueryTypes.INSERT,
            replacements: { name, email, password: hash }
        })

        const userQuery = await sequelize.query('SELECT * FROM "Users" WHERE email_user = :email', {
            type: QueryTypes.SELECT,
            replacements: { email }
        })

        const user = userQuery[0]
        const token = generateToken(user.id_user)
        res.status(201).json({
            message: 'User create successfully',
            token,
            user
        })
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration', error: err.message })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password)
            return res.status(400).json({ message: 'Please provide email and password' })

        const userQuery = await sequelize.query('SELECT *,COUNT(email_user) FROM "Users" WHERE email_user = :email GROUP BY id_user', {
            type: QueryTypes.SELECT,
            replacements: {email}
        })

        const user = userQuery[0]
        if(user.count == 0)
            return res.status(401).json({message: "Invalid credentials"})

        const isMatch = await bcrypt.compare(password, user.pass_user)
        if(!isMatch)
            return res.status(401).json({message: 'Invalid credentials'})

        const token = generateToken(user.id_user)

        res.status(201).json({
            message: "Login succesfully",
            token,
            user: {
                id: user.id_user,
                name: user.name_user,
                email: user.email_user
            }
        })
        
    } catch (err) {
        res.status(500).json({ message: 'Server error during login', error: err.message })
    }
}

module.exports = { register, login }