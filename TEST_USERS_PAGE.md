# Test de la Page Utilisateurs

## 🔍 Diagnostic

La page `/users` ne s'affiche pas. Voici comment diagnostiquer:

### 1. Vérifier la Connexion

**Dans la console du navigateur (F12 → Console):**

```javascript
// Vérifier si tu es connecté
const user = JSON.parse(localStorage.getItem('user') || '{}')
console.log('Connecté en tant que:', user.email, '- Rôle:', user.role)

// Si pas connecté ou pas admin, afficher:
if (!user.role || user.role !== 'admin') {
  console.error('❌ Tu dois être connecté en tant qu\'admin!')
  console.log('👉 Va sur /login et connecte-toi avec:')
  console.log('   Email: admin@janus-demo.com')
  console.log('   Password: admin123')
}
```

### 2. Forcer la Connexion Admin (Si Besoin)

**Si tu n'es pas connecté, exécute dans la console:**

```javascript
// Forcer connexion admin
localStorage.setItem('jwt_token', 'demo-admin-token')
localStorage.setItem('user', JSON.stringify({
  userId: 'user-admin-demo',
  email: 'admin@janus-demo.com',
  name: 'Admin Demo',
  role: 'admin',
  organizationId: 'demo-org-1'
}))

// Recharger
location.href = '/users'
```

### 3. Vérifier les Erreurs

**Regarde l'onglet Console pour des erreurs en rouge:**
- Erreur de chargement du composant?
- Erreur d'API?
- Erreur de routing?

### 4. Test Direct API

**Dans la console:**

```javascript
// Tester l'API directement
fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
  }
})
.then(r => r.json())
.then(data => console.log('Utilisateurs:', data))
.catch(err => console.error('Erreur API:', err))
```

## ✅ Résultat Attendu

Si tout fonctionne, tu devrais voir:
- ✅ 3 utilisateurs (Admin Demo, Manager Acme, Jean Dupont)
- ✅ Bouton "➕ Nouvel Utilisateur"
- ✅ Filtres de recherche
- ✅ Tableau avec avatars colorés

## 🐛 Si Ça Ne Marche Toujours Pas

Partage-moi:
1. Le résultat de `localStorage.getItem('user')`
2. Les erreurs dans la console (capture d'écran ou copie)
3. L'URL exacte où tu es
