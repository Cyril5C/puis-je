// Fichier principal de l'application

// État de l'application
const App = {
    players: [],
    currentScreen: 'home-screen',
    currentRound: 1,

    // Missions par manche
    missions: {
        1: "Une suite + Un brelan",
        2: "Deux suites",
        3: "Mission 3", // À définir
        4: "Mission 4", // À définir
    },

    // Navigation entre les écrans
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
        this.currentScreen = screenId;
    },

    // Créer les champs de saisie pour les pseudos
    createPlayerInputs(count) {
        const container = document.getElementById('player-inputs');
        container.innerHTML = '';

        for (let i = 1; i <= count; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'player-input-group';

            const label = document.createElement('label');
            label.textContent = `Joueur ${i}`;
            label.setAttribute('for', `player-${i}`);

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `player-${i}`;
            input.name = `player-${i}`;
            input.placeholder = `Pseudo du joueur ${i}`;
            input.required = true;
            input.maxLength = 20;

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            container.appendChild(inputGroup);
        }
    },

    // Afficher la liste des joueurs
    displayPlayers() {
        const container = document.getElementById('players-list');
        container.innerHTML = '';

        this.players.forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';

            const playerName = document.createElement('span');
            playerName.textContent = player.name;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-player-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = () => this.deletePlayer(index);

            playerCard.appendChild(playerName);
            playerCard.appendChild(deleteBtn);
            container.appendChild(playerCard);
        });
    },

    // Supprimer un joueur
    deletePlayer(index) {
        if (this.players.length <= 3) {
            alert('Impossible de supprimer ce joueur. Minimum 3 joueurs requis.');
            return;
        }

        const playerName = this.players[index].name;
        if (confirm(`Voulez-vous vraiment supprimer ${playerName} ?`)) {
            this.players.splice(index, 1);

            // Mettre à jour les IDs
            this.players = this.players.map((player, idx) => ({
                ...player,
                id: idx + 1
            }));

            // Sauvegarder l'état mis à jour
            Storage.saveGameState({
                players: this.players,
                round: 1,
                inProgress: true
            });

            this.displayPlayers();
            console.log('Joueur supprimé:', playerName);
        }
    },

    // Restaurer une partie en cours
    restoreGame(gameState) {
        this.players = gameState.players;
        this.currentRound = gameState.round || 1;
        console.log('Partie restaurée:', gameState);
        this.displayPlayers();
        this.showScreen('game-area');
    },

    // Ajouter un joueur
    addPlayer() {
        if (this.players.length >= 5) {
            alert('Nombre maximum de joueurs atteint (5)');
            return;
        }

        const name = prompt('Pseudo du nouveau joueur:');
        if (name && name.trim()) {
            const newPlayer = {
                id: this.players.length + 1,
                name: name.trim(),
                score: 0
            };
            this.players.push(newPlayer);

            // Sauvegarder l'état mis à jour
            Storage.saveGameState({
                players: this.players,
                round: 1,
                inProgress: true
            });

            this.displayPlayers();
            console.log('Joueur ajouté:', newPlayer);
        }
    },

    // Modifier les joueurs (retour à l'écran de saisie)
    modifyPlayers() {
        this.createPlayerInputs(this.players.length);

        // Pré-remplir les champs avec les noms actuels
        this.players.forEach((player, index) => {
            const input = document.getElementById(`player-${index + 1}`);
            if (input) {
                input.value = player.name;
            }
        });

        this.showScreen('player-names-screen');
    },

    // Démarrer une nouvelle partie
    startGame(playerNames) {
        this.players = playerNames.map((name, index) => ({
            id: index + 1,
            name: name,
            score: 0
        }));

        // Sauvegarder l'état initial
        Storage.saveGameState({
            players: this.players,
            round: 1,
            inProgress: true
        });

        console.log('Partie commencée avec les joueurs:', this.players);
        this.displayPlayers();
        this.showScreen('game-area');
    },

    // Lancer la manche
    startRound() {
        const mission = this.missions[this.currentRound] || "Mission à définir";

        // Mettre à jour le titre et la mission
        document.getElementById('round-title').textContent = `Manche ${this.currentRound}`;
        document.getElementById('mission-text').textContent = mission;

        // Sauvegarder l'état avec la manche en cours
        Storage.saveGameState({
            players: this.players,
            round: this.currentRound,
            mission: mission,
            inProgress: true,
            roundStarted: true
        });

        console.log('Lancement de la manche', this.currentRound, '- Mission:', mission);
        this.showScreen('round-screen');
    },

    // Afficher la sélection du gagnant
    showWinnerSelection() {
        const container = document.getElementById('winner-selection');
        container.innerHTML = '';

        this.players.forEach(player => {
            const btn = document.createElement('button');
            btn.className = 'winner-btn';
            btn.textContent = player.name;
            btn.onclick = () => this.selectWinner(player);
            container.appendChild(btn);
        });

        this.showScreen('winner-screen');
    },

    // Sélectionner le gagnant et afficher le comptage des cartes
    selectWinner(winner) {
        document.getElementById('winner-name').textContent = winner.name;

        const container = document.getElementById('card-counting');
        container.innerHTML = '';

        this.players.forEach(player => {
            if (player.id === winner.id) return; // Le gagnant n'a pas besoin de compter

            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-card-count';

            const playerName = document.createElement('h3');
            playerName.textContent = player.name;

            const inputGroup = document.createElement('div');
            inputGroup.className = 'card-input-group';

            const label = document.createElement('label');
            label.textContent = 'Nombre de cartes';

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '50';
            input.value = '';
            input.placeholder = 'Entrez le nombre';
            input.required = true;
            input.id = `cards-${player.id}`;
            input.oninput = () => this.updatePlayerTotal(player.id);

            const total = document.createElement('div');
            total.className = 'player-total';
            total.id = `total-${player.id}`;
            total.textContent = '';

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);

            playerDiv.appendChild(playerName);
            playerDiv.appendChild(inputGroup);
            playerDiv.appendChild(total);

            container.appendChild(playerDiv);
        });

        // Stocker le gagnant temporairement
        this.currentWinner = winner;

        this.showScreen('card-count-screen');
    },

    // Mettre à jour le total d'un joueur
    updatePlayerTotal(playerId) {
        const input = document.getElementById(`cards-${playerId}`);
        const total = document.getElementById(`total-${playerId}`);
        const cardCount = parseInt(input.value);

        if (input.value && cardCount > 0) {
            total.textContent = `Total: ${cardCount} point${cardCount > 1 ? 's' : ''}`;
        } else {
            total.textContent = '';
        }
    },

    // Valider les scores de la manche
    validateScores() {
        // Vérifier que tous les scores sont remplis et valides
        const losers = this.players.filter(p => p.id !== this.currentWinner.id);
        for (let player of losers) {
            const input = document.getElementById(`cards-${player.id}`);
            const cardCount = parseInt(input.value);

            if (!input.value || cardCount <= 0) {
                alert(`Veuillez entrer un nombre de cartes valide (minimum 1) pour ${player.name}`);
                return;
            }
        }

        // Mettre à jour les scores
        this.players = this.players.map(player => {
            if (player.id === this.currentWinner.id) {
                return { ...player, score: player.score - 20 };
            } else {
                const input = document.getElementById(`cards-${player.id}`);
                const cardCount = parseInt(input.value);
                return { ...player, score: player.score + cardCount };
            }
        });

        // Incrémenter la manche pour la prochaine fois
        this.currentRound++;

        // Sauvegarder les scores
        Storage.saveGameState({
            players: this.players,
            round: this.currentRound,
            inProgress: true,
            roundStarted: false
        });

        console.log('Scores mis à jour:', this.players);

        // Afficher le tableau des scores
        this.showScoreboard();
    },

    // Afficher le tableau des scores
    showScoreboard() {
        const container = document.getElementById('scoreboard-table');
        container.innerHTML = '';

        // Trier les joueurs par score (ordre croissant, le plus petit score gagne)
        const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);

        sortedPlayers.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'scoreboard-row';

            // Mettre en évidence le premier
            if (index === 0) {
                row.classList.add('first-place');
            }

            const rank = document.createElement('div');
            rank.className = 'player-rank';
            rank.textContent = `${index + 1}.`;

            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.name;

            const score = document.createElement('div');
            score.className = 'player-score';
            score.textContent = `${player.score} pts`;

            row.appendChild(rank);
            row.appendChild(name);
            row.appendChild(score);

            container.appendChild(row);
        });

        this.showScreen('scoreboard-screen');
    },

    // Arrêter la partie
    endGame() {
        if (confirm('Êtes-vous sûr de vouloir arrêter la partie ? Les scores seront perdus.')) {
            // Réinitialiser l'état
            this.players = [];
            this.currentRound = 1;
            Storage.clearAll();
            console.log('Partie arrêtée');

            // Retour à l'écran d'accueil
            this.showScreen('home-screen');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Application Puis-je initialisée');

    // Vérifier s'il y a une partie en cours
    const gameState = Storage.getGameState();
    if (gameState && gameState.inProgress) {
        console.log('Partie en cours détectée, restauration...');
        App.restoreGame(gameState);
    } else {
        // Afficher l'écran d'accueil
        App.showScreen('home-screen');
    }

    // Bouton "Lancer une partie"
    document.getElementById('start-game-btn').addEventListener('click', () => {
        App.showScreen('player-count-screen');
    });

    // Boutons de sélection du nombre de joueurs
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const count = parseInt(e.target.dataset.count);
            App.createPlayerInputs(count);
            App.showScreen('player-names-screen');
        });
    });

    // Formulaire de saisie des pseudos
    document.getElementById('player-names-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const playerNames = [];

        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                playerNames.push(value.trim());
            }
        }

        if (playerNames.length >= 3 && playerNames.length <= 5) {
            App.startGame(playerNames);
        }
    });

    // Bouton "Modifier les joueurs"
    document.getElementById('modify-players-btn').addEventListener('click', () => {
        App.modifyPlayers();
    });

    // Bouton "Ajouter un joueur"
    document.getElementById('add-player-btn').addEventListener('click', () => {
        App.addPlayer();
    });

    // Bouton "Lancer la partie"
    document.getElementById('start-round-btn').addEventListener('click', () => {
        App.startRound();
    });

    // Bouton "Score de la manche"
    document.getElementById('round-score-btn').addEventListener('click', () => {
        App.showWinnerSelection();
    });

    // Bouton "Valider les scores"
    document.getElementById('validate-scores-btn').addEventListener('click', () => {
        App.validateScores();
    });

    // Bouton "Manche suivante"
    document.getElementById('next-round-btn').addEventListener('click', () => {
        App.startRound();
    });

    // Bouton "Arrêter la partie"
    document.getElementById('end-game-btn').addEventListener('click', () => {
        App.endGame();
    });
});
