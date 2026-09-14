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

    before(async () => {
        await sequelize.authenticate()
    })

    after(async () => {
        await sequelize.close()
    })

    test('register - création de compte', async () => {
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
})