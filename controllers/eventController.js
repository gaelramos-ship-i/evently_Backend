const { QueryTypes } = require("sequelize")
const { sequelize } = require("../config/db")

const puppeteer = require("puppeteer");

/* US3: En tant qu'utilisateur, je veux rechercher un événement par mot-clé ou par lieu, afin de trouver rapidement une sortie qui m'intéresse. */

exports.getEvent = async (req, res) => {
    try {
        const { location } = req.query
        if (!location) {
            return res.status(400).json({ message: "veuillez renseigner une ville" })
        }

        const browser = await puppeteer.launch({
            headless: false,
        });

        const page = await browser.newPage();

        const url = `https://www.ticketmaster.fr/fr/${location}`;

        // on considère la page "chargée" quand il y a 2 requêtes réseau actives ou moins pendant au moins 500ms
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Attente explicite du contenu dynamique
        const found = await page.waitForSelector('.event-result-title', { timeout: 10000 })
            .then(() => true)
            .catch(() => false);

        if (!found) {
            await browser.close();
            return res.status(404).json({ message: "Aucun événement trouvé pour cette ville." });
        }

        const results = await page.evaluate(() => {
            const articles = Array.from(document.querySelectorAll('article.event-result'));
            return articles.map(article => ({
                title: article.querySelector('.event-result-title-link')?.textContent.trim(),
                date: article.querySelector('.event-result-date')?.textContent.trim(),
                price: article.querySelector('.event-result-pricing')?.textContent.trim(),
                place: article.querySelector('.event-result-place')?.textContent.trim(),
                genre: article.querySelector('.event-result-genre-item')?.textContent.trim()
            }));
        });

        await browser.close();

        res.json({
            message: "Recherche réussie",
            results
        });

    } catch (err) {
        res.status(500).json({
            message: "Erreur lors de la recherche des événements."
        });
    }
};