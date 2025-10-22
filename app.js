// Fichier principal de l'application

// État de l'application
const App = {
    players: [],
    currentScreen: 'home-screen',
    currentRound: 1,

    // Missions par manche
    missions: {
        1: "Deux brelans",
        2: "Une suite + Un brelan",
        3: "Deux suites",
        4: "Trois brelans",
        5: "Deux brelans et une suite (on jète pas à la fin)",
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

        // Récupérer les derniers joueurs pour pré-remplir
        const lastPlayers = Storage.getLastPlayers();

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

            // Pré-remplir avec les derniers joueurs si disponibles
            if (lastPlayers && lastPlayers[i - 1]) {
                input.value = lastPlayers[i - 1];
            }

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
            score: 0,
            roundScores: [] // Historique des scores par manche
        }));

        // Sauvegarder les noms des joueurs pour rejouer plus tard
        Storage.saveLastPlayers(playerNames);

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
            label.textContent = 'Nombre de points';

            const input = document.createElement('input');
            input.type = 'number';
            input.inputMode = 'numeric';
            input.min = '1';
            input.max = '50';
            input.value = '';
            input.placeholder = '-';
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
            //playerDiv.appendChild(total);

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

        // Calculer et enregistrer les scores de cette manche
        const currentRoundNumber = this.currentRound;
        this.players = this.players.map(player => {
            let roundScore;
            if (player.id === this.currentWinner.id) {
                roundScore = -20;
            } else {
                const input = document.getElementById(`cards-${player.id}`);
                roundScore = parseInt(input.value);
            }

            // Ajouter le score de la manche à l'historique
            const updatedRoundScores = [...(player.roundScores || []), {
                round: currentRoundNumber,
                score: roundScore,
                mission: this.missions[currentRoundNumber]
            }];

            return {
                ...player,
                score: player.score + roundScore,
                roundScores: updatedRoundScores
            };
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

        // Vérifier si c'est la fin du jeu (après la manche 5)
        if (this.currentRound > 5) {
            this.showFinalScore();
        } else {
            this.showScoreboard();
        }
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

    // Afficher les scores finaux
    showFinalScore() {
        const container = document.getElementById('final-scoreboard');
        container.innerHTML = '';

        // Trier les joueurs par score (ordre croissant, le plus petit score gagne)
        const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);

        sortedPlayers.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'scoreboard-row';

            // Mettre en évidence le gagnant
            if (index === 0) {
                row.classList.add('first-place');
            }

            const rank = document.createElement('div');
            rank.className = 'player-rank';
            rank.textContent = `${index + 1}.`;

            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.name;
            name.onclick = () => this.showPlayerDetails(player);

            const score = document.createElement('div');
            score.className = 'player-score';
            score.textContent = `${player.score} pts`;

            row.appendChild(rank);
            row.appendChild(name);
            row.appendChild(score);

            container.appendChild(row);
        });

        this.showScreen('final-score-screen');
    },

    // Afficher les détails des manches d'un joueur
    showPlayerDetails(player) {
        const modal = document.getElementById('round-details-modal');
        const playerName = document.getElementById('modal-player-name');
        const detailsContainer = document.getElementById('modal-round-details');
        const totalScore = document.getElementById('modal-total-score');

        playerName.textContent = player.name;
        totalScore.textContent = `${player.score} pts`;

        detailsContainer.innerHTML = '';

        if (player.roundScores && player.roundScores.length > 0) {
            player.roundScores.forEach(roundData => {
                const row = document.createElement('div');
                row.className = 'round-detail-row';

                // Marquer les manches gagnées
                if (roundData.score === -20) {
                    row.classList.add('winner');
                }

                const info = document.createElement('div');
                info.className = 'round-info';

                const roundNumber = document.createElement('div');
                roundNumber.className = 'round-number';
                roundNumber.textContent = `Manche ${roundData.round}`;

                const mission = document.createElement('div');
                mission.className = 'round-mission';
                mission.textContent = roundData.mission;

                info.appendChild(roundNumber);
                info.appendChild(mission);

                const scoreDiv = document.createElement('div');
                scoreDiv.className = 'round-score';
                scoreDiv.textContent = roundData.score > 0 ? `+${roundData.score}` : `${roundData.score}`;

                row.appendChild(info);
                row.appendChild(scoreDiv);

                detailsContainer.appendChild(row);
            });
        }

        modal.classList.remove('hidden');
    },

    // Fermer la modal
    closeModal() {
        document.getElementById('round-details-modal').classList.add('hidden');
    },

    // Arrêter la partie
    endGame() {
        if (confirm('Êtes-vous sûr de vouloir arrêter la partie ? Les scores seront perdus.')) {
            // Sauvegarder les noms des joueurs avant de tout effacer
            const lastPlayers = Storage.getLastPlayers();

            // Réinitialiser l'état
            this.players = [];
            this.currentRound = 1;

            // Effacer les scores et l'état du jeu, mais pas les derniers joueurs
            Storage.clearGameState();
            Storage.saveScores({});

            // Restaurer les derniers joueurs
            if (lastPlayers) {
                Storage.saveLastPlayers(lastPlayers);
            }

            console.log('Partie arrêtée - Joueurs conservés en mémoire');

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

    // Bouton "Nouvelle partie"
    document.getElementById('new-game-btn').addEventListener('click', () => {
        App.endGame();
    });

    // Fermer la modal
    document.querySelector('.modal-close').addEventListener('click', () => {
        App.closeModal();
    });

    // Fermer la modal en cliquant sur le fond
    document.getElementById('round-details-modal').addEventListener('click', (e) => {
        if (e.target.id === 'round-details-modal') {
            App.closeModal();
        }
    });

    // Bouton "Paramètres"
    document.getElementById('settings-btn').addEventListener('click', () => {
        App.showScreen('settings-screen');
    });

    // Bouton "Retour" des paramètres
    document.getElementById('back-to-home-btn').addEventListener('click', () => {
        App.showScreen('home-screen');
    });

    // Bouton "Effacer le stockage"
    document.getElementById('clear-storage-btn').addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes les données sauvegardées ? Cette action est irréversible.')) {
            Storage.clearAll();
            alert('Le stockage local a été effacé avec succès.');
            // Recharger la page pour une mise à jour complète
            window.location.reload();
        }
    });

    // Bouton "Précédent" de la page pseudos
    document.getElementById('back-to-count-btn').addEventListener('click', () => {
        App.showScreen('player-count-screen');
    });
});
