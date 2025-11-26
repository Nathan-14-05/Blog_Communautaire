// app.js

// ==============================================================================
// 1. IMPORTS DES MODULES NODE.JS ET DES DÉPENDANCES
// Tous les 'import' doivent être au niveau le plus élevé (en haut du fichier)
// ==============================================================================

// Imports pour gérer les chemins de fichiers (essentiel pour les chemins relatifs en modules ES)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import path from "path";
import express from "express";
import { engine } from 'express-handlebars';
import session from 'express-session'; // Pour la gestion de la session utilisateur

// Imports des modules personnalisés
import { initDb } from './models/db.js'; // Fonction d'initialisation de la base de données
import articlesRoutes from "./routes/articles.js"; // Routes pour les articles (/articles)
import authRouter from './routes/auth.js';         // Routes pour l'authentification (/login, /register)

// ==============================================================================
// 2. LOGIQUE ASYNCHRONE DE DÉMARRAGE DU SERVEUR
// On utilise 'async/await' pour s'assurer que la BDD est prête avant le lancement.
// ==============================================================================

const port = 3000;

async function startServer() {

    // --- INITIALISATION BDD (Point de Blocage Crucial) ---
    // Le mot-clé 'await' garantit que la création des tables (users, articles)
    // est terminée avant que le serveur Express ne se configure.
    try {
        await initDb();
        console.log("✅ Base de données initialisée avec succès (tables articles et users vérifiées/créées).");
    } catch (error) {
        console.error("❌ Échec de l'initialisation de la BDD et des tables:", error);
        return; // Arrêter l'exécution si la BDD ne démarre pas (Erreur Critique)
    }

    const app = express();

    // --- MIDDLEWARES POUR PARSER LES REQUÊTES ---
    app.use(express.urlencoded({ extended: true }));  // Pour lire les données des formulaires HTML
    app.use(express.json());                          // Pour lire les requêtes JSON

    // --- CONFIGURATION DE LA SESSION UTILISATEUR ---
    app.use(session({
        secret: 'TON_SECRET_TRES_LONG_ET_ALEATOIRE', // CLÉ SECRÈTE : Changez cette valeur pour la production
        resave: false,                              // Ne sauve pas la session si elle n'a pas été modifiée
        saveUninitialized: false,                   // N'initialise pas de session pour les visiteurs non logués
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // Durée de vie du cookie (24 heures)
        }
    }));

    // --- MIDDLEWARE POUR INJECTER LES DONNÉES DE SESSION DANS LES VUES ---
    app.use((req, res, next) => {
        // 'res.locals' rend les variables disponibles dans toutes les vues Handlebars
        res.locals.isAuthenticated = !!req.session.userId; // true si l'utilisateur est logué
        res.locals.userUsername = req.session.username || null;
        next();
    });

    // --- CONFIGURATION DE EXPRESS-HANDLEBARS ---
    app.engine('handlebars', engine());
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, 'views'));

    // --- MIDDLEWARE POUR SERVIR LES FICHIERS STATIQUES (CSS, JS, images) ---
    app.use(express.static(path.join(__dirname, "public")));


    // ==============================================================================
    // 3. DÉFINITION DES ROUTES
    // ==============================================================================

    // Routes de base (Accueil et À Propos)
    app.get("/", (req, res) => {
        res.render("home", {title: "Accueil"});
    });

    app.get("/about", (req, res) => {
        res.render("about", {title: "À Propos"});
    });

    // Montage des routeurs spécifiques
    app.use("/articles", articlesRoutes); // Toutes les routes qui commencent par /articles
    app.use('/', authRouter);             // Toutes les routes d'authentification (/login, /register, /logout)


    // --- LANCEMENT DU SERVEUR ---
    app.listen(port, () => {
        console.log(`📡 Serveur lancé et à l'écoute sur le port ${port}`);
    });
}

// Appel de la fonction asynchrone pour démarrer l'application
startServer();