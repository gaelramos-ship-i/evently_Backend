const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

/* US3: En tant qu'utilisateur, je veux rechercher un événement par mot-clé ou par lieu, afin de trouver rapidement une sortie qui m'intéresse. */

exports.getEvent = async (req, res) => {
    try {
        const API_KEY_OPENAGENDA = process.env.API_KEY_OPENAGENDA
        const { keyword, location } = req.query

        if (!keyword && !location) {
            return res.status(400).json({
                message: "Veuillez renseigner un mot-clé ou une ville"
            })
        }

        const params = new URLSearchParams()

        if (keyword) {
            params.append("search", keyword)
        }

        if (location) {
            params.append("location", location)
        }

        const response = await fetch(
            `https://api.openagenda.com/v2/agendas?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${API_KEY_OPENAGENDA}`,
                }
            }
        )

        const data = await response.json()

        if (!response.ok) {
            return res.status(response.status).json(data)
        }

        const agendaUIDs = data.agendas.map(agenda => agenda.uid)

        const agendas = await Promise.all(
            agendaUIDs.map(async (uid) => {
                const response = await fetch(
                    `https://api.openagenda.com/v2/agendas/${uid}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${API_KEY_OPENAGENDA}`,
                        }
                    }
                )

                if (!response.ok) {
                    return null
                }

                return await response.json()
            })
        )

        return res.status(200).json({
            agendas: agendas.filter(Boolean)
        })

    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de la recherche des événements."
        })
    }
}