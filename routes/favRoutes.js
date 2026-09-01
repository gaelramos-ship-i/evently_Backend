const express = require('express')
const router = express.Router()
const { addFav } = require('../controllers/favController')
const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/:eventId', authMiddleware, addFav)

module.exports = router