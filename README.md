# Puis-je - Jeu de cartes

Application web mobile first pour jouer au jeu de cartes "Puis-je" de 3 à 5 joueurs.

## Fonctionnalités

- ✅ Configuration des joueurs (3-5 joueurs)
- ✅ 4 manches avec missions différentes
- ✅ Système de scoring automatique
- ✅ Historique détaillé par joueur
- ✅ Persistance des données (localStorage)
- ✅ Interface responsive mobile first
- ✅ Mode paysage optimisé pour l'affichage des missions
- ✅ Rejouer avec les mêmes joueurs

## Missions

1. **Manche 1**: Une suite + Un brelan
2. **Manche 2**: Deux suites
3. **Manche 3**: Trois brelans
4. **Manche 4**: Deux brelans et une suite (ne pas jeter à la fin)

## Installation locale

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Lancer avec Node.js
npm start
```

## Déploiement sur Railway

1. Connectez votre repository GitHub à Railway
2. Railway détectera automatiquement le `package.json`
3. L'application sera déployée automatiquement

Aucune configuration supplémentaire n'est nécessaire !

## Technologies

- HTML5
- CSS3 (Mobile First)
- JavaScript (Vanilla)
- Express.js (serveur de production)
- LocalStorage API

## Structure du projet

```
├── index.html      # Page principale
├── style.css       # Styles responsive
├── app.js          # Logique de l'application
├── storage.js      # Gestion du localStorage
├── server.js       # Serveur Express pour production
├── package.json    # Configuration npm
└── README.md       # Documentation
```

## Licence

MIT
