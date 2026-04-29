# Yatus Beats

Application web pour promouvoir les dernieres instrumentales Yatus Beats, recevoir des commandes et gerer le catalogue via une admin.

## Lancer le site avec backend

```bash
npm start
```

Puis ouvre :

- Site : `http://localhost:3000`
- Admin : `http://localhost:3000/admin.html`

Mot de passe admin par defaut :

```text
yatus-admin
```

Pour changer le mot de passe :

```powershell
$env:ADMIN_PASSWORD="ton-mot-de-passe"; npm start
```

## Deploy gratuit sur Render

1. Cree un compte sur `https://render.com`.
2. Mets ce projet sur GitHub.
3. Dans Render, clique sur `New` puis `Blueprint`.
4. Connecte ton repo GitHub.
5. Render va lire `render.yaml`.
6. Quand Render demande les variables, ajoute :

```text
ADMIN_PASSWORD=choisis-un-vrai-mot-de-passe
```

7. Lance le deploy.

Render donnera une URL du type :

```text
https://yatus-beats.onrender.com
```

Admin :

```text
https://yatus-beats.onrender.com/admin.html
```

Important : sur Render gratuit, le serveur peut dormir apres une periode sans visite. Le premier chargement peut donc prendre environ une minute. Le stockage fichier gratuit peut aussi etre perdu lors d'un redeploiement ou redemarrage ; pour une sauvegarde durable, il faudra brancher une base de donnees comme Supabase ou Neon.

## Sauvegarde durable avec Supabase

1. Cree un projet sur `https://supabase.com`.
2. Dans Supabase, va dans `SQL Editor`.
3. Copie le contenu de `database.sql`.
4. Lance le script.
5. Va dans `Project Settings` puis `Database`.
6. Copie l'URL de connexion Postgres, mode URI.
7. Dans Render, ouvre ton service `yatus-beats`.
8. Va dans `Environment`.
9. Ajoute :

```text
DATABASE_URL=ton-url-postgres-supabase
```

Garde aussi :

```text
ADMIN_PASSWORD=ton-vrai-mot-de-passe
```

10. Clique `Save Changes`, puis `Manual Deploy`.

Quand `DATABASE_URL` existe, le backend utilise Supabase/Postgres. Sinon, il utilise le fichier local `data/site.json`.

## Personnaliser

- Ouvre `admin.html` via le serveur pour gerer les beats.
- Les modifications admin sont sauvegardees dans Supabase si `DATABASE_URL` est configure, sinon dans `data/site.json`.
- Le site utilise les miniatures publiques YouTube a partir des IDs video, sans cle API ni quota Google.
- Dans `app.js`, remplace `contact.whatsappNumber` et `contact.email` si besoin.
- Les tarifs actuels viennent du PDF officiel : MP3 15 000 F CFA, WAV 25 000 F CFA, Stems 45 000 F CFA, Exclusive 150 000 F CFA.
- Dans `index.html`, le lien YouTube utilise `https://www.youtube.com/@Yatus_Beats/`.
- Le logo et la banniere sont dans `assets/`.
- Pour GitHub, garde chaque fichier audio sous 25 Mo. Utilise des previews MP3 ou des extraits courts, pas les masters complets.
- L'URL `/admin.html` existe toujours, mais elle n'est plus affichee publiquement dans le footer.

## Admin et stats

La page `admin.html` permet de modifier les beats, voir les stats du serveur, consulter les dernieres visites, exporter et importer les donnees.

Le backend stocke les donnees dans Supabase/Postgres quand `DATABASE_URL` est configure. En local sans base de donnees, il utilise `data/site.json`.

Stats visibles dans l'admin :

- visites
- ecoutes
- ajouts panier
- demandes pour un autre beat YouTube
- beat le plus ecoute
- beat le plus ajoute au panier
- derniers liens YouTube demandes

## Paiement

La version actuelle envoie la commande par WhatsApp ou email. Pour encaisser directement sur le site, il faudra brancher Stripe Checkout, PayPal ou un lien de paiement par beat.
