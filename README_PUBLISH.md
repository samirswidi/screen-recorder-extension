# Screen Recorder — Extension Chrome

Développé par [Souidi Samir](https://samirswidi.epizy.com/)

---

## 📦 Publié sur
- **Chrome Web Store** : lien vers la fiche publique (à compléter après publication)
- **GitHub** : dépôt source

---

## ✅ Prérequis pour publication Chrome Web Store

1. **Compte développeur** : payer $5 USD sur [Google Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. **Images obligatoires** (PNG, pas SVG seul pour le store) :
   - `icon_16.png`, `icon_32.png`, `icon_48.png`, `icon_128.png`
   - Screenshots d'interface (minimum 1, idéal 3-4) : choix config, état enregistrement, arrêt
3. **Fichier ZIP propre** : compresser uniquement les fichiers utiles (hors `screenshots/` si trop lourd)
4. **Manifest V3 validé** : `manifest_version: 3`, permissions `desktopCapture`, `downloads`, `storage`, `offscreen`

---

## 🚀 Étapes de publication

```bash
# Nettoyer et zipping (Windows PowerShell)
Compress-Archive -Path .\* -DestinationPath .\screen-recorder-extension-v1.5.0.zip -Force
```

- Aller dans [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
- **"Add new item"** → uploader le ZIP
- Renseigner :
  - **Title** : `Screen Recorder — Pro Screen Recording`
  - **Short description** : `Record screen, window or tab with MP4/WebM, auto-minimize, invisible recording.`
  - **Full description** : copier depuis `README.md` + ajouter lien portfolio
  - **Category** : `Productivity` / `Tools`
  - **Price** : `Free`
  - **Language** : `French` / `English`
- **Upload images** : icônes + 3 screenshots du nouveau design (popup config, enregistrement avec PiP, bouton arrêt)
- **Publish** → attente validation Google (quelques minutes à 48h)

---

## ⚠️ Vérifications techniques avant upload

- [ ] `manifest.json` sans erreur (test avec `chrome://extensions` en mode développeur)
- [ ] `background.js` utilise `chrome.action.onClicked` (pas de `default_popup`)
- [ ] `recorder.html` s'affiche correctement à 380x620
- [ ] Aucun `console.error` au lancement
- [ ] Téléchargement MP4/WebM fonctionnel avec `chrome.downloads.download`
- [ ] Liens externes (portfolio) renseignés et fonctionnels

---

## 🔗 Liens utiles
- Portfolio développeur : https://samirswidi.epizy.com/
- Chrome Web Store Developer Help : https://developer.chrome.com/docs/webstore/
- Guide d'images store : https://developer.chrome.com/docs/webstore/images/
