// Routes dédiées aux articles
import express from "express";
import { initDb } from "../models/db.js";
// Import du middleware de protection (le chemin doit pointer vers auth.js)
import { protectRoute } from './auth.js';

const router = express.Router();

/* - - - - - - - - - - - - - - Récapitulatif du CRUD complet - - - - - - - - - - - -
GET / : Lire la liste
GET /search : Rechercher par mots-clés (Scanner)  <-- NOUVEAU
GET /:id : Lire un seul article (détail)
GET /new : Afficher le formulaire de création
POST /new : Créer l'article (avec Tags)           <-- MIS À JOUR
GET /edit/:id : Afficher le formulaire d'édition
POST /edit/:id : Modifier l'article (Update)
POST /delete/:id : Supprimer l'article (Delete)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

// ---------------- 1. LIRE LA LISTE DES ARTICLES ----------------
router.get("/", async (req, res) => {
    const db = await initDb();
    const articles = await db.all("SELECT * FROM articles ORDER BY created_at DESC");
    res.render("articles", { title: "Tous les articles", articles });
});


// ---------------- 2. ON AFFICHE LE FORMULAIRE POUR AJOUTER UN ARTICLE ----------------
router.get("/new", protectRoute, (req, res) => {
    res.render("newArticle", { title: "Créer un nouvel article" });
});


// ---------------- 3. ON GÈRE L'INSERTION DANS LA BDD (AVEC TAGS) ----------------
router.post("/new", protectRoute, async (req, res) => {
    // On récupère title, content ET tags du formulaire
    const { title, content, tags } = req.body;
    const author = req.session.username;
    const user_id = req.session.userId;

    if (!title || !content) {
        return res.status(400).send("Tous les champs sont obligatoires.");
    }

    try {
        const db = await initDb();

        // A. Insertion de l'article dans la table 'articles'
        const result = await db.run(
            "INSERT INTO articles (title, content, author, user_id) VALUES (?, ?, ?, ?)",
            [title, content, author, user_id]
        );

        // On récupère l'ID de l'article qu'on vient de créer pour lier les tags
        const articleId = result.lastID;

        // B. Gestion des mots-clés (Système d'indexation E5)
        if (tags && tags.trim() !== "") {
            // On transforme la chaîne "tech, bts" en tableau ["tech", "bts"]
            const tagArray = tags.split(',').map(t => t.trim().toLowerCase());

            for (const tagName of tagArray) {
                if (tagName === "") continue;

                // On insère le tag s'il n'existe pas encore (IGNORE évite les erreurs de doublons)
                await db.run("INSERT OR IGNORE INTO tags (name) VALUES (?)", [tagName]);

                // On récupère l'ID du tag
                const tag = await db.get("SELECT id FROM tags WHERE name = ?", [tagName]);

                // On crée la liaison dans la table pivot 'article_tags'
                await db.run(
                    "INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)",
                    [articleId, tag.id]
                );
            }
        }

        res.redirect("/articles");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout de l'article");
    }
});


// ---------------- 4. MOTEUR DE RECHERCHE (SCANNER PAR PERTINENCE) ----------------
// NOTE IMPORTANTE : Cette route doit être AVANT /:id sinon Express confond "search" avec un ID.
router.get("/search", async (req, res) => {
    const queryTags = req.query.tags;

    if (!queryTags) return res.redirect("/articles");

    const searchTerms = queryTags.split(',').map(tag => tag.trim().toLowerCase());
    const totalKeywords = searchTerms.length;

    try {
        const db = await initDb();

        // Requête SQL complexe pour calculer la compatibilité en %
        const sql = `
            SELECT a.*, 
                   COUNT(t.name) as nb_match,
                   (CAST(COUNT(t.name) AS FLOAT) / ?) * 100 as relevance
            FROM articles a
            JOIN article_tags at ON a.id = at.article_id
            JOIN tags t ON at.tag_id = t.id
            WHERE t.name IN (${searchTerms.map(() => '?').join(',')})
            GROUP BY a.id
            ORDER BY relevance DESC
        `;

        const articles = await db.all(sql, [totalKeywords, ...searchTerms]);

        res.render("articles", {
            articles,
            searchQuery: queryTags,
            isSearch: true,
            title: "Résultat du Scan"
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors du scan du réseau.");
    }
});


// ---------------- 5. ON AFFICHE UN ARTICLE PAR SON ID ----------------
router.get("/:id", async (req, res) => {
    const articleId = req.params.id;
    try {
        const db = await initDb();
        const article = await db.get("SELECT * FROM articles WHERE id = ?", [articleId]);

        if (article) {
            res.render("articleDetail", { article: article, title: article.title });
        } else {
            res.status(404).send("Article non trouvé.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération.");
    }
});


// ---------------- 6. ON GÈRE LA MODIFICATION D'UN ARTICLE ----------------
router.get("/edit/:id", protectRoute, async (req, res) => {
    const articleId = req.params.id;
    const currentUserId = req.session.userId;

    try {
        const db = await initDb();
        const article = await db.get("SELECT * FROM articles WHERE id = ?", [articleId]);

        if (!article || article.user_id !== currentUserId) {
            return res.status(403).send("Accès refusé.");
        }

        res.render("editArticle", { article: article, title: `Modifier ${article.title}` });
    } catch (error) {
        res.status(500).send("Erreur lors du chargement de l'édition.");
    }
});

router.post("/edit/:id", protectRoute, async (req, res) => {
    const articleId = req.params.id;
    const currentUserId = req.session.userId;
    const { title, content } = req.body;

    try {
        const db = await initDb();
        const article = await db.get("SELECT user_id FROM articles WHERE id = ?", [articleId]);

        if (!article || article.user_id !== currentUserId) {
            return res.status(403).send("Accès refusé.");
        }

        await db.run(
            "UPDATE articles SET title = ?, content = ? WHERE id = ?",
            [title, content, articleId]
        );
        res.redirect(`/articles/${articleId}`);
    } catch (error) {
        res.status(500).send("Erreur lors de la modification.");
    }
});


// ---------------- 7. ON GÈRE LA SUPPRESSION D'UN ARTICLE ----------------
router.post("/delete/:id", protectRoute, async (req, res) => {
    const articleId = req.params.id;
    const currentUserId = req.session.userId;

    try {
        const db = await initDb();
        const article = await db.get("SELECT user_id FROM articles WHERE id = ?", [articleId]);

        if (!article || article.user_id !== currentUserId) {
            return res.status(403).send("Accès refusé.");
        }

        await db.run("DELETE FROM articles WHERE id = ?", [articleId]);
        res.redirect("/articles");
    } catch (error) {
        res.status(500).send("Erreur lors de la suppression.");
    }
});

export default router;