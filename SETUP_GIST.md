# Configuration GitHub Gist pour la sauvegarde des données

Ce guide explique comment configurer GitHub Gist pour sauvegarder automatiquement les parties et les pseudos.

## 📝 Étape 1 : Créer les Gists

### Gist 1 : Les parties (games)

1. Va sur https://gist.github.com
2. Connecte-toi avec ton compte GitHub
3. Crée un nouveau Gist avec :
   - **Filename** : `puisje-games.json`
   - **Content** :
   ```json
   {
     "games": [],
     "stats": {
       "totalGames": 0,
       "lastUpdate": ""
     }
   }
   ```
4. Choisis **"Create secret gist"** (privé)
5. Clique sur **"Create secret gist"**
6. Note le **Gist ID** dans l'URL (ex: `a1b2c3d4e5f6g7h8i9j0`)

### Gist 2 : Les pseudos (players)

1. Crée un **nouveau Gist** sur https://gist.github.com
2. Crée avec :
   - **Filename** : `puisje-players.json`
   - **Content** :
   ```json
   {
     "players": []
   }
   ```
3. Choisis **"Create secret gist"** (privé)
4. Clique sur **"Create secret gist"**
5. Note le **Gist ID** dans l'URL (différent du premier !)

## 🔑 Étape 2 : Récupérer les Gist IDs

Après création de chaque Gist, l'URL ressemble à :
```
https://gist.github.com/ton-username/a1b2c3d4e5f6g7h8i9j0
```

Le **Gist ID** est : `a1b2c3d4e5f6g7h8i9j0` (la longue chaîne à la fin)

⚠️ **Important** : Tu auras **2 Gist IDs différents** (un pour les parties, un pour les pseudos)

## 🎫 Étape 3 : Créer un Token GitHub

1. Va sur https://github.com/settings/tokens
2. Clique sur **"Generate new token"** → **"Generate new token (classic)"**
3. Nom du token : `puisje-stats`
4. Permissions : Coche uniquement **"gist"**
5. Clique sur **"Generate token"**
6. ⚠️ **COPIE LE TOKEN** immédiatement (tu ne pourras plus le voir)

## ⚙️ Étape 4 : Configurer Railway

1. Va sur le [Dashboard Railway](https://railway.app)
2. Sélectionne ton projet `puis-je`
3. Clique sur l'onglet **"Variables"**
4. Ajoute ces **trois** variables :
   - **GITHUB_TOKEN** = `ton_token_github` (le même pour les deux Gists)
   - **GIST_ID** = `gist_id_des_parties`
   - **PLAYERS_GIST_ID** = `gist_id_des_pseudos`
5. Clique sur **"Deploy"** pour redémarrer avec les nouvelles variables

## ✅ Étape 5 : Vérifier que ça fonctionne

1. Lance une partie complète sur ton site
2. À la fin de la partie, ouvre la console du navigateur (F12)
3. Tu devrais voir : `✅ Partie sauvegardée sur le serveur`
4. Va sur ton Gist GitHub et rafraîchis la page
5. Tu devrais voir les données de la partie !

## 📊 Consulter les statistiques

Pour voir les statistiques, tu peux :

1. **Via l'API** : `https://ton-site.com/api/stats`
2. **Dans le Gist** : Directement sur GitHub

### Structure des données sauvegardées

```json
{
  "games": [
    {
      "id": 1234567890,
      "date": "2025-01-24T10:30:00.000Z",
      "playerCount": 4,
      "players": [
        {
          "name": "Alice",
          "finalScore": -45,
          "isWinner": true
        }
      ],
      "winner": "Alice",
      "winnerScore": -45,
      "rounds": [
        {
          "number": 1,
          "mission": "Deux brelans",
          "scores": [
            {
              "playerName": "Alice",
              "score": -20
            }
          ]
        }
      ]
    }
  ],
  "stats": {
    "totalGames": 1,
    "lastUpdate": "2025-01-24T10:30:00.000Z"
  }
}
```

## 🔒 Sécurité

- ✅ Le Gist est **privé** (secret)
- ✅ Le token GitHub a **uniquement** accès aux Gists
- ✅ Les tokens sont stockés comme **variables d'environnement** sur Railway
- ✅ Les tokens ne sont **jamais** exposés côté client

## 🐛 Dépannage

### "Échec de la sauvegarde de la partie"

1. Vérifie que les variables `GITHUB_TOKEN` et `GIST_ID` sont bien configurées
2. Vérifie que le token a la permission `gist`
3. Vérifie que le Gist existe et n'a pas été supprimé
4. Regarde les logs Railway pour plus de détails

### Tester manuellement

```bash
curl -H "Authorization: token TON_TOKEN" \
     https://api.github.com/gists/TON_GIST_ID
```

Si ça affiche le contenu du Gist, la configuration est correcte !

## 💡 Prochaines étapes

Une fois configuré, tu peux :
- Créer une page `/stats` pour visualiser les statistiques
- Exporter les données en CSV pour analyse
- Créer des graphiques avec les données
- Partager les stats sur les réseaux sociaux

## 📞 Besoin d'aide ?

Si tu as des questions, n'hésite pas ! 🚀
