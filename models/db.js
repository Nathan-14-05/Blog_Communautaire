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
    return db;
};
