/* 7ACE FuelOS — language support (English / Español / Français)
 *
 * English and Spanish are built into the app itself. French works as a
 * translation layer: the app keeps writing English, and while French is
 * selected this file translates what appears on screen (text, placeholders,
 * tooltips) and restores it when you switch back. Nothing stored (meal names,
 * food names, logs) is ever changed — only what is displayed.
 *
 * To add another language later: add an entry to LANGS and a dictionary
 * like FR below.
 */
(function () {
  'use strict';

  var LANGS = [
    { code: 'en', label: 'EN', name: 'English',  locale: 'en-US', speech: 'en-US', ai: 'English' },
    { code: 'es', label: 'ES', name: 'Español',  locale: 'es-US', speech: 'es-US', ai: 'Spanish' },
    { code: 'fr', label: 'FR', name: 'Français', locale: 'fr-FR', speech: 'fr-FR', ai: 'French'  }
  ];
  function info(l) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === l) return LANGS[i]; return LANGS[0]; }

  var MEALS = {
    'Breakfast': 'Petit-déjeuner', 'Morning Snack': 'Collation du matin', 'Lunch': 'Déjeuner',
    'Pre-Workout': 'Avant l’entraînement', 'Post-Workout': 'Après l’entraînement',
    'Dinner': 'Dîner', 'Night Snack': 'Collation du soir'
  };
  var MEAL_RX = '(Breakfast|Morning Snack|Lunch|Pre-Workout|Post-Workout|Dinner|Night Snack)';
  function M(m) { return MEALS[m] || m; }

  var MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  var MONTH_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MONTH_EN_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONTH_FR_SHORT = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  var DOW_EN = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  var DOW_FR = ['DIM','LUN','MAR','MER','JEU','VEN','SAM'];

  /* ---------- exact-text dictionary (English → French) ---------- */
  var FR = {
    // header / install
    '7ACE FuelOS — Athlete Nutrition System': '7ACE FuelOS — Système de nutrition pour athlètes',
    'Back to 7ACE Hub': 'Retour au Hub 7ACE',
    'Install 7ACE FuelOS': 'Installer 7ACE FuelOS',
    'Tap': 'Appuyez sur', 'Share': 'Partager', 'Add to Home Screen': 'Sur l’écran d’accueil',
    'for the full app experience': 'pour l’expérience complète de l’application',
    'Athlete Nutrition System': 'Système de nutrition pour athlètes',
    // setup
    'Your name': 'Votre nom', 'Language': 'Langue', 'CONTINUE →': 'CONTINUER →',
    'Select your goal': 'Choisissez votre objectif',
    'Maintain & Perform': 'Maintenir et performer', 'Stay at weight, maximize output': 'Garder son poids, maximiser le rendement',
    'Gain Weight / Bulk': 'Prendre du poids / Prise de masse', 'Caloric surplus for muscle & mass': 'Surplus calorique pour le muscle et la masse',
    'Lose Weight / Cut': 'Perdre du poids / Sèche', 'Caloric deficit, preserve muscle': 'Déficit calorique, préserver le muscle',
    'Build Muscle / Recomp': 'Prendre du muscle / Recomposition', 'Gain muscle, lose fat simultaneously': 'Gagner du muscle et perdre du gras en même temps',
    'Body stats': 'Données corporelles', 'Current weight (lbs)': 'Poids actuel (lb)', 'Goal weight (lbs)': 'Poids cible (lb)',
    'Daily macro targets': 'Objectifs de macros quotidiens',
    'protein g': 'protéines g', 'carbs g': 'glucides g', 'fat g': 'lipides g', 'kcal': 'kcal',
    'Not sure? Leave blank — we\'ll set smart defaults based on your goal.': 'Pas sûr ? Laissez vide — nous définirons des valeurs adaptées à votre objectif.',
    'YOU\'RE READY': 'VOUS ÊTES PRÊT', 'Your nutrition program is live. Track every meal, every day.': 'Votre programme nutritionnel est actif. Suivez chaque repas, chaque jour.',
    '"Confía en el proceso, no en el resultado." — Coach Carlos Subero': '« Faites confiance au processus, pas seulement au résultat. » — Coach Carlos Subero',
    'LAUNCH FUELOS →': 'LANCER FUELOS →',
    'Proverbios 21:31 — Confía en el proceso, no en el resultado.': 'Proverbes 21:31 — Faites confiance au processus, pas seulement au résultat.',
    'Proverbios 21:31 — Trust the process, not just the result.': 'Proverbes 21:31 — Faites confiance au processus, pas seulement au résultat.',
    'e.g. Alex Rivera': 'p. ex. Alex Rivera',
    // nav
    'MEMBER': 'MEMBRE', 'TODAY': 'AUJOURD’HUI', 'WEEKLY': 'SEMAINE', 'MONTHLY': 'MOIS',
    'Your Accent Color': 'Votre couleur d’accent', 'SET COLOR': 'APPLIQUER', 'Reset to goal default': 'Rétablir la couleur de l’objectif',
    'PERFORM': 'PERFORMANCE', 'MAINTAIN': 'MAINTIEN', 'BULK': 'MASSE', 'CUT': 'SÈCHE', 'RECOMP': 'RECOMP',
    '⟳ RESET': '⟳ RÉINITIALISER', 'Change your color': 'Changer la couleur', 'API Key Settings': 'Réglages de la clé API',
    'ATHLETE': 'ATHLÈTE', 'API KEY': 'CLÉ API', 'KEY ✓': 'CLÉ ✓', 'ADD KEY ⚠️': 'AJOUTER LA CLÉ ⚠️',
    // today
    'Day 1 Streak': 'Série de 1 jour', 'Keep logging every day to build your streak.': 'Enregistrez chaque jour pour bâtir votre série.',
    'day streak': 'jours de suite', '7-day %': '% sur 7 jours', 'FUEL DAY': 'JOUR FUEL',
    'Good morning': 'Bonjour', 'GOOD MORNING': 'BONJOUR', 'FUEL UP': 'À TABLE', 'EVENING LOG': 'JOURNAL DU SOIR',
    'Current Weight': 'Poids actuel', '— lbs': '— lb', 'PAST DAY': 'JOUR PASSÉ',
    'Calories': 'Calories', 'Protein': 'Protéines', 'Carbs': 'Glucides', 'Fat': 'Lipides',
    'You\'re behind on protein. Front-load now — it gets harder to catch up after 6 PM.': 'Vous êtes en retard sur les protéines. Rattrapez-vous maintenant — c’est plus difficile après 18 h.',
    'YES, LOG IT ✓': 'OUI, ENREGISTRER ✓', 'NOT TODAY': 'PAS AUJOURD’HUI',
    'Diet Plan': 'Plan alimentaire', 'Load your nutrition plan — every meal becomes a one-tap log.': 'Chargez votre plan nutritionnel — chaque repas s’enregistre en un tap.',
    'LOAD PLAN': 'CHARGER LE PLAN', 'CHANGE PLAN': 'CHANGER DE PLAN', 'Remove plan': 'Retirer le plan',
    'Quick Add': 'Ajout rapide', '＋ ADD FOOD': '＋ AJOUTER UN ALIMENT', 'ADD TO MY FAVORITES': 'AJOUTER À MES FAVORIS',
    '🤖 CALCULATE': '🤖 CALCULER', '⏳ Looking up macros...': '⏳ Recherche des macros...', '⏳ ...': '⏳ ...',
    'Auto-calculate macros with AI': 'Calculer les macros avec l’IA',
    'KCAL': 'KCAL', 'PROTEIN G': 'PROTÉINES G', 'CARBS G': 'GLUCIDES G', 'FAT G': 'LIPIDES G',
    '⭐ SAVE TO FAVORITES': '⭐ AJOUTER AUX FAVORIS', '📋 LOG TODAY': '📋 ENREGISTRER AUJ.',
    '📅 LOG TO': '📅 ENREGISTRER LE', '↩ TODAY': '↩ AUJOURD’HUI', '✕ CANCEL': '✕ ANNULER',
    'All': 'Tous', 'My Favorites': 'Mes favoris', 'My Meals': 'Mes repas', 'My Foods': 'Mes aliments',
    'ADD FOOD': 'AJOUTER UN ALIMENT', 'VOICE': 'VOIX', 'LISTENING...': 'ÉCOUTE...',
    '🤖 AI PARSE': '🤖 ANALYSE IA', '📷 PHOTO': '📷 PHOTO', '✏️ MANUAL': '✏️ MANUEL', 'ANALYZE →': 'ANALYSER →',
    'Breakfast / Desayuno': 'Petit-déjeuner', 'Morning Snack / Merienda mañana': 'Collation du matin', 'Lunch / Almuerzo': 'Déjeuner',
    'Pre-Workout / Pre-Entreno': 'Avant l’entraînement', 'Post-Workout / Post-Entreno': 'Après l’entraînement',
    'Dinner / Cena': 'Dîner', 'Night Snack / Cena tardía': 'Collation du soir',
    'M. Snack': 'Coll. matin', 'N. Snack': 'Coll. soir',
    'Analyzing with AI...': 'Analyse par l’IA...', 'AI DETECTED THESE FOODS — TAP TO DESELECT': 'L’IA A DÉTECTÉ CES ALIMENTS — TOUCHEZ POUR DÉSÉLECTIONNER',
    'ADD TO LOG': 'AJOUTER AU JOURNAL', '＋ SAVE TO QUICK ADD': '＋ AJOUTER À L’AJOUT RAPIDE', 'CLEAR': 'EFFACER',
    'Tap to take a photo or upload': 'Touchez pour prendre une photo ou en importer une',
    'Snap your food or nutrition label — AI reads it automatically': 'Photographiez votre aliment ou l’étiquette nutritionnelle — l’IA la lit automatiquement',
    'CHANGE PHOTO': 'CHANGER LA PHOTO', 'servings / packets': 'portions / paquets', '🔍 ANALYZE PHOTO': '🔍 ANALYSER LA PHOTO',
    'Reading label with AI...': 'Lecture de l’étiquette par l’IA...',
    '＋ SAVE TO MY FOODS': '＋ AJOUTER À MES ALIMENTS', 'LOG + SAVE': 'ENREGISTRER + AJOUTER',
    'ADD FOOD +': 'AJOUTER UN ALIMENT +', '＋ QUICK ADD': '＋ AJOUT RAPIDE',
    'Today\'s Log': 'Journal du jour', 'TODAY\'S LOG': 'JOURNAL DU JOUR',
    'No food logged yet. Add your first meal above.': 'Aucun aliment enregistré. Ajoutez votre premier repas ci-dessus.',
    'This Week': 'Cette semaine', 'Calorie Intake — Last 7 Days': 'Apport calorique — 7 derniers jours', 'Daily Breakdown': 'Détail quotidien',
    'Week Calories': 'Calories de la semaine', 'Week Protein': 'Protéines de la semaine', 'Week Carbs': 'Glucides de la semaine',
    'Week Fat': 'Lipides de la semaine', 'Days Logged': 'Jours enregistrés', 'On-Target Days': 'Jours dans l’objectif',
    'Month Calories': 'Calories du mois', 'Month Protein': 'Protéines du mois', 'Month Carbs': 'Glucides du mois',
    'Within 10% of target': 'À ±10 % de l’objectif',
    'OVERVIEW': 'APERÇU', '🧠 AI COACH': '🧠 COACH IA', 'CALENDAR': 'CALENDRIER',
    'Weight Log This Month': 'Suivi du poids ce mois-ci',
    'No weight entries this month — tap your weight to log.': 'Aucun poids enregistré ce mois-ci — touchez votre poids pour l’enregistrer.',
    'No entries for': 'Aucune entrée pour',
    '📊 EATING PATTERNS': '📊 HABITUDES ALIMENTAIRES', 'Log a few days of meals to see your patterns here.': 'Enregistrez quelques jours de repas pour voir vos habitudes ici.',
    '🕐 CALORIES BY MEAL SLOT': '🕐 CALORIES PAR REPAS', 'Log meals across different slots to see your distribution.': 'Enregistrez des repas à différents moments pour voir la répartition.',
    'Avg Daily Calories': 'Calories moy. par jour', 'Avg Daily Protein': 'Protéines moy. par jour', 'Avg Carbs · Fat': 'Glucides · Lipides moy.',
    'Breakfasts Skipped': 'Petits-déjeuners sautés', 'Calories After 6 PM': 'Calories après 18 h', 'Most Logged:': 'Les plus enregistrés :',
    '🧠 ANALYZE MY DIET — GET DIAGNOSIS': '🧠 ANALYSER MON ALIMENTATION — OBTENIR LE DIAGNOSTIC',
    '🧠 ANALYZING YOUR DIET...': '🧠 ANALYSE DE VOTRE ALIMENTATION...', 'FUELOS DIAGNOSIS': 'DIAGNOSTIC FUELOS',
    'GOAL ALIGNMENT': 'ALIGNEMENT SUR L’OBJECTIF', 'EATING PATTERNS': 'HABITUDES ALIMENTAIRES', 'PROTEIN TIMING': 'TIMING DES PROTÉINES',
    'RED FLAGS': 'POINTS D’ALERTE', 'COACH\'S PRESCRIPTION': 'ORDONNANCE DU COACH',
    'ASK YOUR COACH': 'POSEZ VOS QUESTIONS À VOTRE COACH', 'Your full diet data is loaded — ask anything specific': 'Toutes vos données alimentaires sont chargées — posez n’importe quelle question précise',
    'Hey! I have your full nutrition data in front of me. Ask me anything — why you\'re not hitting your goal, what your eating patterns say, whether your protein timing is right, or what to change starting tomorrow. Be specific and I\'ll be direct.':
      'Salut ! J’ai toutes vos données nutritionnelles sous les yeux. Demandez-moi ce que vous voulez — pourquoi vous n’atteignez pas votre objectif, ce que disent vos habitudes alimentaires, si le timing de vos protéines est bon, ou quoi changer dès demain. Soyez précis, je serai direct.',
    'SEND →': 'ENVOYER →', 'Thinking...': 'Réflexion...',
    'Nutrition Calendar': 'Calendrier nutritionnel',
    'LOG WEIGHT': 'ENREGISTRER LE POIDS', 'Enter your current weight in lbs.': 'Entrez votre poids actuel en lb.',
    'Cancel': 'Annuler', 'SAVE': 'ENREGISTRER',
    'RESET DATA': 'RÉINITIALISER LES DONNÉES', 'This will erase': 'Cela effacera', 'all logged food entries': 'tous les aliments enregistrés',
    'and': 'et', 'weight entries': 'les poids enregistrés', 'permanently.': 'définitivement.', 'Your': 'Votre',
    'profile, goal, targets, and Quick Add library': 'profil, objectif, cibles et bibliothèque d’ajout rapide', 'will stay untouched.': 'resteront intacts.',
    'This cannot be undone.': 'Cette action est irréversible.', 'Cancel — Keep My Data': 'Annuler — Garder mes données', 'RESET EVERYTHING': 'TOUT RÉINITIALISER',
    'ANTHROPIC API KEY': 'CLÉ API ANTHROPIC',
    'Required for AI features: Photo Scanner, AI Parse, Coach Chat, and Fuelos Diagnosis.': 'Requise pour les fonctions IA : scan de photo, analyse IA, chat avec le coach et diagnostic Fuelos.',
    'Get your key at': 'Obtenez votre clé sur', 'SAVE KEY': 'ENREGISTRER LA CLÉ', 'REMOVE KEY': 'SUPPRIMER LA CLÉ',
    'Key is set — paste to replace': 'Clé enregistrée — collez pour la remplacer',
    '✅ Key is active — AI features enabled.': '✅ Clé active — fonctions IA activées.', '⚠️ No key set yet.': '⚠️ Aucune clé enregistrée.',
    '⚠️ Please paste your key first.': '⚠️ Collez d’abord votre clé.', '⚠️ Key should start with sk-': '⚠️ La clé doit commencer par sk-',
    '✅ Saved! AI features now active.': '✅ Enregistrée ! Fonctions IA activées.',
    'EDIT ENTRY': 'MODIFIER L’ENTRÉE', 'Food Name': 'Nom de l’aliment', 'Macros': 'Macros', 'Meal Slot': 'Repas',
    'SAVE CHANGES': 'ENREGISTRER LES MODIFICATIONS', 'Edit': 'Modifier', 'Remove': 'Supprimer', 'Food name': 'Nom de l’aliment',
    'LOAD DIET PLAN': 'CHARGER UN PLAN ALIMENTAIRE',
    'Paste your diet plan in any format — from Coach Carlos, a nutritionist, or your own notes. AI parses it into meals with full macros, and each one appears in your Quick Add under the':
      'Collez votre plan alimentaire dans n’importe quel format — de Coach Carlos, d’un nutritionniste ou de vos notes. L’IA le découpe en repas avec macros complètes, et chacun apparaît dans votre Ajout rapide sous la',
    'category': 'catégorie', 'category for one-tap logging.': 'catégorie pour un enregistrement en un tap.',
    'AI DETECTED — TAP TO DESELECT': 'DÉTECTÉ PAR L’IA — TOUCHEZ POUR DÉSÉLECTIONNER', 'Sign in to sync': 'Se connecter pour synchroniser', 'for one-tap logging.': 'pour un enregistrement en un tap.',
    'Plan Name': 'Nom du plan', 'Paste Your Full Plan (any format)': 'Collez votre plan complet (n’importe quel format)',
    'PARSE & LOAD →': 'ANALYSER ET CHARGER →', 'AI is parsing your plan...': 'L’IA analyse votre plan...',
    'Send it to a different meal instead:': 'Envoyez-le plutôt vers un autre repas :', 'Send it to a different meal:': 'Envoyez-le vers un autre repas :',
    'e.g. Coach Carlos Bulk Plan — Phase 1': 'p. ex. Plan prise de masse Coach Carlos — Phase 1',
    'Food name or describe what you ate...': 'Nom de l’aliment ou décrivez ce que vous avez mangé...',
    'e.g. 2 eggs, oatmeal with banana and peanut butter / 2 huevos, avena con plátano': 'p. ex. 2 œufs, flocons d’avoine avec banane et beurre de cacahuète',
    'Food name / Nombre del alimento': 'Nom de l’aliment',
    'e.g. Why am I not gaining weight? / ¿Por qué no estoy subiendo de peso?': 'p. ex. Pourquoi est-ce que je ne prends pas de poids ?',
    'Breakfast: 3 eggs, oatmeal with banana Lunch: chicken breast 8oz, white rice 1 cup, broccoli Post-Workout: protein shake with 2 scoops Dinner: salmon 6oz, sweet potato, asparagus Night Snack: greek yogurt with almonds':
      'Petit-déjeuner : 3 œufs, flocons d’avoine avec banane\nDéjeuner : blanc de poulet 220 g, riz blanc 1 tasse, brocoli\nAprès l’entraînement : shake protéiné avec 2 mesures\nDîner : saumon 170 g, patate douce, asperges\nCollation du soir : yaourt grec aux amandes',
    // goal text
    'Set in profile': 'À définir dans le profil',
    // toasts / messages
    '🎨 Color updated!': '🎨 Couleur mise à jour !', '🎨 Reset to goal default.': '🎨 Couleur de l’objectif rétablie.',
    '⟳ All food and weight data has been reset.': '⟳ Toutes les données d’aliments et de poids ont été réinitialisées.',
    '⚠️ Enter a food name first': '⚠️ Entrez d’abord le nom d’un aliment', '⚠️ Add your API key in Settings first': '⚠️ Ajoutez d’abord votre clé API dans les réglages',
    'Could not look up macros. Try again.': 'Impossible de trouver les macros. Réessayez.',
    '🗑 Removed from Quick Add': '🗑 Retiré de l’ajout rapide', 'Select items first.': 'Sélectionnez d’abord des aliments.',
    'Enter a food name first.': 'Entrez d’abord le nom de l’aliment.', 'Already in Quick Add.': 'Déjà dans l’ajout rapide.',
    'Log at least 2 days of meals first so the analysis means something.': 'Enregistrez d’abord au moins 2 jours de repas pour que l’analyse ait du sens.',
    '⚠️ Analysis failed. Check your connection and try again.': '⚠️ L’analyse a échoué. Vérifiez votre connexion et réessayez.',
    '⚠️ Paste your diet plan text first.': '⚠️ Collez d’abord le texte de votre plan alimentaire.',
    '⚠️ Could not parse the plan. Try a clearer format — one meal per line works best.': '⚠️ Impossible d’analyser le plan. Essayez un format plus clair — un repas par ligne fonctionne le mieux.',
    'Remove the active diet plan? Its meals will also be removed from Quick Add.': 'Retirer le plan alimentaire actif ? Ses repas seront aussi retirés de l’ajout rapide.',
    '📋 Diet plan removed.': '📋 Plan alimentaire retiré.',
    '📷 Please select a photo first': '📷 Sélectionnez d’abord une photo', 'Error reading image. Try again.': 'Erreur de lecture de l’image. Réessayez.',
    'Reset your profile and start over?': 'Réinitialiser votre profil et recommencer ?',
    'Remove your API key? AI features will stop working.': 'Supprimer votre clé API ? Les fonctions IA cesseront de fonctionner.',
    '🔑 API key removed': '🔑 Clé API supprimée',
    'Voice input not supported in this browser. Try Chrome or Edge.': 'La saisie vocale n’est pas prise en charge par ce navigateur. Essayez Chrome ou Edge.',
    '🎤 Voice not supported here. Open in Chrome or Edge.': '🎤 Voix non prise en charge ici. Ouvrez dans Chrome ou Edge.',
    'No speech detected. Try again.': 'Aucune parole détectée. Réessayez.', 'Microphone permission denied.': 'Autorisation du micro refusée.',
    'Network error.': 'Erreur réseau.', 'Voice error. Try again.': 'Erreur vocale. Réessayez.',
    'Describe what you ate.': 'Décrivez ce que vous avez mangé.', 'Select at least one food.': 'Sélectionnez au moins un aliment.',
    'Enter a food name.': 'Entrez le nom de l’aliment.', 'Food name cannot be empty.': 'Le nom de l’aliment ne peut pas être vide.',
    '✅ Entry updated.': '✅ Entrée mise à jour.',
    'Local estimate loaded. You can edit macros if needed.': 'Estimation locale chargée. Vous pouvez modifier les macros si besoin.',
    '⚠️ Connection error. Check your API key or try a more common food for the local estimator.': '⚠️ Erreur de connexion. Vérifiez votre clé API ou essayez un aliment plus courant pour l’estimateur local.',
    '⚠️ Could not parse. Be more specific, for example: “2 eggs, 1 toast, 1 banana”.': '⚠️ Analyse impossible. Soyez plus précis, par exemple : « 2 œufs, 1 toast, 1 banane ».',
    'Connection error. Try again.': 'Erreur de connexion. Réessayez.',
    'Enter a valid weight (80–400 lbs).': 'Entrez un poids valide (80–400 lb).',
    '🏆 GOAL REACHED!': '🏆 OBJECTIF ATTEINT !',
    'Today': 'Aujourd’hui', 'Today —': 'Aujourd’hui —',
    'SUN': 'DIM', 'MON': 'LUN', 'TUE': 'MAR', 'WED': 'MER', 'THU': 'JEU', 'FRI': 'VEN', 'SAT': 'SAM'
  };

  var FRL = {};
  Object.keys(FR).forEach(function (k) { FRL[norm(k).toLowerCase()] = FR[k]; });

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  /* ---------- pattern rules for text built at run time ---------- */
  // [regex, replacement]  (replacement may be a function)
  var RULES = [
    [/^(\d+)-Day Streak — Keep going!/i, function (m, n) { return 'Série de ' + n + ' jours — Continuez !'; }],
    [/^(\d+)-Day Streak/i, function (m, n) { return 'Série de ' + n + ' jours'; }],
    [/^Day (\d+) Streak/i, function (m, n) { return 'Série de ' + n + ' jour' + (n > 1 ? 's' : ''); }],
    [/^Day (\d+) Logged/i, function (m, n) { return 'Jour ' + n + ' enregistré'; }],
    [/^(\d+) saved$/i, function (m, n) { return n + ' enregistré' + (n > 1 ? 's' : ''); }],
    [/^(\d+) meals$/i, function (m, n) { return n + ' repas'; }],
    [/^(📅 )?Today — /i, function (m, e) { return (e || '') + 'Aujourd’hui — '; }],
    [/^Active:\s*$/i, function () { return 'Actif : '; }],
    [/^ ?· (\d+) meals ready in Quick Add/i, function (m, n) { return ' · ' + n + ' repas prêts dans l’ajout rapide'; }],
    [/^ ?· Target: ?/i, function () { return ' · Objectif : '; }],
    [/^ ?— tap to load into Quick Add/i, function () { return ' — touchez pour charger dans l’ajout rapide'; }],
    [/\bTarget:\s*/gi, function () { return 'Objectif : '; }],
    [/\bGoal:\s*/gi, function () { return 'Objectif : '; }],
    [/\bAvg:\s*/gi, function () { return 'Moy. : '; }],
    [/\bMin:\s*/g, function () { return 'Min : '; }],
    [/\bMax:\s*/g, function () { return 'Max : '; }],
    [/\bLatest:\s*/g, function () { return 'Dernier : '; }],
    [/(\d|g|kcal)\/day\b/g, function (m, a) { return a + '/jour'; }],
    [/(\d+)% consistency/g, function (m, n) { return n + ' % de régularité'; }],
    [/Within 10% of (\d+) kcal/g, function (m, n) { return 'À ±10 % de ' + n + ' kcal'; }],
    [/<small>\/logged<\/small>|\/logged\b/g, function () { return '/enreg.'; }],
    [/(\d)g P\b/g, function (m, n) { return n + 'g P'; }],
    [/(\d)g C\b/g, function (m, n) { return n + 'g G'; }],
    [/(\d)g F\b/g, function (m, n) { return n + 'g L'; }],
    [/(\d)g protein\b/g, function (m, n) { return n + ' g de protéines'; }],
    [/(\d)g carbs\b/g, function (m, n) { return n + ' g de glucides'; }],
    [/(\d)g fat\b/g, function (m, n) { return n + ' g de lipides'; }],
    [/\bper packet:/g, function () { return 'par paquet :'; }],
    [/(HIGH|MEDIUM|LOW) CONFIDENCE/gi, function (m, c) { return { high: 'CONFIANCE ÉLEVÉE', medium: 'CONFIANCE MOYENNE', low: 'CONFIANCE FAIBLE' }[c.toLowerCase()]; }],
    [/total for (\d+(?:\.\d+)?) packets?/g, function (m, n) { return 'total pour ' + n + ' paquet' + (+n > 1 ? 's' : ''); }],
    [/BASED ON (\d+) DAYS OF DATA/g, function (m, n) { return 'BASÉ SUR ' + n + ' JOURS DE DONNÉES'; }],
    [/([+-]?[\d.]+) lbs to ([\d.]+)/g, function (m, a, b) { return a + ' lb pour atteindre ' + b; }],
    [/(\d) lbs\b/g, function (m, a) { return a + ' lb'; }],
    [/📋 (\d+) meals loaded from "(.*)"/, function (m, n, name) { return '📋 ' + n + ' repas chargés depuis « ' + name + ' »'; }],
    [/^⚠️ "(.*)" already saved$/, function (m, n) { return '⚠️ « ' + n + ' » est déjà enregistré'; }],
    [/^⭐ "(.*)" saved to My Favorites$/, function (m, n) { return '⭐ « ' + n + ' » ajouté à Mes favoris'; }],
    [/^✅ Macros filled in for "(.*)"$/, function (m, n) { return '✅ Macros remplies pour « ' + n + ' »'; }],
    [/^⭐ (.*) saved to Quick Add$/, function (m, n) { return '⭐ ' + n + ' ajouté à l’ajout rapide'; }],
    [/^⭐ (\d+) saved to Quick Add$/, function (m, n) { return '⭐ ' + n + ' ajouté(s) à l’ajout rapide'; }],
    [new RegExp('^⚠️ "(.*)" is already logged in ' + MEAL_RX + '\\.$'), function (m, n, meal) { return '⚠️ « ' + n + ' » est déjà enregistré au repas « ' + M(meal) + ' ».'; }],
    [new RegExp('^"(.*)" is already in ' + MEAL_RX + ' too\\.$'), function (m, n, meal) { return '« ' + n + ' » est aussi déjà dans « ' + M(meal) + ' ».'; }],
    [/^"(.*)" is already in Quick Add\.?$/, function (m, n) { return '« ' + n + ' » est déjà dans l’ajout rapide.'; }],
    [new RegExp('^(✅ )?(.*) → ' + MEAL_RX + '(.*)$'), function (m, ok, n, meal, rest) { return (ok || '') + n + ' → ' + M(meal) + rest; }],
    [new RegExp('^📋 (.*) → ' + MEAL_RX + '$'), function (m, n, meal) { return '📋 ' + n + ' → ' + M(meal); }],
    [/^✅ (.*) logged to Breakfast\.$/, function (m, n) { return '✅ ' + n + ' ajouté au petit-déjeuner.'; }],
    [/^✅ Logged to (.*)$/, function (m, d) { return '✅ Enregistré le ' + d; }],
    [/^✅ Added: (\d+) items?$/, function (m, n) { return '✅ Ajouté : ' + n + ' aliment' + (n > 1 ? 's' : ''); }],
    [/^✅ Added: (.*)$/, function (m, n) { return '✅ Ajouté : ' + n; }],
    [/^⚖️ Weight logged: (.*)$/, function (m, w) { return '⚖️ Poids enregistré : ' + w; }],
    [/You had this (\d+) of the last 5 days at Breakfast/, function (m, n) { return 'Vous en avez mangé ' + n + ' des 5 derniers jours au petit-déjeuner'; }],
    [new RegExp('^(\\p{Extended_Pictographic}\\uFE0F? ?)?' + MEAL_RX + '( · .*|\\s—\\s*)?$', 'u'), function (m, e, meal, rest) { return (e || '') + M(meal) + (rest || ''); }],
    [new RegExp('^\\(' + MEAL_RX + '\\)$'), function (m, meal) { return '(' + M(meal) + ')'; }],
    [new RegExp('^' + MEAL_RX + ' — ?$'), function (m, meal) { return M(meal) + ' — '; }],
    [/(-?\d+) vs target/g, function (m, n) { return n + ' par rapport à l’objectif'; }],
    [/^READY, (.*)!$/, function (m, n) { return 'PRÊT, ' + n + ' !'; }]
  ];

  var MONTH_RX = new RegExp('\\b(' + MONTH_EN.join('|') + ')\\b');

  function fixTypography(s) {
    // French puts a (non-breaking) space before ? ! : ;
    return s.replace(/([\p{L}\p{N}\)»”"’])[  ]?([?!:;])(?=\s|$)/gu, '$1 $2');
  }

  function isUpper(s) { return /[A-Za-z]/.test(s) && s === s.toUpperCase(); }

  function translateFR(text) {
    if (!text || !/[A-Za-z]/.test(text)) return text;
    var lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
    var core = text.slice(lead.length, text.length - trail.length);
    if (!core) return text;
    var key = norm(core), out = null;
    var hit = FRL[key.toLowerCase()];
    if (hit !== undefined) out = hit;
    if (out === null) { // emoji / symbol prefix, optional arrow suffix
      var m = key.match(/^([^\p{L}\p{N}"“]*)(.*?)\s*$/u);
      if (m && m[2]) {
        var h2 = FRL[m[2].toLowerCase()];
        if (h2 !== undefined) out = m[1] + h2;
      }
    }
    if (out !== null) {
      if (isUpper(core)) out = out.toUpperCase();
      return lead + fixTypography(out) + trail;
    }
    // rules
    var cur = core, changed = false;
    for (var i = 0; i < RULES.length; i++) {
      var r = RULES[i][0], f = RULES[i][1];
      r.lastIndex = 0;
      if (r.test(cur)) {
        r.lastIndex = 0;
        var next = cur.replace(r, f);
        if (next !== cur) { cur = next; changed = true; }
      }
    }
    // month names inside date text
    if (MONTH_RX.test(cur)) {
      cur = cur.replace(MONTH_RX, function (m) { return MONTHS_FR[MONTH_EN.indexOf(m)]; });
      changed = true;
    }
    if (!changed) return text;
    if (isUpper(core)) cur = cur.toUpperCase();
    return lead + fixTypography(cur) + trail;
  }

  /* ---------- DOM translator ---------- */
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var active = 'en';
  var observer = null;
  var originals = new Map();      // text node -> {orig, tr}
  var attrOrig = new Map();       // element -> {attr: {orig, tr}}
  var busy = false;

  function trNode(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode;
      if (p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) return;
      var rec = originals.get(n);
      var cur = n.data;
      if (rec && rec.tr === cur) return;       // we wrote this one
      var out = translateFR(cur);
      if (out !== cur) { originals.set(n, { orig: cur, tr: out }); n.data = out; }
      else if (rec) originals.delete(n);
    } else if (n.nodeType === 1) {
      if (/^(SCRIPT|STYLE)$/.test(n.nodeName)) return;
      trAttrs(n);
      for (var c = n.firstChild; c; c = c.nextSibling) trNode(c);
    }
  }
  function trAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      var cur = el.getAttribute(a);
      var rec = attrOrig.get(el); rec = rec && rec[a];
      if (rec && rec.tr === cur) continue;
      var out = translateFR(cur);
      if (out !== cur) {
        var all = attrOrig.get(el) || {}; all[a] = { orig: cur, tr: out }; attrOrig.set(el, all);
        el.setAttribute(a, out);
      }
    }
  }
  function restore() {
    originals.forEach(function (rec, n) { if (n.data === rec.tr) n.data = rec.orig; });
    originals.clear();
    attrOrig.forEach(function (all, el) {
      Object.keys(all).forEach(function (a) { if (el.getAttribute(a) === all[a].tr) el.setAttribute(a, all[a].orig); });
    });
    attrOrig.clear();
  }
  function run(fn) { busy = true; try { fn(); } finally { busy = false; } }
  function startObserver() {
    if (observer || !window.MutationObserver) return;
    observer = new MutationObserver(function (muts) {
      if (busy || active !== 'fr') return;
      run(function () {
        muts.forEach(function (m) {
          if (m.type === 'characterData') trNode(m.target);
          else if (m.type === 'attributes') trAttrs(m.target);
          else m.addedNodes.forEach(trNode);
        });
      });
      observer.takeRecords();
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function setLang(l) {
    var prev = active;
    active = info(l).code;
    if (active === 'fr') {
      startObserver();
      run(function () { trNode(document.body); });
      document.documentElement.lang = 'fr';
      document.title = translateFR(document.title);
    } else {
      if (prev === 'fr') run(restore);
      document.documentElement.lang = active;
    }
  }

  window.FUEL_I18N = {
    langs: LANGS,
    info: info,
    setLang: setLang,
    refresh: function () { if (active === 'fr') run(function () { trNode(document.body); }); },
    locale: function (l) { return info(l).locale; },
    speech: function (l) { return info(l).speech; },
    aiName: function (l) { return info(l).ai; },
    trs: function (s) { return active === 'fr' ? translateFR(String(s)) : s; },
    mealName: function (m) { return active === 'fr' ? M(m) : m; },
    monthNames: function (l) { return l === 'fr' ? MONTHS_FR.map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1); }) : null; },
    dowLabels: function (l) { return l === 'fr' ? DOW_FR : null; },
    _translate: translateFR
  };
})();
