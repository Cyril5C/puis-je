// Fichier principal de l'application

// État de l'application
const App = {
    players: [],
    selectedPlayers: [], // Joueurs sélectionnés pour la partie
    allPlayers: [], // Tous les joueurs disponibles
    currentScreen: 'player-selection-screen',
    currentRound: 1,
    gameStartTime: null,
    maxRounds: 5, // Sera mis à jour depuis le serveur
    testMode: false,

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

    // Restaurer une partie en cours
    restoreGame(gameState) {
        this.players = gameState.players;
        this.currentRound = gameState.round || 1;
        console.log('Partie restaurée:', gameState);
        console.log(`⚙️ Configuration: maxRounds=${this.maxRounds}, testMode=${this.testMode}`);

        // Masquer le header (mode jeu)
        document.body.classList.add('in-game');

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

        // Démarrer le chronomètre
        this.gameStartTime = Date.now();

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

        // Masquer le header (mode jeu)
        document.body.classList.add('in-game');

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
            input.max = '200';
            input.value = '';
            input.placeholder = '-';
            input.required = true;
            input.id = `cards-${player.id}`;
            input.oninput = () => {
                // Limiter la valeur à 200 maximum
                if (parseInt(input.value) > 200) {
                    alert('Le nombre de points ne peut être supérieur à 200');
                    input.value = '';
                }
                this.updatePlayerTotal(player.id);
            };

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

        // Si l'élément total n'existe pas (commenté dans le DOM), ne rien faire
        if (!total) return;

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
                alert(`Veuillez entrer un nombre de points valide (minimum 1, maximum 200) pour ${player.name}`);
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

        // Vérifier si c'est la fin du jeu (après la dernière manche)
        console.log(`🎮 Vérification fin de jeu: currentRound=${this.currentRound}, maxRounds=${this.maxRounds}`);
        if (this.currentRound > this.maxRounds) {
            console.log('✅ Fin du jeu !');
            this.showFinalScore();
        } else {
            console.log(`➡️ Passage à la manche ${this.currentRound}`);
            this.showScoreboard();
        }
    },

    // Afficher le tableau des scores
    showScoreboard() {
        // Afficher le numéro de la manche
        const roundInfo = document.getElementById('scoreboard-round-info');
        const previousRound = this.currentRound - 1;
        roundInfo.textContent = `Après la manche ${previousRound}`;

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
    async showFinalScore() {
        const container = document.getElementById('final-scoreboard');
        container.innerHTML = '';

        // Trier les joueurs par score (ordre croissant, le plus petit score gagne)
        const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);
        const winnerScore = sortedPlayers[0].score;

        // Vérifier si c'est un nouveau record
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                const stats = await response.json();
                const isNewRecord = !stats.bestScores || stats.bestScores.length === 0 ||
                                   winnerScore < stats.bestScores[0].score;

                if (isNewRecord) {
                    const recordMessage = document.createElement('div');
                    recordMessage.className = 'record-message';
                    recordMessage.innerHTML = `
                        <div class="record-icon">🏆</div>
                        <div class="record-text">
                            <strong>NOUVEAU RECORD !</strong><br>
                            Félicitations ${sortedPlayers[0].name} ! 🎉
                        </div>
                    `;
                    container.appendChild(recordMessage);
                }
            }
        } catch (error) {
            console.log('Could not check for record:', error);
        }

        // Calculer et afficher le temps de jeu
        if (this.gameStartTime) {
            const gameEndTime = Date.now();
            const gameDuration = gameEndTime - this.gameStartTime;
            const minutes = Math.floor(gameDuration / 60000);
            const seconds = Math.floor((gameDuration % 60000) / 1000);

            const timeInfo = document.createElement('p');
            timeInfo.className = 'game-duration';
            timeInfo.textContent = `⏱️ Durée de la partie : ${minutes}min ${seconds}s`;
            container.appendChild(timeInfo);
        }

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

        // Ajouter les meilleurs scores à la suite
        await this.addBestScoresToFinalScreen(container);

        this.showScreen('final-score-screen');

        // Sauvegarder la partie sur le serveur
        await this.saveGameToServer();
    },

    // Ajouter les meilleurs scores sur l'écran final
    async addBestScoresToFinalScreen(container) {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) return;

            const stats = await response.json();

            if (stats.bestScores && stats.bestScores.length > 0) {
                // Séparateur
                const separator = document.createElement('div');
                separator.className = 'best-scores-separator';
                separator.innerHTML = '<h3>🏆 Meilleurs scores</h3>';
                container.appendChild(separator);

                // Podium des meilleurs scores
                const podium = document.createElement('div');
                podium.className = 'best-scores-podium';

                stats.bestScores.slice(0, 3).forEach((scoreEntry, index) => {
                    const scoreCard = document.createElement('div');
                    scoreCard.className = 'best-score-card';

                    if (index === 0) scoreCard.classList.add('gold');
                    else if (index === 1) scoreCard.classList.add('silver');
                    else if (index === 2) scoreCard.classList.add('bronze');

                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                    const date = new Date(scoreEntry.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });

                    scoreCard.innerHTML = `
                        <div class="medal">${medal}</div>
                        <div class="rank">#${index + 1}</div>
                        <div class="player-info">
                            <div class="player-name">${scoreEntry.player}</div>
                            <div class="score">${scoreEntry.score} points</div>
                            <div class="date">${date}</div>
                        </div>
                    `;

                    podium.appendChild(scoreCard);
                });

                container.appendChild(podium);
            }
        } catch (error) {
            console.log('Could not load best scores:', error);
        }
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

    // Arrêter la partie (avec confirmation)
    endGame() {
        if (confirm('Êtes-vous sûr de vouloir arrêter la partie ? Les scores seront perdus.')) {
            this.startNewGame();
        }
    },

    // Démarrer une nouvelle partie (sans confirmation)
    startNewGame() {
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

        console.log('Nouvelle partie - Retour à la sélection des joueurs');

        // Réafficher le header
        document.body.classList.remove('in-game');

        // Retour à l'écran de sélection des joueurs
        this.showScreen('player-selection-screen');
        this.loadPlayers();
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

    // Sauvegarder la partie sur le serveur (GitHub Gist)
    async saveGameToServer() {
        // Vérifier la durée de la partie (anti-triche)
        const MIN_GAME_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes
        const gameDuration = Date.now() - this.gameStartTime;
        const isTooFast = gameDuration < MIN_GAME_DURATION && !this.testMode;

        if (isTooFast) {
            const minutes = Math.floor(gameDuration / 60000);
            const seconds = Math.floor((gameDuration % 60000) / 1000);
            console.log(`⏱️ Partie trop rapide (${minutes}min ${seconds}s) - Non sauvegardée dans les meilleurs scores`);

            // Afficher un message à l'utilisateur
            const infoMessage = document.createElement('div');
            infoMessage.className = 'info-message';
            infoMessage.innerHTML = `
                <p>ℹ️ Cette partie n'a pas été enregistrée dans les meilleurs scores</p>
                <p style="font-size: 0.9em; opacity: 0.8;">Durée minimale requise : 15 minutes</p>
            `;
            document.getElementById('final-scoreboard').insertBefore(
                infoMessage,
                document.getElementById('final-scoreboard').firstChild
            );
        }

        try {
            const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);
            const winner = sortedPlayers[0];

            const gameData = {
                playerCount: this.players.length,
                players: this.players.map(p => ({
                    name: p.name,
                    finalScore: p.score,
                    isWinner: p.id === winner.id
                })),
                winner: winner.name,
                winnerScore: winner.score,
                rounds: [],
                duration: gameDuration,
                savedToLeaderboard: !isTooFast
            };

            // Construire les données des manches
            const roundCount = this.players[0].roundScores?.length || 0;
            for (let i = 0; i < roundCount; i++) {
                const roundData = {
                    number: i + 1,
                    mission: this.missions[i + 1],
                    scores: []
                };

                this.players.forEach(player => {
                    if (player.roundScores && player.roundScores[i]) {
                        roundData.scores.push({
                            playerName: player.name,
                            score: player.roundScores[i].score
                        });
                    }
                });

                gameData.rounds.push(roundData);
            }

            // Envoyer au serveur
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gameData)
            });

            if (response.ok) {
                console.log('✅ Partie sauvegardée sur le serveur');
            } else {
                console.warn('⚠️ Échec de la sauvegarde de la partie');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }

        // Mettre à jour les stats des joueurs (sauf si partie trop rapide)
        if (!isTooFast) {
            try {
                const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);
                const winnerId = sortedPlayers[0].id;

                const playersStats = this.players.map(player => ({
                    name: player.name,
                    won: player.id === winnerId,
                    finalScore: player.score
                }));

                await fetch('/api/players/update-stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ players: playersStats })
                });

                console.log('✅ Stats des joueurs mises à jour');
            } catch (error) {
                console.error('❌ Erreur mise à jour stats:', error);
            }
        } else {
            console.log('⏱️ Stats des joueurs non mises à jour (partie trop rapide)');
        }
    },

    // Partager les scores finaux
    async shareScores() {
        // Trier les joueurs par score
        const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);

        // Créer le message avec emojis
        let message = '♠️ Puis-je - Résultats de la partie ♠️\n\n';

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
    },

    // Charger la configuration depuis le serveur
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.maxRounds = config.maxRounds;
            this.testMode = config.testMode;

            if (this.testMode) {
                console.log('🧪 MODE TEST activé - 1 manche seulement');
            }
        } catch (error) {
            console.error('Erreur chargement config:', error);
            // Valeurs par défaut
            this.maxRounds = 5;
            this.testMode = false;
        }
    },

    // Charger et afficher tous les joueurs pour la sélection
    async loadPlayers() {
        const container = document.getElementById('players-list');
        container.innerHTML = '<p class="loading-message">Chargement des joueurs...</p>';

        try {
            const response = await fetch('/api/players');
            const data = await response.json();

            this.allPlayers = data.players || [];
            this.renderPlayersList();
        } catch (error) {
            console.error('Erreur lors du chargement des joueurs:', error);
            container.innerHTML = '<p class="error-message">❌ Impossible de charger les joueurs</p>';
        }
    },

    // Afficher la liste des joueurs
    renderPlayersList() {
        const container = document.getElementById('players-list');
        container.innerHTML = '';

        if (this.allPlayers.length === 0) {
            container.innerHTML = '<p class="no-scores">Aucun joueur enregistré. Ajoute ton premier joueur !</p>';
            return;
        }

        this.allPlayers.forEach(player => {
            const card = document.createElement('div');
            card.className = 'player-card';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `player-${player.name}`;
            checkbox.value = player.name;
            checkbox.checked = this.selectedPlayers.includes(player.name);
            checkbox.onchange = () => this.togglePlayerSelection(player.name);

            const info = document.createElement('div');
            info.className = 'player-card-info';

            const name = document.createElement('div');
            name.className = 'player-card-name';
            name.textContent = player.name;

            const stats = document.createElement('div');
            stats.className = 'player-card-stats';
            const gamesPlayed = player.stats?.gamesPlayed || 0;
            const gamesWon = player.stats?.gamesWon || 0;
            stats.textContent = `🎮 ${gamesPlayed} partie${gamesPlayed > 1 ? 's' : ''} | 🏆 ${gamesWon} gagnée${gamesWon > 1 ? 's' : ''}`;

            info.appendChild(name);
            info.appendChild(stats);

            card.appendChild(checkbox);
            card.appendChild(info);

            // Rendre toute la carte cliquable
            card.onclick = (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.togglePlayerSelection(player.name);
                }
            };

            // Ajouter classe selected si nécessaire
            if (this.selectedPlayers.includes(player.name)) {
                card.classList.add('selected');
            }

            container.appendChild(card);
        });

        this.updateSelectionCount();
    },

    // Gérer la sélection/désélection d'un joueur
    togglePlayerSelection(playerName) {
        const index = this.selectedPlayers.indexOf(playerName);

        if (index > -1) {
            // Désélectionner
            this.selectedPlayers.splice(index, 1);
        } else {
            // Sélectionner (max 5)
            if (this.selectedPlayers.length < 5) {
                this.selectedPlayers.push(playerName);
            } else {
                alert('❌ Maximum 5 joueurs pour une partie');
                // Décocher la checkbox
                const checkbox = document.getElementById(`player-${playerName}`);
                if (checkbox) checkbox.checked = false;
                return;
            }
        }

        this.updateSelectionCount();
        this.updatePlayerCards();
    },

    // Mettre à jour le compteur et le bouton
    updateSelectionCount() {
        const count = this.selectedPlayers.length;
        const countElement = document.getElementById('selection-count');
        const startBtn = document.getElementById('start-game-btn');

        countElement.textContent = `${count} joueur${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`;

        // Activer le bouton si 3-5 joueurs sélectionnés
        if (count >= 3 && count <= 5) {
            startBtn.disabled = false;
            countElement.style.color = '#4caf50';
        } else {
            startBtn.disabled = true;
            countElement.style.color = count > 5 ? '#e53e3e' : '#667eea';
        }
    },

    // Mettre à jour l'apparence des cartes
    updatePlayerCards() {
        this.allPlayers.forEach(player => {
            const card = document.getElementById(`player-${player.name}`)?.parentElement;
            if (card) {
                if (this.selectedPlayers.includes(player.name)) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            }
        });
    },

    // Démarrer la partie avec les joueurs sélectionnés
    startGameWithSelectedPlayers() {
        if (this.selectedPlayers.length < 3 || this.selectedPlayers.length > 5) {
            alert('❌ Sélectionne entre 3 et 5 joueurs');
            return;
        }

        // Démarrer la partie avec les joueurs sélectionnés
        this.startGame(this.selectedPlayers);
    },

    // Ouvrir/fermer le menu hamburger
    toggleHamburgerMenu() {
        const menu = document.getElementById('hamburger-menu');
        const overlay = document.getElementById('menu-overlay');
        const btn = document.getElementById('hamburger-menu-btn');

        if (menu.classList.contains('hidden')) {
            // Ouvrir le menu
            menu.classList.remove('hidden');
            overlay.classList.add('visible');
            btn.classList.add('active');
        } else {
            // Fermer le menu
            menu.classList.add('hidden');
            overlay.classList.remove('visible');
            btn.classList.remove('active');
        }
    },

    // Fermer le menu hamburger
    closeHamburgerMenu() {
        const menu = document.getElementById('hamburger-menu');
        const overlay = document.getElementById('menu-overlay');
        const btn = document.getElementById('hamburger-menu-btn');

        menu.classList.add('hidden');
        overlay.classList.remove('visible');
        btn.classList.remove('active');
    },

    // Afficher les meilleurs scores
    async showBestScores() {
        const container = document.getElementById('best-scores-content');
        container.innerHTML = '<p class="loading-message">Chargement des scores...</p>';

        this.showScreen('best-scores-screen');

        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des statistiques');
            }

            const stats = await response.json();
            container.innerHTML = '';

            if (stats.bestScores && stats.bestScores.length > 0) {
                const podium = document.createElement('div');
                podium.className = 'best-scores-podium';

                stats.bestScores.forEach((scoreEntry, index) => {
                    const scoreCard = document.createElement('div');
                    scoreCard.className = 'best-score-card';

                    if (index === 0) scoreCard.classList.add('gold');
                    else if (index === 1) scoreCard.classList.add('silver');
                    else if (index === 2) scoreCard.classList.add('bronze');

                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                    const date = new Date(scoreEntry.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });

                    scoreCard.innerHTML = `
                        <div class="medal">${medal}</div>
                        <div class="rank">#${index + 1}</div>
                        <div class="player-info">
                            <div class="player-name">${scoreEntry.player}</div>
                            <div class="score">${scoreEntry.score} points</div>
                            <div class="date">${date}</div>
                        </div>
                    `;

                    podium.appendChild(scoreCard);
                });

                container.appendChild(podium);
            } else {
                container.innerHTML = '<p class="no-scores">Aucun score enregistré pour le moment. Jouez votre première partie !</p>';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des meilleurs scores:', error);
            container.innerHTML = '<p class="error-message">❌ Impossible de charger les scores. Vérifiez votre connexion.</p>';
        }
    }
};

