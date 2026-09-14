const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

/* En tant qu’utilisateur, je veux pouvoir ajouter et consulter un événement sur mes favoris afin de le retrouver facilement sur mon profil. */

exports.addFav = async (req, res) => {
    try {

        const userId = req.user.id_user;
        const { uuidEvent } = req.params

        if (!uuidEvent) {
            return res.status(400).json({
                message: "L'uuidEvent est obligatoire"
            })
        }

        const favExist = await sequelize.query(`
            SELECT 1
            FROM "Favoris"
            WHERE fk_id_user = :userId AND uuid_event = :uuidEvent
        `, {
            replacements: { userId, uuidEvent },
            type: QueryTypes.SELECT
        })

        if (favExist.length > 0) {
            return res.status(409).json({
                message: "Cet événement est déjà dans vos favoris"
            })
        }

        await sequelize.query(`
            INSERT INTO "Favoris" (fk_id_user, uuid_event, date_ajout)
            VALUES (:userId, :uuidEvent, CURRENT_DATE)
        `, {
            replacements: {
                userId,
                uuidEvent
            },
            type: QueryTypes.INSERT
        })

        return res.status(201).json({
            message: "Événement ajouté aux favoris"
        })

    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Erreur lors de l'ajout aux favoris"
        })
    }
}

exports.getFav = async (req, res) => {
    try {
        const userId = req.user.id_user;
        const API_KEY_DATATOURISME = process.env.API_KEY_DATATOURISME;

        const favoris = await sequelize.query(` 
            SELECT uuid_event, date_ajout 
            FROM "Favoris" 
            WHERE fk_id_user = :id_user 
            ORDER BY date_ajout DESC
        `, {
            replacements: { id_user: userId },
            type: QueryTypes.SELECT
        });

        async function findCategory(name) {
            const existing = await sequelize.query(`
                SELECT id_category FROM "Categories" WHERE name_category = :name
            `, {
                replacements: { name },
                type: QueryTypes.SELECT
            });

            if (existing.length > 0) {
                return existing[0].id_category;
            }

            const created = await sequelize.query(`
                INSERT INTO "Categories" (name_category) VALUES (:name) RETURNING id_category
            `, {
                replacements: { name },
                type: QueryTypes.INSERT
            });

            return created[0][0].id_category;
        }

        const events = await Promise.all(
            favoris.map(async (fav) => {
                const response = await fetch(
                    `https://api.datatourisme.fr/v1/catalog/${fav.uuid_event}`,
                    {
                        method: "GET",
                        headers: {
                            "X-API-Key": API_KEY_DATATOURISME,
                        }
                    }
                );

                if (!response.ok) {
                    return null;
                }

                const data = await response.json();

                const eventExist = await sequelize.query(`
                    SELECT 1 FROM "Events" WHERE uid_event = :uidEvent
                `, {
                    replacements: { uidEvent: fav.uuid_event },
                    type: QueryTypes.SELECT
                });

                if (eventExist.length === 0) {
                    const title = data.label?.['@fr'] || data.label?.['@en'] || 'Titre non disponible';
                    const shortDesc = data.hasDescription?.[0]?.shortDescription?.['@fr'] || null;
                    const desc = data.comment?.['@fr'] || null;
                    
                    const location = data.isLocatedAt?.[0];
                    const addressObj = location?.address?.[0];
                    const city = addressObj?.hasAddressCity?.label?.['@fr'] || addressObj?.addressLocality || null;
                    const address = addressObj?.streetAddress ? addressObj.streetAddress.join(', ') : null;

                    const imageUrl = data.hasMainRepresentation?.[0]?.hasObservation?.[0]?.hasUrl || null;
                    const sourceUrl = data.hasContact?.[0]?.homepage?.[0] || data.uri || null;
                    const dateEvent = data.takesPlaceAt?.[0]?.startDate || null;
                    const priceEvent = null;

                    const idCategory = await findCategory('Autre');

                    await sequelize.query(` 
                        INSERT INTO "Events" (uid_event, title_event, shortdesc_event, desc_event, date_event, img_url, place_event, city_event, source_url, price_event, fk_id_category)
                        VALUES (:uidEvent, :title, :shortDesc, :desc, :dateEvent, :imgUrl, :placeEvent, :city, :sourceUrl, :priceEvent, :idCategory)
                    `, {
                        replacements: {
                            uidEvent: fav.uuid_event,
                            title,
                            shortDesc,
                            desc,
                            dateEvent,
                            imgUrl: imageUrl,
                            placeEvent: address,
                            city,
                            sourceUrl,
                            priceEvent,
                            idCategory
                        },
                        type: QueryTypes.INSERT
                    });
                }

                return {
                    ...data,
                    date_ajout: fav.date_ajout
                };
            })
        );

        const validEvents = events.filter(Boolean);

        return res.status(200).json({
            favoris: validEvents
        });

    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de l'affichage des favoris"
        });
    }
};

exports.deleteFav = async (req, res) => {
    try {

        const userId = req.user.id_user
        const { uidEvent } = req.params

        await sequelize.query(`
            DELETE FROM "Favoris"
            WHERE fk_id_user = :userId AND uuid_event = :uidEvent
        `, {
            replacements: { userId, uidEvent },
            type: QueryTypes.DELETE
        })

        return res.status(200).json({
            message: "Retiré des favoris"
        })

    } catch (err) {
        return res.status(500).json({
            message: "Erreur lors de la suppresion du favori"
        })
    }
}
