const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

/* En tant qu'utilisateur, je veux rechercher un événement par mot-clé ou par lieu, afin de trouver rapidement une sortie qui m'intéresse. */

exports.getEvent = async (req, res) => {
    try {
        const API_KEY_DATATOURISME = process.env.API_KEY_DATATOURISME;
        const { keyword, department } = req.query;

        if (!keyword && !department) {
            return res.status(400).json({
                message: "Veuillez renseigner un mot-clé ou une ville"
            });
        }

        const url = `https://api.datatourisme.fr/v1/entertainmentAndEvent?search=${keyword.toString()}&lang=fr&department=${department.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-API-Key": API_KEY_DATATOURISME,
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json({ data });

    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de la recherche des événements."
        });
    }
};

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