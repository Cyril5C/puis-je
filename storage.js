// Gestion du stockage localStorage pour les scores du jeu

const Storage = {
    // Clé pour stocker les scores
    SCORES_KEY: 'puisje_scores',
    GAME_STATE_KEY: 'puisje_game_state',
    LAST_PLAYERS_KEY: 'puisje_last_players',

    /**
     * Sauvegarder les scores
     * @param {Object} scores - Objet contenant les scores
     */
    saveScores(scores) {
        try {
            localStorage.setItem(this.SCORES_KEY, JSON.stringify(scores));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des scores:', error);
            return false;
        }
    },

    /**
     * Récupérer les scores
     * @returns {Object} Scores sauvegardés ou objet vide
     */
    getScores() {
        try {
            const scores = localStorage.getItem(this.SCORES_KEY);
            return scores ? JSON.parse(scores) : {};
        } catch (error) {
            console.error('Erreur lors de la récupération des scores:', error);
            return {};
        }
    },

    /**
     * Sauvegarder l'état du jeu
     * @param {Object} gameState - État actuel du jeu
     */
    saveGameState(gameState) {
        try {
            localStorage.setItem(this.GAME_STATE_KEY, JSON.stringify(gameState));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état du jeu:', error);
            return false;
        }
    },

    /**
     * Récupérer l'état du jeu
     * @returns {Object|null} État du jeu ou null
     */
    getGameState() {
        try {
            const state = localStorage.getItem(this.GAME_STATE_KEY);
            return state ? JSON.parse(state) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'état du jeu:', error);
            return null;
        }
    },

    /**
     * Supprimer l'état du jeu
     */
    clearGameState() {
        try {
            localStorage.removeItem(this.GAME_STATE_KEY);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'état du jeu:', error);
            return false;
        }
    },

    /**
     * Sauvegarder les derniers joueurs
     * @param {Array} players - Noms des joueurs
     */
    saveLastPlayers(players) {
        try {
            localStorage.setItem(this.LAST_PLAYERS_KEY, JSON.stringify(players));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des derniers joueurs:', error);
            return false;
        }
    },

    /**
     * Récupérer les derniers joueurs
     * @returns {Array|null} Noms des derniers joueurs ou null
     */
    getLastPlayers() {
        try {
            const players = localStorage.getItem(this.LAST_PLAYERS_KEY);
            return players ? JSON.parse(players) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération des derniers joueurs:', error);
            return null;
        }
    },

    /**
     * Réinitialiser tout le stockage
     */
    clearAll() {
        try {
            localStorage.removeItem(this.SCORES_KEY);
            localStorage.removeItem(this.GAME_STATE_KEY);
            localStorage.removeItem(this.LAST_PLAYERS_KEY);
            return true;
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            return false;
        }
    }
};
