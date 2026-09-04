const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

/* En tant qu'utilisateur, je veux rechercher un événement par mot-clé ou par lieu, afin de trouver rapidement une sortie qui m'intéresse. */

exports.getEvent = async (req, res) => {
    try {
        const API_KEY_OPENAGENDA = process.env.API_KEY_OPENAGENDA
        const { keyword, location } = req.query

        if (!keyword && !location) {
            return res.status(400).json({
                message: "Veuillez renseigner un mot-clé ou une ville"
            })
        }

        const search = keyword || location

        const response = await fetch(
            `https://api.openagenda.com/v2/agendas?search=${search}`,
            {
                method: "GET",
                headers: {
                    key: API_KEY_OPENAGENDA,
                }
            }
        )

        const data = await response.json()

        if (!response.ok) {
            return res.status(response.status).json(data)
        }

        const agendaUIDs = data.agendas.map(agenda => agenda.uid)

        const results = await Promise.all(
            agendaUIDs.map(async (uid) => {
                const response = await fetch(
                    `https://api.openagenda.com/v2/agendas/${uid}/events?search=${search}`,
                    {
                        method: "GET",
                        headers: {
                            key: API_KEY_OPENAGENDA,
                        }
                    }
                )

                if (!response.ok) {
                    return []
                }

                return await response.json()
            })
        )
        const events = results.flatMap(result => result.events || [])

        return res.status(200).json({
            events
        })

    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de la recherche des événements."
        })
    }
}

exports.getDetails = async (req, res) => {
    try {
        const { idEvent } = req.params

        const details = await sequelize.query(`
            SELECT id_event, title_event, desc_event, date_event, price_event, img_url, place_event, city_event, source_url, shortdesc_event, uid_event, fk_id_category FROM "Events" WHERE id_event = :idEvent
        `, {
            replacements: { idEvent },
            type: QueryTypes.SELECT
        })

        return res.status(200).json({
            data: details
        })

    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de la l'affichage du détail."
        })
    }
}