// Mot de passe pour accéder à l'application
// Récupéré depuis le serveur (configurable via variable d'environnement APP_PASSWORD)
let APP_PASSWORD = 'lesplantes'; // Valeur par défaut

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Application Puis-je initialisée');

    // Charger le mot de passe depuis le serveur
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        if (config.appPassword) {
            APP_PASSWORD = config.appPassword;
            console.log('✅ Mot de passe chargé depuis le serveur');
        }
    } catch (error) {
        console.warn('⚠️ Impossible de récupérer le mot de passe depuis le serveur, utilisation de la valeur par défaut');
    }

    // Charger la préférence de mode sombre
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    // Afficher le bouton partage uniquement si la Web Share API est disponible (mobile)
    if (!navigator.share) {
        const shareBtn = document.getElementById('share-scores-btn');
        if (shareBtn) {
            shareBtn.style.display = 'none';
        }
    }

    // Titre cliquable pour retour à l'accueil
    document.getElementById('app-title').addEventListener('click', () => {
        App.showScreen('player-selection-screen');
        App.closeHamburgerMenu();
    });

    // Menu hamburger
    document.getElementById('hamburger-menu-btn').addEventListener('click', () => {
        App.toggleHamburgerMenu();
    });

    // Fermer le menu en cliquant sur l'overlay
    document.getElementById('menu-overlay').addEventListener('click', () => {
        App.closeHamburgerMenu();
    });

    // Menu items
    document.getElementById('menu-rules-btn').addEventListener('click', () => {
        App.closeHamburgerMenu();
        App.loadRules();
    });

    document.getElementById('menu-best-scores-btn').addEventListener('click', () => {
        App.closeHamburgerMenu();
        App.showBestScores();
    });

    document.getElementById('menu-settings-btn').addEventListener('click', () => {
        App.closeHamburgerMenu();
        App.showScreen('settings-screen');
    });

    // Formulaire de connexion (doit être défini AVANT la vérification d'authentification)
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('password-input');
        const loginError = document.getElementById('login-error');

        if (passwordInput.value === APP_PASSWORD) {
            // Authentification réussie
            sessionStorage.setItem('authenticated', 'true');
            loginError.classList.add('hidden');
            passwordInput.value = '';

            // Charger la configuration et les joueurs
            (async () => {
                await App.loadConfig();
                await App.loadPlayers();

                // Vérifier s'il y a une partie en cours
                const gameState = Storage.getGameState();
                if (gameState && gameState.inProgress) {
                    App.restoreGame(gameState);
                } else {
                    // Afficher l'écran de sélection des joueurs
                    App.showScreen('player-selection-screen');
                }
            })();
        } else {
            // Mot de passe incorrect
            loginError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Bouton "Lancer la partie" avec joueurs sélectionnés
    document.getElementById('start-game-btn').addEventListener('click', () => {
        App.startGameWithSelectedPlayers();
    });

    // Bouton "Ajouter un nouveau joueur"
    document.getElementById('add-new-player-btn').addEventListener('click', () => {
        document.getElementById('add-player-modal').classList.remove('hidden');
        document.getElementById('new-player-name').value = '';
        document.getElementById('new-player-name').focus();
    });

    // Fermer modal
    document.getElementById('close-add-player-modal').addEventListener('click', () => {
        document.getElementById('add-player-modal').classList.add('hidden');
    });

    // Formulaire ajout nouveau joueur
    document.getElementById('new-player-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-player-name').value.trim();

        if (!name) return;

        try {
            // Vérifier si le joueur existe déjà
            const checkResponse = await fetch('/api/players/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ names: [name] })
            });

            const checkResult = await checkResponse.json();

            if (checkResult.existingPlayers && checkResult.existingPlayers.length > 0) {
                alert(`❌ Le pseudo "${name}" existe déjà. Choisis-en un autre.`);
                return;
            }

            // Ajouter le joueur
            await fetch('/api/players/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ names: [name] })
            });

            // Fermer le modal et recharger la liste
            document.getElementById('add-player-modal').classList.add('hidden');
            await App.loadPlayers();
        } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur lors de l\'ajout du joueur');
        }
    });

    // Fermer modal en cliquant en dehors
    document.getElementById('add-player-modal').addEventListener('click', (e) => {
        if (e.target.id === 'add-player-modal') {
            document.getElementById('add-player-modal').classList.add('hidden');
        }
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
        App.startNewGame();
    });

    // Bouton "Partager les scores"
    document.getElementById('share-scores-btn').addEventListener('click', () => {
        App.shareScores();
    });

    // Fermer la modal avec le bouton X
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        App.closeModal();
    });

    // Fermer la modal en cliquant sur le fond
    document.getElementById('round-details-modal').addEventListener('click', (e) => {
        if (e.target.id === 'round-details-modal') {
            App.closeModal();
        }
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

    // Vérifier si l'utilisateur est connecté et initialiser l'application
    const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';
    if (!isAuthenticated) {
        // Afficher l'écran de connexion
        App.showScreen('login-screen');
    } else {
        // Charger la configuration et les joueurs au démarrage
        (async () => {
            await App.loadConfig();
            await App.loadPlayers();

            // Vérifier s'il y a une partie en cours
            const gameState = Storage.getGameState();
            if (gameState && gameState.inProgress) {
                console.log('Partie en cours détectée, restauration...');
                App.restoreGame(gameState);
            } else {
                // Afficher l'écran de sélection des joueurs
                App.showScreen('player-selection-screen');
            }
        })();
    }
});
