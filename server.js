const express = require('express');
const path = require('path');
const { addGame, getStats } = require('./gist');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

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

// API Routes
// Sauvegarder une partie complète
app.post('/api/games', async (req, res) => {
    try {
        const gameData = req.body;
        const savedGame = await addGame(gameData);

        if (savedGame) {
            res.json({ success: true, game: savedGame });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save game' });
        }
    } catch (error) {
        console.error('Error saving game:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Récupérer les statistiques
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback pour toutes les routes vers index.html (SPA)
app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Application accessible sur http://localhost:${PORT}`);
});
