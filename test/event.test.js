const { test, describe, before, after } = require('node:test')
const assert = require('node:assert')
require('dotenv').config()

const { sequelize } = require('../config/db')

const { getEvent, getDetails } = require('../controllers/eventController')

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

describe('US3: getEvent', () => {
    test('Doit renvoyer 400 si aucun mot-clé ni département est fourni', async () => {
        const req = { query: {} }
        const res = createMockRes()

        await getEvent(req, res)

        assert.strictEqual(res.statusCode, 400)
        assert.strictEqual(res.body.message, "Veuillez renseigner un mot-clé ou une ville")
    })

    test('Doit renvoyer 200 et la liste des événements si la recherche est valide', async () => {
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

    test("Doit renvoyer 500 si l'API DataTourisme échoue ou plante", async () => {
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

describe("US7: getDetails", () => {
    let fakeEventId

    before(async () => {
        const result = await sequelize.query(`
                INSERT INTO "Events" (title_event, desc_event, shortdesc_event, place_event,city_event) 
                VALUES ('Concert Test', 'Description longue', 'Desc courte', 'Vélodrome','Marseille')
                RETURNING id_event;
            `)
        fakeEventId = result[0][0].id_event
    })

    after(async () => {
        if (fakeEventId) {
            await sequelize.query(
                'DELETE FROM "Events" WHERE id_event = :id',
                { replacements: { id: fakeEventId } }
            )
        }
    })

    test("Doit renvoyer 200 et les détails si l'événement existe", async () => {
        const req = { params: { idEvent: fakeEventId } }
        const res = createMockRes()
        await getDetails(req, res)

        assert.strictEqual(res.statusCode, 200)
        assert.strictEqual(res.body.data[0].title_event, 'Concert Test')
    })
})
