// Module pour gérer le registre global des pseudos (local ou GitHub Gist)

const fs = require('fs').promises;
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PLAYERS_GIST_ID = process.env.PLAYERS_GIST_ID;
const LOCAL_FILE = path.join(__dirname, 'players.json');

const GIST_API_URL = `https://api.github.com/gists/${PLAYERS_GIST_ID}`;

/**
 * Récupérer les données du fichier local
 */
async function getLocalPlayers() {
    try {
        const data = await fs.readFile(LOCAL_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { players: [] };
    }
}

/**
 * Sauvegarder les données dans le fichier local
 */
async function saveLocalPlayers(data) {
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
async function getGistPlayers() {
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
        const filename = Object.keys(gist.files)[0];
        const content = gist.files[filename].content;

        return JSON.parse(content);
    } catch (error) {
        console.error('Error fetching players gist:', error);
        return { players: [] };
    }
}

/**
 * Sauvegarder les données dans le Gist
 */
async function saveGistPlayers(data) {
    try {
        const response = await fetch(GIST_API_URL, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    'puisje-players.json': {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error saving to players gist:', error);
        return false;
    }
}

/**
 * Charger la liste des joueurs (Gist ou local)
 */
async function getPlayers() {
    if (!GITHUB_TOKEN || !PLAYERS_GIST_ID) {
        console.warn('Players Gist not configured. Using local file.');
        return await getLocalPlayers();
    }
    return await getGistPlayers();
}

/**
 * Sauvegarder la liste des joueurs (Gist ou local)
 */
async function savePlayers(data) {
    if (!GITHUB_TOKEN || !PLAYERS_GIST_ID) {
        console.warn('Players Gist not configured. Using local file.');
        return await saveLocalPlayers(data);
    }
    return await saveGistPlayers(data);
}

/**
 * Vérifier si un pseudo existe déjà
 */
async function playerExists(name) {
    const data = await getPlayers();
    return data.players.some(player => player.name.toLowerCase() === name.toLowerCase());
}

/**
 * Vérifier si plusieurs pseudos existent déjà
 * Retourne un tableau des pseudos qui existent déjà
 */
async function checkPlayers(names) {
    const data = await getPlayers();
    const existingPlayers = [];

    names.forEach(name => {
        const exists = data.players.some(player => player.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            existingPlayers.push(name);
        }
    });

    return existingPlayers;
}

/**
 * Ajouter un nouveau joueur avec stats initiales
 */
async function addPlayer(name) {
    const data = await getPlayers();

    // Vérifier si le joueur existe déjà
    const exists = data.players.some(player => player.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        return false;
    }

    // Ajouter le nouveau joueur avec stats initiales
    data.players.push({
        name: name,
        createdAt: new Date().toISOString(),
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            bestScore: null,
            bestScoreDate: null
        }
    });

    await savePlayers(data);
    return true;
}

/**
 * Ajouter plusieurs joueurs avec stats initiales
 */
async function addPlayers(names) {
    const data = await getPlayers();
    let added = 0;

    names.forEach(name => {
        const exists = data.players.some(player => player.name.toLowerCase() === name.toLowerCase());
        if (!exists) {
            data.players.push({
                name: name,
                createdAt: new Date().toISOString(),
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    bestScore: null,
                    bestScoreDate: null
                }
            });
            added++;
        }
    });

    if (added > 0) {
        await savePlayers(data);
    }

    return added;
}

/**
 * Obtenir tous les pseudos
 */
async function getAllPlayerNames() {
    const data = await getPlayers();
    return data.players.map(p => p.name);
}

/**
 * Mettre à jour les stats d'un joueur après une partie
 */
async function updatePlayerStats(playerName, won, finalScore) {
    const data = await getPlayers();

    const player = data.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!player) {
        return false;
    }

    // Initialiser les stats si elles n'existent pas
    if (!player.stats) {
        player.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            bestScore: null,
            bestScoreDate: null
        };
    }

    // Mettre à jour les stats
    player.stats.gamesPlayed++;
    if (won) {
        player.stats.gamesWon++;
    }

    // Mettre à jour le meilleur score si c'est un nouveau record personnel
    if (player.stats.bestScore === null || finalScore < player.stats.bestScore) {
        player.stats.bestScore = finalScore;
        player.stats.bestScoreDate = new Date().toISOString();
    }

    await savePlayers(data);
    return true;
}

/**
 * Mettre à jour les stats de plusieurs joueurs après une partie
 */
async function updateMultiplePlayersStats(playersData) {
    const data = await getPlayers();

    playersData.forEach(({ name, won, finalScore }) => {
        const player = data.players.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (player) {
            // Initialiser les stats si elles n'existent pas
            if (!player.stats) {
                player.stats = {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    bestScore: null,
                    bestScoreDate: null
                };
            }

            // Mettre à jour les stats
            player.stats.gamesPlayed++;
            if (won) {
                player.stats.gamesWon++;
            }

            // Mettre à jour le meilleur score si c'est un nouveau record personnel
            if (player.stats.bestScore === null || finalScore < player.stats.bestScore) {
                player.stats.bestScore = finalScore;
                player.stats.bestScoreDate = new Date().toISOString();
            }
        }
    });

    await savePlayers(data);
    return true;
}

module.exports = {
    getPlayers,
    playerExists,
    checkPlayers,
    addPlayer,
    addPlayers,
    getAllPlayerNames,
    updatePlayerStats,
    updateMultiplePlayersStats
};
