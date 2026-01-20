# Apps Script (Contributions)

Ce dossier contient **le code Apps Script** pour ton endpoint de contributions.

## Pourquoi c’est utile
- Le champ **transliteration** (input `name="transliteration"`) est bien sauvegardé dans Google Sheets.
- Chaque envoi génère un **submission_id** (UUID) renvoyé au site.
- Chaque requête est écrite dans un onglet **CONTRIBUTIONS_LOG** (succès ou erreur) pour comprendre pourquoi « ça n’est pas tombé ».
- Le endpoint renvoie un **reçu** (HTML) qui fait `postMessage()` vers ton site. Ton site affiche alors : ✅ Envoyé + ID.

## Étapes (une fois)
1. Ouvre ton projet Apps Script actuel (celui derrière ton `API_URL`).
2. Remplace le contenu de `Code.gs` par le fichier `apps-script/Code.gs` (ou copie-colle).
3. Vérifie/ajuste en haut du fichier :
   - `SHEET_NAME` (par défaut `CONTRIBUTIONS`)
   - `LOG_SHEET_NAME` (par défaut `CONTRIBUTIONS_LOG`)
4. Déploie en Web App :
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Copie l’URL `/exec` et mets-la dans ton site (si elle a changé).

## Colonnes Google Sheet
Le script:
- crée si besoin `CONTRIBUTIONS_LOG`
- ajoute automatiquement (si manquantes) des colonnes techniques dans `CONTRIBUTIONS` :
  - `received_at`
  - `submission_id`
  - `status`

Il append ensuite les valeurs reçues en respectant les headers existants.

## Lecture des logs
Onglet `CONTRIBUTIONS_LOG`:
- `received_at` / `submission_id` / `status` / `error` / `payload_json`

Si un utilisateur dit « j’ai cliqué mais rien », tu lui demandes l’ID affiché sur le site et tu le retrouves dans les logs.
