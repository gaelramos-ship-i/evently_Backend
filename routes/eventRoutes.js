const express = require('express')
const router = express.Router()
const { getEvent, getDetails } = require('../controllers/eventController')
const { authMiddleware } =  require('../middleware/authMiddleware')

router.get('/', getEvent)
router.get('/details/:idEvent', authMiddleware, getDetails)

module.exports = router