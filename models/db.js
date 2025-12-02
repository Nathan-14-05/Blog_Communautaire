// Connexion à ma base SQLITE

import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Cette fonction ouvre la base SQLite
export const initDb = async () => {
    const db = await open({
        filename: "./blog_communautaire.db", // chemin vers ton fichier
        driver: sqlite3.Database
    });

    console.log("✅ Connecté à la base SQLite !");


    // 1. SUPPRESSION DE LA TABLE ARTICLES EXISTANTE
    // await db.exec(`DROP TABLE IF EXISTS articles`);

    // -----------------------------------------------------------------
    // 1.1 Création/Vérification de la table ARTICLES (CODE MANQUANT)
    // -----------------------------------------------------------------
    await db.exec(`
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            user_id INTEGER NOT NULL,  /* <-- OBLIGATOIREMENT NOT NULL POUR LES NOUVEAUX */
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            -- Contrainte de clé étrangère qui lie à l'ID de la table users
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // -----------------------------------------------------------------
    // 2. Création/Vérification de la table USERS (Ton code)
    // -----------------------------------------------------------------
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL, 
            password TEXT NOT NULL,         -- Stockera le HASH du mot de passe
            email TEXT UNIQUE NOT NULL
        )
    `);


    // -----------------------------------------------------------------

    return db;
};
