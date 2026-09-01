const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

/* US5 : En tant qu’utilisateur, je veux pouvoir ajouter et consulter un événement sur mes favoris afin de le retrouver facilement sur mon profil. */

exports.addFav = async (req, res) => {
    try {

        const userId = req.user.id_user;
        const { eventId } = req.params

        if (!eventId) {
            return res.status(400).json({
                message: "L'eventId est obligatoire"
            })
        }

        await sequelize.query(`
            INSERT INTO "Favoris" (fk_id_user, uid_api, date_ajout)
            VALUES (:userId, :eventId, CURRENT_DATE)
        `, {
            replacements: {
                userId, 
                eventId
            },
            type: QueryTypes.INSERT
        })

        return res.status(201).json({
            message: "Événement ajouté aux favoris"
        })

    } catch (err) {
        console.error("Erreur Sequelize :", err);
        return res.status(500).json({
            message: "Erreur lors de l'ajout aux favoris"
        })
    }
}