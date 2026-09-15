const { test, describe, before, after } = require('node:test')
const assert = require('node:assert')
require('dotenv').config()

const { sequelize } = require('../config/db')

const { addFav, getFav, deleteFav } = require('../controllers/favController')

const createMockRes = () => {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code
            return this
        },
        json(data) {
            this.body = data
            return this
        }
    }
    return res
}

describe("US4: addFav", () => {
    const fakeUuidEvent = "123e4567-e89b-12d3-a456-426614174000"

    after(async () => {
        const userId = userA.id_user
        if (userId) {
            await sequelize.query(
                'DELETE FROM "Favoris" WHERE fk_id_user = :userId',
                { replacements: { userId } }
            )
        }
    })

    test("Doit renvoyer 400 si uuidEvent n'est pas fourni dans les params", async () => {
        const userId = userA.id_user
        const req = {
            user: { id_user: userId },
            params: {}
        }
        const res = createMockRes()

        await addFav(req, res)

        assert.strictEqual(res.statusCode, 400)
        assert.strictEqual(res.body.message, "L'uuidEvent est obligatoire")
    })

    test("Doit renvoyer 201, et ajouter l'événement au favori", async () => {
        const userId = userA.id_user
        const req = {
            user: { id_user: userId },
            params: { uuidEvent: fakeUuidEvent }
        }
        const res = createMockRes()

        await addFav(req, res)

        assert.strictEqual(res.statusCode, 201)
        assert.strictEqual(res.body.message, "Événement ajouté aux favoris")
    })
})