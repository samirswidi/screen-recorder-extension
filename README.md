# 🎥 Screen Recorder — Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/SamirSouidi/screen-recorder-extension/releases)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore/detail/screen-recorder)

Développé par [Souidi Samir](https://samirswidi.epizy.com/) 🌐

---

## 📦 Fonctionnalités

- **Enregistrement complet** : écran, fenêtre ou onglet
- **Qualité vidéo** : MP4 (H.264) ou WebM (VP9/VP8) avec audio micro ou système
- **Interface moderne** : design glassmorphism, animations fluides, thème sombre
- **Auto‑Save** : la fenêtre se minimise automatiquement pendant l’enregistrement
- **Arrêt intelligent** : appuyer sur `Ctrl+Shift+S` ou cliquer sur l’icône du taskbar
- **Export configurable** : choisir le format (MP4/WebM) et le codec
- **Mode caméra** : (à venir) enregistrement uniquement de la caméra

---

## 📂 Structure du projet

```
screen-recorder-extension-main/
│
├─ manifest.json          # Manifest Chrome V3
├─ background.js          # Service worker (module)
├─ recorder.html          # UI principale (popup)
├─ recorder.js            # Logique d’enregistrement
├─ popup.html             # Ancienne page (dépréciée)
├─ popup.js
├─ icon.svg               # Icône de l’extension
├─ README.md              # Documentation GitHub
└─ screenshots/           # Captures d’écran pour la documentation
```

---

## 🛠️ Installation (débogage)

1. Ouvrez `chrome://extensions/`
2. Activez **« Mode développeur »**
3. Cliquez sur **« Charger non‑développé »** et sélectionnez le dossier `screen-recorder-extension-main`

L’icône s’affichera dans la barre d’outils de Chrome.

---

## 🚀 Utilisation

1. Cliquez sur l’icône de l’extension → la fenêtre de configuration s’ouvre.
2. Choisissez **ce que vous voulez enregistrer** :
   - **Écran** (tout l’écran)  
   - **Écran + Caméra** *(à venir)*  
   - **Caméra**  
   - **Onglet**  
3. Choisissez le **format d’export** : MP4 ou WebM.
4. Activez **Enregistrer audio** si besoin (Aucun / Microphone / Système).
5. Cochez **Auto‑Save** si vous voulez que l’enregistrement s’arrête automatiquement quand la fenêtre revient au premier plan.
6. Cliquez sur **▶️ REC** → la fenêtre se minimise automatiquement.
7. Pour arrêter, cliquez sur l’icône du taskbar ou appuyez sur **Ctrl+Shift+S**.

---

## 🛠️ Développement

- **Mise à jour du code** : modifiez `recorder.js` ou `recorder.html`.
- **Recharger l’extension** : cliquez sur **« Rafraîchir »** dans `chrome://extensions/`.
- **Vérifier la console** : ouvrez la fenêtre recorder → **F12** → onglet *Console* pour voir les logs.

---

## 📦 Publication sur le Chrome Web Store

1. Créez un compte développeur sur [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) ($5 USD).
2. Compressez le dossier en ZIP (excluez les captures d’écran inutiles si le poids est trop élevé).
3. Remplissez le formulaire de publication avec :
   - Titre et description clairs (ex. « Professional screen recording with MP4/WebM support »)
   - Screenshots d’interface (au moins 1, idéalement 3‑4)
   - Description détaillée (copiez le contenu du `README.md`)
   - Lien vers votre portfolio : `https://samirswidi.epizy.com/`
4. Soumettez et attendez la validation (quelques minutes à 48 h).

---

## 📝 Licence

MIT © 2026 Souidi Samir — [Voir le fichier LICENSE](LICENSE)

---

## 🙏 Remerciements

- Chrome Extension API
- MediaRecorder API
- La communauté open‑source

---

## 📞 Contact

- **Portfolio** : https://samirswidi.epizy.com/
- **GitHub** : https://github.com/samirswidi