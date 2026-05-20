# 🐾 Le Forum des Pattes

Bienvenue sur **Le Forum des Pattes**, une application web complète (Full-Stack) développée en **Node.js (Express)** pour le backend et en **HTML/JavaScript Vanille** pour le frontend, utilisant une base de données **MySQL (MAMP)**.

Ce forum thématique permet à une communauté d'utilisateurs passionnés d'animaux de créer des espaces de discussions (topics), de catégoriser leurs échanges, de voter pour la pertinence des réponses et offre une interface d'administration dédiée.

---

## 📋 Fonctionnalités Implémentées (Cahier des Charges)

L'application valide l'ensemble des exigences fonctionnelles minimales demandées :

- **F-1 : Inscription des Utilisateurs** — Système sécurisé avec critères de complexité du mot de passe (8 caractères minimum, 1 majuscule, 1 caractère spécial).
- **F-2 : Connexion multi-identifiants** — Authentification possible via l'adresse Email OU via le Pseudo (Username).
- **F-3 : Stockage Sécurisé** — Hachage des mots de passe en **SHA-512** en base de données. Aucun mot de passe n'est stocké en clair.
- **F-4 : Fils de Discussion (Topics)** — Consultation globale et détaillée des sujets lancés par la communauté.
- **F-5 : Réponses interactives** — Possibilité d'ajouter des réponses à un sujet existant (réservé aux utilisateurs connectés).
- **F-6 : Gestion propriétaire** — Un auteur peut modifier ou supprimer ses propres topics, et supprimer ses propres messages.
- **F-7 : Système de Likes/Dislikes** — Attribution de votes positifs ou négatifs sur les messages avec interdiction de cumuler les deux sur une même réponse.
- **F-8 & F-9 : Tri et Pagination** — Les topics et messages sont affichés par lots de 10, 20 ou 30 avec des filtres par ordre chronologique ou par popularité.
- **F-10 : Catégories & Tags** — Classification obligatoire des sujets à la création et filtrage dynamique par tag sur la page d'accueil.
- **F-11 : Dashboard Administrateur** — Interface réservée aux comptes `admin` permettant de modifier l'état d'un sujet (ouvert, fermé, archivé) et de bannir/purger un utilisateur.
- **F-12 : Barre de Recherche** — Recherche instantanée par mot-clé filtrant simultanément les titres de topics et les noms de tags.

---

## 🛠️ Stack Technique

- **Backend :** Node.js, Express, MySQL2 (Pool de connexions Promisifiées), Crypto (Hachage SHA-512), Dotenv.
- **Frontend :** HTML5, JavaScript (ES6+), LocalStorage pour la persistance de la session locale.
- **Serveur de BDD :** MySQL (MAMP).

---

## 🚀 Installation et Démarrage

### 1. Prérequis

Assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) (Version 16+)
- [MAMP](https://www.mamp.info/) (pour le serveur MySQL local)

### 2. Configuration de la Base de Données

1. Lancez **MAMP** et ouvrez **phpMyAdmin**.
2. Créez une base de données nommée `forum_pattes`.
3. Importez le script SQL du projet pour générer la structure des tables (`users`, `topics`, `messages`, `tags`, `topic_tags`, `message_votes`) ainsi que les catégories de départ (_Coussinets, Sabots, Serres, Écailles..._).

### 3. Variables d'environnement

À la racine du dossier **`backend/`**, assurez-vous de la présence du fichier `.env` configuré comme suit :

```env
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_NAME=forum_pattes
DB_PORT=8889
```
