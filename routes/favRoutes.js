const express = require('express')
const router = express.Router()
const { addFav, getFav } = require('../controllers/favController')
const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/:uidAgenda/:uidEvent', authMiddleware, addFav)
router.get('/', authMiddleware, getFav)

module.exports = router