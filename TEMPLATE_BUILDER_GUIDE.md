# 📋 Guide du Template Builder - Janus Platform

## Vue d'Ensemble

Le **Template Builder** est une interface visuelle No-Code qui permet aux administrateurs de créer, modifier et gérer des templates d'évaluation sans avoir besoin de toucher au code.

## Accès au Template Builder

1. Connectez-vous au Manager Portal: `http://localhost:5182`
2. Cliquez sur le bouton **📋 Templates** dans la barre de navigation
3. Vous accédez à la page du Template Builder

## Structure d'un Template

Un template d'évaluation est composé de:

### 1. **Informations Générales**
- **Nom**: Le titre du template (ex: "Évaluation du Leadership")
- **Description**: Une description courte du template
- **Version**: Numéro de version (ex: "1.0", "2.1")
- **Statut**: Publié ou Brouillon

### 2. **Pages**
Chaque template contient une ou plusieurs pages. Chaque page représente une section de l'évaluation.

**Propriétés d'une Page:**
- **Titre**: Nom de la section (ex: "Vision & Stratégie")
- **Description**: Texte d'introduction pour cette section
- **Questions**: Liste des questions dans cette page

### 3. **Questions**
Chaque page contient des questions. Il existe 4 types de questions:

#### a) **Choix Unique** (`single_choice`)
Une seule réponse possible parmi plusieurs options.

**Configuration:**
- Texte de la question
- Liste d'options avec:
  - Texte de l'option
  - Points attribués (0-10)
- Obligatoire: Oui/Non

**Exemple:**
```
Question: À quelle fréquence communiquez-vous votre vision ?
Options:
  - Quotidiennement (5 points)
  - Hebdomadairement (4 points)
  - Mensuellement (3 points)
  - Rarement (1 point)
```

#### b) **Choix Multiples** (`multiple_choice`)
Plusieurs réponses possibles.

**Configuration:**
- Texte de la question
- Liste d'options avec texte et points
- Obligatoire: Oui/Non

**Exemple:**
```
Question: Quels outils stratégiques utilisez-vous ?
Options:
  - Analyse SWOT (1 point)
  - OKRs (1 point)
  - Balanced Scorecard (1 point)
```

#### c) **Échelle** (`scale`)
Notation sur une échelle numérique.

**Configuration:**
- Texte de la question
- Minimum (généralement 1)
- Maximum (généralement 10)
- Obligatoire: Oui/Non

**Exemple:**
```
Question: Évaluez votre capacité à développer des plans stratégiques
Échelle: 1 (Faible) à 10 (Excellent)
```

#### d) **Texte Libre** (`text`)
Réponse textuelle libre.

**Configuration:**
- Texte de la question
- Obligatoire: Oui/Non

**Exemple:**
```
Question: Décrivez une situation où vous avez démontré du leadership
Réponse: Texte libre (textarea)
```

## Guide d'Utilisation Pas à Pas

### Créer un Nouveau Template

1. **Cliquer sur "➕ Nouveau Template"**

2. **Remplir les Informations Générales**
   - Nom: "Mon Évaluation"
   - Description: "Évaluation des compétences..."
   - Version: "1.0"
   - ☑ Publié (si prêt à utiliser)

3. **Ajouter une Page**
   - Cliquer sur "➕ Ajouter une Page"
   - Titre: "Compétences Techniques"
   - Description: "Évaluation de vos compétences techniques"

4. **Ajouter des Questions**
   - Cliquer sur "➕ Ajouter une Question"
   - Choisir le type: Choix unique / Multiples / Échelle / Texte
   - Remplir le texte de la question
   - Configurer les options (si choix unique/multiples)
   - ☑ Cocher "Obligatoire" si nécessaire

5. **Réorganiser**
   - Utiliser ⬆️ ⬇️ pour déplacer les pages
   - Glisser les questions pour les réorganiser

6. **Enregistrer**
   - Cliquer sur "💾 Enregistrer"
   - Le template est sauvegardé dans localStorage

### Modifier un Template Existant

1. Dans la liste des templates, cliquer sur **"✏️ Modifier"**
2. Faire les modifications nécessaires
3. Cliquer sur **"💾 Enregistrer"**

### Dupliquer un Template

1. Cliquer sur **"📋 Dupliquer"**
2. Une copie est créée avec le nom "(Copie)"
3. Modifier la copie selon vos besoins

### Supprimer un Template

1. Cliquer sur **"🗑️ Supprimer"**
2. Confirmer la suppression

## Exemple de Template Complet

