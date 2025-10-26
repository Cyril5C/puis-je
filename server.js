const express = require('express');
const path = require('path');
const { addGame, getStats } = require('./gist');
const { checkPlayers, addPlayers, getAllPlayerNames, getPlayers, updateMultiplePlayersStats } = require('./players');

const app = express();
const PORT = process.env.PORT || 3000;
const TEST_MODE = process.env.TEST_MODE === 'true';
const APP_PASSWORD = process.env.APP_PASSWORD || 'lesplantes';

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
            // GitHub non configuré, renvoyer succès quand même
            res.json({ success: true, message: 'GitHub not configured, game not saved remotely' });
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

// Récupérer la configuration (mode test, mot de passe, etc.)
app.get('/api/config', (_req, res) => {
    res.json({
        testMode: TEST_MODE,
        maxRounds: TEST_MODE ? 1 : 5,
        appPassword: APP_PASSWORD
    });
});

// Vérifier si des pseudos existent déjà
app.post('/api/players/check', async (req, res) => {
    try {
        const { names } = req.body;
        const existingPlayers = await checkPlayers(names);
        res.json({ existingPlayers });
    } catch (error) {
        console.error('Error checking players:', error);
        res.status(500).json({ error: error.message });
    }
});

// Enregistrer de nouveaux pseudos
app.post('/api/players/register', async (req, res) => {
    try {
        const { names } = req.body;
        const added = await addPlayers(names);
        res.json({ success: true, added });
    } catch (error) {
        console.error('Error registering players:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtenir tous les joueurs avec leurs stats
app.get('/api/players', async (req, res) => {
    try {
        const data = await getPlayers();
        res.json(data);
    } catch (error) {
        console.error('Error getting players:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour les stats des joueurs après une partie
app.post('/api/players/update-stats', async (req, res) => {
    try {
        const { players } = req.body; // Format: [{ name, won, finalScore }, ...]
        const success = await updateMultiplePlayersStats(players);
        res.json({ success });
    } catch (error) {
        console.error('Error updating players stats:', error);
        res.status(500).json({ success: false, error: error.message });
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
