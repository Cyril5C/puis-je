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

    // Créer les champs de saisie pour les pseudos (toujours 3 par défaut)
    createPlayerInputs() {
        const container = document.getElementById('player-inputs');
        container.innerHTML = '';

        // Récupérer les derniers joueurs pour pré-remplir (max 3)
        const lastPlayers = Storage.getLastPlayers();

        // Toujours afficher 3 champs, même si plus de joueurs étaient sauvegardés
        for (let i = 1; i <= 3; i++) {
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

            // Pré-remplir avec les derniers joueurs si disponibles (max 3)
            if (lastPlayers && lastPlayers[i - 1]) {
                input.value = lastPlayers[i - 1];
            }

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            container.appendChild(inputGroup);
        }
    },

    // Ajouter un champ de joueur sur la page d'accueil
    addPlayerInput() {
        const container = document.getElementById('player-inputs');
        const currentCount = container.children.length;

        if (currentCount >= 5) {
            alert('Nombre maximum de joueurs atteint (5)');
            return;
        }

        const newCount = currentCount + 1;
        const inputGroup = document.createElement('div');
        inputGroup.className = 'player-input-group player-input-added';

        const label = document.createElement('label');
        label.textContent = `Joueur ${newCount}`;
        label.setAttribute('for', `player-${newCount}`);

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-with-buttons';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player-${newCount}`;
        input.name = `player-${newCount}`;
        input.placeholder = `Pseudo du joueur ${newCount}`;
        input.required = false; // Pas obligatoire pour les joueurs ajoutés
        input.maxLength = 20;

        // Bouton valider
        const validateBtn = document.createElement('button');
        validateBtn.type = 'button';
        validateBtn.className = 'input-action-btn validate-btn';
        validateBtn.innerHTML = '✓';
        validateBtn.title = 'Valider';
        validateBtn.onclick = () => {
            if (input.value.trim()) {
                input.required = true;
                inputGroup.classList.remove('player-input-added');
                inputWrapper.classList.add('validated');
                validateBtn.style.display = 'none';
                deleteBtn.innerHTML = '×';
                deleteBtn.className = 'input-action-btn delete-btn';
            } else {
                alert('Veuillez entrer un pseudo');
                input.focus();
            }
        };

        // Bouton supprimer
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'input-action-btn delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Supprimer';
        deleteBtn.onclick = () => {
            inputGroup.remove();
            // Réorganiser les numéros des joueurs
            this.renumberPlayers();
        };

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(validateBtn);
        inputWrapper.appendChild(deleteBtn);

        inputGroup.appendChild(label);
        inputGroup.appendChild(inputWrapper);
        container.appendChild(inputGroup);

        // Focus sur le nouveau champ
        input.focus();
    },

    // Renuméroter les joueurs après suppression
    renumberPlayers() {
        const container = document.getElementById('player-inputs');
        const inputGroups = container.children;

        Array.from(inputGroups).forEach((group, index) => {
            const newNumber = index + 1;
            const label = group.querySelector('label');
            const input = group.querySelector('input');

            if (label) label.textContent = `Joueur ${newNumber}`;
            if (input) {
                input.id = `player-${newNumber}`;
                input.name = `player-${newNumber}`;
                input.placeholder = `Pseudo du joueur ${newNumber}`;
            }
        });
    },

    // Restaurer une partie en cours
    restoreGame(gameState) {
        this.players = gameState.players;
        this.currentRound = gameState.round || 1;
        console.log('Partie restaurée:', gameState);

        // Afficher directement l'écran de la manche en cours
        if (gameState.roundStarted) {
            this.startRound();
        } else {
            // Sinon afficher le tableau des scores
            this.showScoreboard();
        }
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

        // Réinitialiser à la manche 1
        this.currentRound = 1;

        // Sauvegarder l'état initial
        Storage.saveGameState({
            players: this.players,
            round: 1,
            inProgress: true
        });

        console.log('Partie commencée avec les joueurs:', this.players);

        // Lancer directement la première manche
        this.startRound();
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

        // Mettre le focus sur le premier champ de saisie
        setTimeout(() => {
            const firstInput = container.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
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

            // Retour à l'écran d'accueil avec les champs de pseudos
            this.showScreen('home-screen');
            this.createPlayerInputs();
        }
    },

    // Charger et afficher les règles
    async loadRules() {
        try {
            const response = await fetch('static/regles.md');
            const markdown = await response.text();
            const rulesContainer = document.getElementById('rules-text');
            rulesContainer.innerHTML = marked.parse(markdown);
            this.showScreen('rules-screen');
        } catch (error) {
            console.error('Erreur lors du chargement des règles:', error);
            alert('Impossible de charger les règles du jeu.');
        }
    },

    // Partager les scores finaux
    async shareScores() {
        // Trier les joueurs par score
        const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);

        // Créer le message avec emojis
        let message = '🎮 Puis-je - Résultats de la partie 🎮\n\n';

        sortedPlayers.forEach((player, index) => {
            let emoji = '';
            if (index === 0) emoji = '🥇'; // Or
            else if (index === 1) emoji = '🥈'; // Argent
            else if (index === 2) emoji = '🥉'; // Bronze
            else emoji = '🎯';

            message += `${emoji} ${index + 1}. ${player.name} : ${player.score} pts\n`;
        });

        message += '\n✨ Joue avec nous sur puis-je ! ✨';

        // Utiliser la Web Share API si disponible (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Puis-je - Résultats',
                    text: message
                });
            } catch (error) {
                // L'utilisateur a annulé le partage
                console.log('Partage annulé');
            }
        } else {
            // Pas de partage sur desktop
            alert('Le partage n\'est disponible que sur mobile');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Application Puis-je initialisée');

    // Charger la préférence de mode sombre
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode-toggle').checked = true;
    }

    // Afficher le bouton partage uniquement si la Web Share API est disponible (mobile)
    if (!navigator.share) {
        const shareBtn = document.getElementById('share-scores-btn');
        if (shareBtn) {
            shareBtn.style.display = 'none';
        }
    }

    // Vérifier s'il y a une partie en cours
    const gameState = Storage.getGameState();
    if (gameState && gameState.inProgress) {
        console.log('Partie en cours détectée, restauration...');
        App.restoreGame(gameState);
    } else {
        // Afficher l'écran d'accueil avec 3 joueurs par défaut
        App.showScreen('home-screen');
        App.createPlayerInputs(3);
    }

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

    // Bouton "Ajouter un joueur" (sur la page d'accueil)
    document.getElementById('add-player-btn').addEventListener('click', () => {
        App.addPlayerInput();
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

    // Bouton "Partager les scores"
    document.getElementById('share-scores-btn').addEventListener('click', () => {
        App.shareScores();
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

    // Bouton "Règles du jeu"
    document.getElementById('rules-btn').addEventListener('click', () => {
        App.loadRules();
    });

    // Bouton "Retour" des règles
    document.getElementById('back-from-rules-btn').addEventListener('click', () => {
        App.showScreen('home-screen');
    });

    // Bouton "Paramètres"
    document.getElementById('settings-btn').addEventListener('click', () => {
        App.showScreen('settings-screen');
    });

    // Bouton "Retour" des paramètres
    document.getElementById('back-to-home-btn').addEventListener('click', () => {
        App.showScreen('home-screen');
    });

    // Toggle mode sombre
    document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
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
});
