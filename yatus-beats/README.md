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

## Personnaliser

- Ouvre `admin.html` via le serveur pour gerer les beats.
- Les modifications admin sont sauvegardees dans `data/site.json`.
- Le site utilise les miniatures publiques YouTube a partir des IDs video, sans cle API ni quota Google.
- Dans `app.js`, remplace `contact.whatsappNumber` et `contact.email` si besoin.
- Les tarifs actuels viennent du PDF officiel : MP3 15 000 F CFA, WAV 25 000 F CFA, Stems 45 000 F CFA, Exclusive 150 000 F CFA.
- Dans `index.html`, le lien YouTube utilise `https://www.youtube.com/@Yatus_Beats/`.
- Le logo et la banniere sont dans `assets/`.
- Pour GitHub, garde chaque fichier audio sous 25 Mo. Utilise des previews MP3 ou des extraits courts, pas les masters complets.

## Admin et stats

La page `admin.html` permet de modifier les beats, voir les stats du serveur, consulter les dernieres visites, exporter et importer les donnees.

Le backend actuel stocke les donnees en JSON dans `data/site.json`. Pour une mise en ligne professionnelle avec plusieurs administrateurs, on pourra ensuite ajouter une vraie base de donnees.

## Paiement

La version actuelle envoie la commande par WhatsApp ou email. Pour encaisser directement sur le site, il faudra brancher Stripe Checkout, PayPal ou un lien de paiement par beat.
