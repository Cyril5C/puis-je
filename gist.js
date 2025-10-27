// Module pour gérer la sauvegarde des parties sur GitHub Gist ou fichier local

const fs = require('fs').promises;
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;
const LOCAL_FILE = path.join(__dirname, 'games-local.json');

const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

/**
 * Récupérer les données du fichier local
 */
async function getLocalData() {
    try {
        const data = await fs.readFile(LOCAL_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si le fichier n'existe pas, retourner une structure vide
        return { games: [], stats: { totalGames: 0 } };
    }
}

/**
 * Sauvegarder les données dans le fichier local
 */
async function saveLocalData(data) {
    try {
        await fs.writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving to local file:', error);
        return false;
    }
}

/**
 * Récupérer les données du Gist
 */
async function getGistData() {
    if (!GITHUB_TOKEN || !GIST_ID) {
        console.warn('GitHub credentials not configured. Using local file.');
        return await getLocalData();
    }

    try {
        const response = await fetch(GIST_API_URL, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const gist = await response.json();
        const filename = Object.keys(gist.files)[0]; // Premier fichier du gist
        const content = gist.files[filename].content;

        return JSON.parse(content);
    } catch (error) {
        console.error('Error fetching gist:', error);
        return { games: [] };
    }
}

/**
 * Sauvegarder les données dans le Gist
 */
async function saveGistData(data) {
    if (!GITHUB_TOKEN || !GIST_ID) {
        console.warn('GitHub credentials not configured. Using local file.');
        return await saveLocalData(data);
    }

    try {
        console.log('📤 Tentative de sauvegarde dans le Gist:', GIST_ID);
        const response = await fetch(GIST_API_URL, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    'puisje-games.json': {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`❌ GitHub API error: ${response.status} - ${errorBody}`);
            throw new Error(`GitHub API error: ${response.status} - ${errorBody}`);
        }

        console.log('✅ Partie sauvegardée avec succès dans le Gist');
        return true;
    } catch (error) {
        console.error('❌ Error saving to gist:', error.message);
        // Fallback sur le fichier local en cas d'erreur
        console.warn('⚠️ Fallback: sauvegarde dans le fichier local');
        return await saveLocalData(data);
    }
}

/**
 * Ajouter une nouvelle partie
 */
async function addGame(gameData) {
    const data = await getGistData();

    // Ajouter la nouvelle partie
    const game = {
        id: Date.now(),
        date: new Date().toISOString(),
        ...gameData
    };

    // Ne sauvegarder dans les meilleurs scores que si savedToLeaderboard est true
    if (gameData.savedToLeaderboard !== false) {
        data.games.push(game);

        // Mettre à jour les stats globales
        if (!data.stats) {
            data.stats = {};
        }
        data.stats.totalGames = data.games.length;
        data.stats.lastUpdate = new Date().toISOString();

        // Sauvegarder
        const success = await saveGistData(data);

        return success ? game : null;
    } else {
        console.log('⏱️ Partie non sauvegardée (durée < 15min)');
        return game; // Retourner quand même le jeu sans le sauvegarder
    }
}

/**
 * Récupérer les statistiques
 */
async function getStats() {
    const data = await getGistData();
    const games = data.games || [];

    // Calculer les stats
    const totalGames = games.length;
    const totalPlayers = games.reduce((sum, g) => sum + (g.players?.length || 0), 0);

    // Top winners
    const winnerCounts = {};
    games.forEach(game => {
        if (game.winner) {
            winnerCounts[game.winner] = (winnerCounts[game.winner] || 0) + 1;
        }
    });

    const topWinners = Object.entries(winnerCounts)
        .map(([name, wins]) => ({ name, wins }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10);

    // Top 3 meilleurs scores (scores les plus bas)
    const allScores = [];
    games.forEach(game => {
        if (game.winnerScore !== undefined && game.winner) {
            allScores.push({
                score: game.winnerScore,
                player: game.winner,
                date: game.date
            });
        }
    });

    // Trier par score croissant (le plus bas est le meilleur) et prendre les 5 premiers
    const bestScores = allScores
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);

    // Score moyen par manche
    const scoresByRound = {};
    games.forEach(game => {
        if (game.rounds) {
            game.rounds.forEach(round => {
                if (!scoresByRound[round.number]) {
                    scoresByRound[round.number] = {
                        mission: round.mission,
                        scores: []
                    };
                }
                if (round.scores) {
                    round.scores.forEach(s => scoresByRound[round.number].scores.push(s.score));
                }
            });
        }
    });

    const averageScoresByRound = Object.entries(scoresByRound).map(([round, data]) => ({
        round: parseInt(round),
        mission: data.mission,
        averageScore: data.scores.length > 0
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
            : 0
    }));

    return {
        totalGames,
        totalPlayers,
        averagePlayersPerGame: totalGames > 0 ? Math.round(totalPlayers / totalGames * 10) / 10 : 0,
        bestScores,
        topWinners,
        averageScoresByRound,
        lastUpdate: data.stats?.lastUpdate || null
    };
}

module.exports = {
    getGistData,
    saveGistData,
    addGame,
    getStats
};
