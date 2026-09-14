const { test, describe, before, after } = require('node:test')
const assert = require('node:assert')
require('dotenv').config()

const { sequelize } = require('../config/db')

const { register, login } = require('../controllers/authController')
const { getEvent, getDetails } = require('../controllers/eventController')
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

describe('Tests des contrôleurs', () => {

    let userA, userB, tokenA
    const testEmails = ['test_us_a@example.com', 'test_us_b@example.com']

    before(async () => {
        await sequelize.authenticate()
        await sequelize.query(
            'DELETE FROM "Users" WHERE "email_user" IN (:emails)',
            { replacements: { emails: testEmails } }
        )
    })

    after(async () => {
        await sequelize.query(
            'DELETE FROM "Users" WHERE "email_user" IN (:emails)',
            { replacements: { emails: testEmails } }
        )
        await sequelize.close()
    })

    test('US1: Register user with email, name, strong password', async () => {
        const reqA = {
            body: {
                name: 'Alice Tester',
                email: 'test_us_a@example.com',
                password: 'Password123!'
            }
        }
        const resA = createMockRes()
        await register(reqA, resA)
        assert.strictEqual(resA.statusCode, 201)
        assert.ok(resA.body.token)
        userA = resA.body.user

        // Register user B
        const reqB = {
            body: {
                name: 'Bob Collaborator',
                email: 'test_us_b@example.com',
                password: 'Password123!'
            }
        }
        const resB = createMockRes()
        await register(reqB, resB)
        assert.strictEqual(resB.statusCode, 201)
        userB = resB.body.user

        // Duplicate email check
        const resDup = createMockRes()
        await register(reqA, resDup)
        assert.strictEqual(resDup.statusCode, 400)
    })

    test('US2: Login user to get secure token', async () => {
        const req = {
            body: {
                email: 'test_us_a@example.com',
                password: 'Password123!'
            }
        }
        const res = createMockRes()
        await login(req, res)
        assert.strictEqual(res.statusCode, 200)
        assert.ok(res.body.token)
        tokenA = res.body.token
    })

    test('US3: Doit renvoyer 400 si aucun mot-clé ni département est fourni', async () => {
        const req = { query: {} }
        const res = createMockRes()

        await getEvent(req, res)

        assert.strictEqual(res.statusCode, 400)
        assert.strictEqual(res.body.message, "Veuillez renseigner un mot-clé ou une ville")
    })

    test('US3: Doit renvoyer 200 et la liste des événements si la recherche est valide', async () => {
        const mockEvents = [{ id: 'idEvent', label: 'Concert de Jazz' }]

        global.fetch = async (url, options) => {
            assert.ok(url.includes('search=concert'))
            assert.ok(url.includes('department=83'))
            assert.strictEqual(options.headers['X-API-Key'], process.env.API_KEY_DATATOURISME)

            return {
                ok: true,
                status: 200,
                json: async () => mockEvents
            }
        }

        const req = {
            query: {
                keyword: 'concert',
                department: '83'
            }
        }
        const res = createMockRes()

        await getEvent(req, res)

        assert.strictEqual(res.statusCode, 200)
        assert.deepStrictEqual(res.body.data, mockEvents)
    })

    test("US3: Doit renvoyer 500 si l'API DataTourisme échoue ou plante", async () => {
        global.fetch = async () => {
            throw new Error('API indisponible')
        }

        const req = {
            query: { keyword: 'concert' }
        }
        const res = createMockRes()

        await getEvent(req, res)

        assert.strictEqual(res.statusCode, 500)
        assert.strictEqual(res.body.message, "Erreur lors de la recherche des événements.")
    })
})