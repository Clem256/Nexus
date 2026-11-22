# TODO — Nexus

## Organisation & lancement
- [ ] Scanner automatiquement un dossier de projets configurable (par défaut `~/Dev`).
- [ ] Détecter la stack technique de chaque projet.
- [ ] Ouvrir un projet en un clic dans l’IDE adapté (IntelliJ, VS Code, etc.) ou dans un terminal.
- [ ] Centraliser les liens utiles par projet : GitHub/GitLab, Jira, staging et production.
- [ ] Afficher l’état Git : branche active et fichiers modifiés.

## Gestion légère des tâches
- [ ] Ajouter une liste de tâches locale à chaque projet.
- [ ] Permettre la synchronisation avec un fichier `TODO.md`.
- [ ] Fournir une vue globale des priorités du jour.

## Détection intelligente des ports
- [ ] Détecter statiquement les ports configurés dans `.env`, `package.json`, `application.properties` et `docker-compose.yml`.
- [ ] Repérer les ports actifs sur la machine et relier les processus/PID aux dossiers des projets.
- [ ] Afficher l’état « En ligne » pour les projets avec un serveur actif.
- [ ] Ouvrir `localhost` sur le port détecté en un clic.
- [ ] Permettre d’arrêter le serveur associé à un port.
- [ ] Signaler les conflits de ports et aider à les éviter.
