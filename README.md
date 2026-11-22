# Nexus

**Nexus** est un outil local de suivi et de lancement de projets personnels, construit avec **Tauri**.

Il centralise l’organisation de tes projets, leurs tâches, leurs liens utiles et leurs serveurs locaux dans une seule application.

## Fonctionnalités

### Organisation & lancement

- Scanner automatiquement un dossier de projets, comme `~/Dev`
- Détecter automatiquement la stack technique
- Ouvrir un projet dans l’IDE adapté ou dans un terminal
- Centraliser les liens GitHub/GitLab, Jira, staging et production
- Afficher la branche Git active et les fichiers modifiés

### Gestion des tâches

- Maintenir une liste de tâches locale par projet
- Synchroniser les tâches avec un fichier `TODO.md`
- Afficher une vue globale des priorités du jour

### Détection intelligente des ports

- Analyser `.env`, `package.json`, `application.properties` et `docker-compose.yml`
- Détecter les ports configurés statiquement
- Associer les processus actifs aux projets locaux
- Afficher l’état « En ligne »
- Ouvrir directement `localhost` depuis l’application
- Arrêter un serveur actif
- Signaler les conflits de ports

## Stack envisagée

- Tauri
- React
- TypeScript
- SQLite
- Rust

## Modèles principaux

- Projet
- Tâche
- Lien
- Détection de port
- Processus actif

## Objectifs du MVP

1. Scanner et afficher les projets locaux
2. Détecter leur stack technique
3. Ouvrir les projets dans l’IDE ou le terminal
4. Gérer les tâches locales
5. Identifier les ports configurés
6. Afficher les ports actifs et leur PID

## Feuille de route

La liste détaillée des fonctionnalités à implémenter est disponible dans [`TODO.md`](./TODO.md).

## Licence

À définir.
