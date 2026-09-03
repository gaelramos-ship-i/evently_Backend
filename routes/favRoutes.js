const express = require('express')
const router = express.Router()
const { addFav, getFav, deleteFav } = require('../controllers/favController')
const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/:uidAgenda/:uidEvent', authMiddleware, addFav)
router.get('/', authMiddleware, getFav)
router.delete('/delete/:uidEvent', authMiddleware, deleteFav)

module.exports = router