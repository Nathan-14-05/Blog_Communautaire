// routes/auth.js

import express from 'express';
import { initDb } from '../models/db.js'; // Assure-toi que ce chemin est correct
import bcrypt from 'bcrypt';

const router = express.Router();

// -----------------------------------------------------------------
// 1. ROUTES D'INSCRIPTION (/register)
// -----------------------------------------------------------------

// Route GET : Affiche le formulaire d'inscription
router.get("/register", (req, res) => {
    res.render("register", { title: "Inscription" });
});

// Route POST : Traite le formulaire d'inscription
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Validation de base
    if (!username || !email || !password) {
        return res.status(400).render("register", {
            title: "Inscription",
            error: "Veuillez remplir tous les champs."
        });
    }

    try {
        const db = await initDb();

        // 2. Vérification d'existence (optionnel, mais recommandé)
        const existingUser = await db.get(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existingUser) {
            return res.status(400).render("register", {
                title: "Inscription",
                error: "Ce nom d'utilisateur ou email est déjà utilisé."
            });
        }

        // 3. Hachage du mot de passe (CRUCIAL pour la sécurité)
        // 10 est le "saltRounds", une valeur standard pour la sécurité.
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Insertion dans la BDD
        await db.run(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        // 5. Redirection après succès
        res.redirect("/login"); // On redirige vers la page de connexion

    } catch (error) {
        console.error("Erreur d'inscription:", error);
        res.status(500).send("Erreur interne du serveur lors de l'inscription.");
    }
});


// -----------------------------------------------------------------
// 2. NOUVEAU : ROUTES DE CONNEXION (/login)
// -----------------------------------------------------------------

// Route GET : Affiche le formulaire de connexion (C'est celle que tu cherchais)
router.get("/login", (req, res) => {
    // La variable 'error' est utilisée si la connexion échoue (voir route POST)
    res.render("login", { title: "Connexion" });
});

// Route POST : Traite le formulaire de connexion
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).render("login", {
            title: "Connexion",
            error: "Veuillez entrer votre nom d'utilisateur et mot de passe."
        });
    }

    try {
        const db = await initDb();

        // 1. Récupérer l'utilisateur par nom d'utilisateur
        const user = await db.get(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (!user) {
            return res.status(401).render("login", {
                title: "Connexion",
                error: "Nom d'utilisateur ou mot de passe incorrect."
            });
        }

        // 2. Comparer le mot de passe soumis avec le hash stocké
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            // 3. Connexion réussie : Création de la session
            req.session.userId = user.id;
            req.session.username = user.username;

            res.redirect("/articles"); // Redirection vers la liste des articles
        } else {
            // Mot de passe incorrect
            res.status(401).render("login", {
                title: "Connexion",
                error: "Nom d'utilisateur ou mot de passe incorrect."
            });
        }

    } catch (error) {
        console.error("Erreur de connexion:", error);
        res.status(500).send("Erreur interne du serveur lors de la connexion.");
    }
});


// -----------------------------------------------------------------
// 3. NOUVEAU : ROUTE DE DÉCONNEXION (/logout)
// -----------------------------------------------------------------

router.get("/logout", (req, res) => {
    // Détruire la session
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erreur lors de la déconnexion.");
        }
        res.redirect('/'); // Redirection vers la page d'accueil
    });
});

// -----------------------------------------------------------------
// Middleware de protection des routes
// -----------------------------------------------------------------
export function protectRoute(req, res, next) {
    if (req.session.userId) {
        // L'utilisateur est connecté (ID trouvé dans la session), on continue vers la route demandée
        next();
    } else {
        // L'utilisateur n'est PAS connecté
        // On le redirige vers la page de connexion
        res.redirect('/login');
    }
}
export default router;