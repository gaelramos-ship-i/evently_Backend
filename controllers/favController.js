const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

/* En tant qu’utilisateur, je veux pouvoir ajouter et consulter un événement sur mes favoris afin de le retrouver facilement sur mon profil. */

exports.addFav = async (req, res) => {
    try {

        const userId = req.user.id_user;
        const { uidEvent, uidAgenda } = req.params

        if (!uidEvent || !uidAgenda) {
            return res.status(400).json({
                message: "L'uidEvent et uidAgenda sont obligatoire"
            })
        }

        const favExist = await sequelize.query(`
            SELECT 1
            FROM "Favoris"
            WHERE fk_id_user = :userId AND uid_event = :uidEvent
        `, {
            replacements: { userId, uidEvent },
            type: QueryTypes.SELECT
        })

        if (favExist.length > 0) {
            return res.status(409).json({
                message: "Cet événement est déjà dans vos favoris"
            })
        }

        await sequelize.query(`
            INSERT INTO "Favoris" (fk_id_user, uid_event, uid_agenda, date_ajout)
            VALUES (:userId, :uidEvent, :uidAgenda, CURRENT_DATE)
        `, {
            replacements: {
                userId,
                uidEvent,
                uidAgenda
            },
            type: QueryTypes.INSERT
        })

        return res.status(201).json({
            message: "Événement ajouté aux favoris"
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Erreur lors de l'ajout aux favoris"
        })
    }
}

exports.getFav = async (req, res) => {
    try {

        const userId = req.user.id_user;

        const favoris = await sequelize.query(` 
            SELECT uid_agenda, uid_event, date_ajout 
            FROM "Favoris" 
            WHERE fk_id_user = :id_user 
            ORDER BY date_ajout DESC
        `, {
            replacements: { id_user: userId },
            type: QueryTypes.SELECT
        })

        const events = await Promise.all(
            favoris.map(async (fav) => {
                const response = await fetch(
                    `https://api.openagenda.com/v2/agendas/${fav.uid_agenda}/events/${fav.uid_event}`,
                    {
                        method: "GET",
                        headers: {
                            key: process.env.API_KEY_OPENAGENDA,
                        }
                    }
                )

                if (!response.ok) {
                    return null
                }

                const data = await response.json()

                return {
                    ...data.event,
                    date_ajout: fav.date_ajout
                }
            })
        )

        const validEvents = events.filter(Boolean)

        return res.status(200).json({
            favoris: validEvents
        })

    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de l'affichage des favoris"
        })
    }
}
