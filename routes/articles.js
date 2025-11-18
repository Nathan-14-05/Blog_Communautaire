// Routes dédiées aux articles

import express from "express";
import { initDb } from "../models/db.js";
import e from "express";

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
router.get("/new", (req, res) => {
    res.render("newArticle");
});


// ---------------- ON GERE L'INSERTION DANS LA BDD ----------------

// Traiter l'envoi du formulaire (insertion dans la BDD)
router.post("/new", async (req, res) => {
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
        return res.status(400).send("Tous les champs sont obligatoires.");
    }

    try {
        const db = await initDb();
        await db.run(
            "INSERT INTO articles (title, content, author) VALUES (?, ?, ?)",
            [title, content, author]
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
router.get("/edit/:id", async (req, res) => {
    const articleId = req.params.id;

    try {
        const db = await initDb();
        // Récupère l'article actuel pour pré-remplir le formulaire
        const article = await db.get(
            "SELECT * FROM articles WHERE id = ?",
            [articleId]
        );

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
router.post("/edit/:id", async (req, res) => {
    const articleId = req.params.id;
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
        return res.status(400).send("Tous les champs sont obligatoires.");
    }

    try {
        const db = await initDb();

        // Requête UPDATE pour modifier les champs de la ligne ID
        await db.run(
            "UPDATE articles SET title = ?, content = ?, author = ? WHERE id = ?",
            [title, content, author, articleId] // L'ID est le dernier argument
        );

        // Redirection vers l'article modifié
        res.redirect(`/articles/${articleId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'enregistrement des modifications.");
    }
});




// ---------------- ON GERE LA SUPPRESSION D'UN ARTICLE ----------------

// Supprimer un article par son ID
router.post("/delete/:id", async (req, res) => {
    const articleId = req.params.id;

    try {
        const db = await initDb();

        // Requête DELETE pour supprimer la ligne correspondant à l'ID
        await db.run(
            "DELETE FROM articles WHERE id = ?",
            [articleId]
        );

        // Redirection vers la liste des articles après suppression
        res.redirect("/articles");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression de l'article.");
    }
});

export default router;
