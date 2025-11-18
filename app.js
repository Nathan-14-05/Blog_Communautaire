// C'EST LES EXPRESSSSSSSSSSSS


//------------------- ON IMPORTE __DIRNAME -----------

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------- ON IMPORTE PATH ------------

import path from "path";

// ---------------- ON IMPORTE EXPRESS ------


import express from "express";
const app = express();
const port = 3000; // Souvent port 80 (pour tout ce qui est http)


// ---------------- MIDDLEWARES POUR PARSER LES FORMULAIRES ------
app.use(express.urlencoded({ extended: true }));  // Pour parser les formulaires HTML (<form>)
app.use(express.json());                          // Pour parser du JSON (si un jour tu fais une API)



// ---------------- ON IMPORTE EXPRESS-HANDLEBARS ------

import { engine } from 'express-handlebars';


// ---------------- ON IMPORTE articles.js ------

import articlesRoutes from "./routes/articles.js";


// -------------- START --------------

console.log(path.join(__dirname, "views"))

// Vous pouvez maintenant utiliser __dirname ici
// app.use(express.static(path.join(__dirname, "views")))

// ---------------- ON CONFIGURE HANDLEBARS ------

// Configuration Handlebars

app.engine('handlebars', engine())
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, "public")))


app.get("/", (req, res, suivant) => {
    res.render("home", {title: "Home"});
})

app.get("/about", (req, res, suivant) => {
    res.render("about", {title: "About"});
})

app.use("/articles", articlesRoutes);






// ---------------- ON LANCE LE SERVEUR ------
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})