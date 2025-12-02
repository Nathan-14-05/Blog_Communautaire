// Routes dédiées aux articles

import express from "express";
import { initDb } from "../models/db.js";
import e from "express";
// Import du middleware de protection (le chemin doit pointer vers auth.js)
import { protectRoute } from './auth.js';

const router = express.Router();

router.get("/", async (req, res) => {
    const db = await initDb();
    const articles = await db.all("SELECT * FROM articles ORDER BY created_at DESC");

    res.render("articles", { title: "Tous les articles", articles });
});

/* - - - - - - - - - - - - - - Récapitulatif du CRUD complet - - - - - - - - - - - -

GET / : Lire la liste

GET /:id : Lire un seul article (détail)

GET /new : Afficher le formulaire de création

POST /new : Créer l'article

GET /edit/:id : Afficher le formulaire d'édition

POST /edit/:id : Modifier l'article (Update)

POST /delete/:id : Supprimer l'article (Delete)


 */



// ---------------- ON AFFICHE LE FORMULAIRE POUR AJOUTER UN ARTICLE ----------------

// Afficher le formulaire pour ajouter un article
router.get("/new", protectRoute, (req, res) => {
    res.render("newArticle", { title: "Créer un nouvel article" });
});


// ---------------- ON GERE L'INSERTION DANS LA BDD ----------------

// Traiter l'envoi du formulaire (insertion dans la BDD)
router.post("/new", protectRoute, async (req, res) => {
    const { title, content } = req.body;

    // // On prend l'auteur de la session (username), PAS du formulaire
    const author = req.session.username;
    const user_id = req.session.userId; // <-- AJOUT CRITIQUE

    if (!title || !content) {
        return res.status(400).send("Tous les champs sont obligatoires.");
    }

    try {
        const db = await initDb();
        await db.run(
            "INSERT INTO articles (title, content, author, user_id) VALUES (?, ?, ?, ?)",
            [title, content, author, user_id]
        );

        // Après l'insertion, on redirige vers la liste
        res.redirect("/articles");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout de l'article");
    }
});

// ---------------- ON AFFICHE UN ARTICLE PAR SON ID ----------------

// Afficher un article détaillé par son ID
router.get("/:id", async (req, res) => {
    // 1. Récupération de l'ID depuis l'URL
    const articleId = req.params.id;

    try {
        const db = await initDb();

        // 2. Requête pour sélectionner UN SEUL article
        // .get() est utilisé pour un résultat unique, et la clause WHERE filtre par ID
        const article = await db.get(
            "SELECT * FROM articles WHERE id = ?",
            [articleId]
        );

        if (article) {
            // 3. Rendu de la vue avec les données de l'article trouvé
            res.render("articleDetail", { article: article, title: article.title });
        } else {
            // Gérer le cas où l'article n'existe pas
            res.status(404).send("Article non trouvé.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération de l'article.");
    }
});


// ---------------- ON GERE LA MODIFICATION D'UN ARTICLE ----------------

// Afficher le formulaire d'édition pour un article spécifique
router.get("/edit/:id", protectRoute, async (req, res) => {
    const articleId = req.params.id;
    const currentUserId = req.session.userId; // ID de l'utilisateur connecté

    try {
        const db = await initDb();

        // 1. VÉRIFICATION D'AUTORISATION
        const article = await db.get("SELECT user_id FROM articles WHERE id = ?", [articleId]);

        if (!article || article.user_id !== currentUserId) {
            return res.status(403).send("Accès refusé. Vous n'êtes pas autorisé à modifier cet article.");
        }

        // 2. Exécution de la mise à jour (si l'autorisation est OK)

        if (article) {
            res.render("editArticle", { article: article, title: `Modifier ${article.title}` });
        } else {
            res.status(404).send("Article à modifier non trouvé.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors du chargement de l'édition.");
    }
});


// Traiter l'envoi du formulaire d'édition (Mise à jour dans la BDD)
router.post("/edit/:id", protectRoute, async (req, res) => {
    const articleId = req.params.id;
    const currentUserId = req.session.userId; // ID de l'utilisateur connecté
    const { title, content } = req.body;

    if (!title || !content || !author) {
        return res.status(400).send("Tous les champs sont obligatoires.");
    }

    try {
        const db = await initDb();

        // 1. Vérification d'autorisation avant la mise à jour
        const article = await db.get("SELECT user_id FROM articles WHERE id = ?", [articleId]);

        if (!article || article.user_id !== currentUserId) {
            return res.status(403).send("Accès refusé. Vous n'êtes pas autorisé à modifier cet article.");
        }

        // 2. Mise à jour (Seulement si l'autorisation est OK)
        await db.run(
            "UPDATE articles SET title = ?, content = ? WHERE id = ?",
            [title, content, articleId]
        );

        res.redirect(`/articles/${articleId}`);

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur interne du serveur.");
    }
});




// ---------------- ON GERE LA SUPPRESSION D'UN ARTICLE ----------------

// Supprimer un article par son ID
router.post("/delete/:id", protectRoute, async (req, res) => {
    const articleId = req.params.id;
    const currentUserId = req.session.userId; // ID de l'utilisateur connecté

    try {
        const db = await initDb();

        // 1. Vérification d'autorisation avant la suppression
        const article = await db.get("SELECT user_id FROM articles WHERE id = ?", [articleId]);

        if (!article || article.user_id !== currentUserId) {
            return res.status(403).send("Accès refusé. Vous n'êtes pas autorisé à supprimer cet article.");
        }

        // 2. Suppression (Seulement si l'autorisation est OK)
        await db.run("DELETE FROM articles WHERE id = ?", [articleId]);

        res.redirect("/articles");

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur interne du serveur.");
    }
});

export default router;
