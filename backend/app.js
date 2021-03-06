// Importation des modules
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

// Lance express
const app = express();

// Middleware Helmet afin d'améliorer la sécurité. crossOriginResourcePolicy sur false afin d'autoriser l'affichage des images
app.use(helmet({
  crossOriginResourcePolicy: false,
})
);

// Importation des routes
const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauce');

dotenv.config();

// Connexion a la base de données mango DB
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

// Gestion des CORS pour les connexions entre le back et le front
app.use(cors())

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/sauces', sauceRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;