```json
{
  "templateId": "template-custom-001",
  "name": "Évaluation des Soft Skills",
  "description": "Évaluation des compétences comportementales",
  "version": "1.0",
  "published": true,
  "pages": [
    {
      "id": "page-1",
      "title": "Communication",
      "description": "Évaluation de vos compétences en communication",
      "questions": [
        {
          "id": "q1",
          "type": "single_choice",
          "text": "Comment préférez-vous communiquer avec votre équipe ?",
          "required": true,
          "options": [
            { "id": "opt1", "text": "En personne", "value": 5 },
            { "id": "opt2", "text": "Par email", "value": 3 },
            { "id": "opt3", "text": "Par messagerie instantanée", "value": 4 }
          ]
        },
        {
          "id": "q2",
          "type": "scale",
          "text": "Évaluez votre capacité d'écoute active",
          "required": true,
          "scaleMin": 1,
          "scaleMax": 10
        },
        {
          "id": "q3",
          "type": "text",
          "text": "Décrivez une situation où vous avez résolu un conflit",
          "required": false
        }
      ]
    },
    {
      "id": "page-2",
      "title": "Travail d'Équipe",
      "questions": [
        {
          "id": "q4",
          "type": "multiple_choice",
          "text": "Quels rôles occupez-vous généralement en équipe ?",
          "required": true,
          "options": [
            { "id": "opt1", "text": "Leader", "value": 1 },
            { "id": "opt2", "text": "Facilitateur", "value": 1 },
            { "id": "opt3", "text": "Expert technique", "value": 1 },
            { "id": "opt4", "text": "Organisateur", "value": 1 }
          ]
        }
      ]
    }
  ],
  "totalPages": 2
}
```

## Système de Scoring

### Calcul des Scores

Pour chaque question:

- **Choix unique**: Points de l'option sélectionnée
- **Choix multiples**: Somme des points des options sélectionnées
- **Échelle**: Valeur sélectionnée (1-10)
- **Texte libre**: Non scoré (0 points)

### Score par Page

```
Score Page = Somme des points obtenus / Somme des points maximum possible × 100
```

### Score Global

```
Score Global = Somme de tous les points / Somme de tous les points maximum × 100
```

## Bonnes Pratiques

### Structure

✅ **DO:**
- Organiser logiquement en pages thématiques (3-5 pages)
- 3-5 questions par page pour ne pas surcharger
- Mélanger les types de questions pour varier
- Commencer par des questions faciles

❌ **DON'T:**
- Plus de 10 pages (trop long)
- Une seule question par page
- Que des questions texte libre (difficile à scorer)
- Questions ambiguës ou doubles

### Questions

✅ **DO:**
- Questions claires et concises
- Une seule idée par question
- Langage adapté à l'audience
- Exemples concrets

❌ **DON'T:**
- Questions trop longues ou complexes
- Jargon technique non expliqué
- Questions biaisées
- Doubles négations

### Options de Réponse

✅ **DO:**
- 4-6 options pour choix unique
- Options mutuellement exclusives
- Gradation logique (Jamais → Toujours)
- Points cohérents avec la valeur

❌ **DON'T:**
- Trop d'options (>8)
- Options qui se chevauchent
- Points arbitraires

## Stockage et Persistance

**Note importante**: Actuellement, les templates créés sont stockés dans le **localStorage** du navigateur.

**Implications:**
- ✅ Rapide et facile pour la démo
- ✅ Pas besoin de backend
- ❌ Perdu si vous videz le cache
- ❌ Non partagé entre utilisateurs

**Pour la production**: Les templates devraient être stockés dans MongoDB via une API.

## Utilisation des Templates Créés

Une fois un template créé et publié:

1. Il apparaît dans la liste des templates disponibles
2. Vous pouvez créer des sessions basées sur ce template
3. Les participants répondent aux questions
4. Les résultats sont calculés automatiquement selon le scoring

## Limites Actuelles

- Templates stockés en localStorage (non persistent)
- Pas de validation avancée des questions
- Pas de prévisualisation live
- Pas de gestion de versions avancée
- Pas d'import/export de templates

## Prochaines Fonctionnalités

- [ ] Persistance en base de données
- [ ] Import/Export JSON
- [ ] Prévisualisation en temps réel
- [ ] Templates prédéfinis (bibliothèque)
- [ ] Logique conditionnelle (skip questions)
- [ ] Traductions multilingues
- [ ] Analytics sur les templates
- [ ] Collaboration multi-utilisateurs

## Support Technique

Pour toute question ou suggestion:
- 📧 Email: support@janus-platform.com
- 📖 Documentation: https://docs.janus-platform.com
- 💬 Chat: Support dans l'application

---

**Dernière mise à jour**: 2026-02-06
**Version**: 1.0
