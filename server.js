const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Cache control pour les assets
app.use((req, res, next) => {
    // Cache les assets statiques pendant 1 jour
    if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 jour
    }
    next();
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback pour toutes les routes vers index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Application accessible sur http://localhost:${PORT}`);
});
