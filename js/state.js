// ── Info registry ─────────────────────────────────────────
export const I = {
  inflation:{t:"Inflation (IPC)",b:"Utilisé pour relativiser les performances en euros constants. N'affecte pas les flux nominaux calculés."},
  regime:{t:"Régime fiscal locatif",b:"<b>LMNP Réel</b> : amortissements déductibles (bien + travaux).<br><b>Micro-BIC</b> : abattement 50%.<br><b>Foncier nu réel</b> : charges réelles, sans amortissement."},
  tauxActu:{t:"Taux d'actualisation (VAN)",b:"Taux utilisé pour calculer la Valeur Actuelle Nette. Représente le coût d'opportunité du capital — typiquement le rendement attendu d'un placement alternatif."},
  rendAlt:{t:"Rendement ETF / placement alternatif",b:"Rendement annuel net du portefeuille ETF. Utilisé pour capitaliser le surplus mensuel investi dans <b>tous les scénarios</b> (loc, RP, ETF pur). Historiquement ~7-8% brut ETF World, ~5-6% net après impôts et inflation."},
  budgetMensuel:{t:"Budget mensuel logement+investissement",b:"Enveloppe mensuelle fixe disponible pour se loger <b>et</b> investir. Le surplus non consommé par les coûts réels (mensualité, loyer perso, charges…) est automatiquement investi en ETF. Permet une comparaison équitable entre tous les scénarios sur la même base de sacrifice mensuel."},
  investirSurplus:{t:"Investir le surplus en ETF",b:"Si activé : chaque mois, la différence entre le budget mensuel et les sorties réelles est investie en ETF au taux 'Rdt placement alternatif'.<br>Cela normalise la comparaison : chaque scénario utilise la même enveloppe mensuelle, l'argent non dépensé en immo va en ETF.<br>Le tiret représente le scénario <b>ETF pur</b> : apport ETF de référence + même surplus investi sans aucun achat immobilier."},
  apportETF:{t:"Apport ETF pur (référence)",b:"Capital de départ investi dans le scénario ETF pur de référence. C'est la seule simulation automatique : pas d'achat immo, l'apport + le surplus mensuel (budget − loyer actuel) sont capitalisés en ETF. Ajustez pour comparer équitablement avec vos simulations A/B/C."},
  prixAchat:{t:"Prix d'achat net vendeur",b:"Prix payé au vendeur, hors frais.",code:"Rendement brut = Loyer×12 / Coût total"},
  fraisNotaire:{t:"Frais de notaire",b:"7-8% dans l'ancien, 2-3% dans le neuf."},
  travaux:{t:"Travaux de rénovation",b:"En LMNP Réel, amortissables sur plusieurs années.",code:"Amort. travaux = Travaux × Taux amort."},
  fraisAgence:{t:"Frais d'agence acheteur",b:"Honoraires d'agence à charge de l'acheteur."},
  apport:{t:"Apport personnel",b:"Capital propre investi. Réduit le montant emprunté mais aussi le levier."},
  taux:{t:"Taux d'intérêt nominal",b:"Taux nominal du prêt.",code:"Mensualité = K×(τ/12)/(1−(1+τ/12)^−n)"},
  duree:{t:"Durée du prêt",b:"Plus long = mensualité plus faible mais coût total plus élevé."},
  assurance:{t:"Assurance emprunteur (ADI)",b:"0.10-0.40%/an du capital selon profil.",code:"Assurance mens. = Capital × taux / 12"},
  revalBien:{t:"Revalorisation du bien",b:"Hypothèse de hausse annuelle. ~2-3%/an historique en France.",code:"Valeur an N = Prix × (1+taux)^N"},
  fraisVente:{t:"Frais d'agence vente",b:"3-7% du prix de vente. Négociable ou évitable en PAP."},
  loyer:{t:"Loyer mensuel brut",b:"Hors charges récupérables. Levier n°1 de la rentabilité.",code:"Rdt brut = Loyer×12 / Coût total"},
  vacance:{t:"Vacance locative",b:"5-8% en zone tendue, 10-15% en zone rurale.",code:"Loyer encaissé = Loyer brut × (1−vacance)"},
  taxeFonciere:{t:"Taxe foncière",b:"Impôt local annuel. Varie fortement selon la commune."},
  chargesCopro:{t:"Charges copro non récupérables",b:"Restent à charge du propriétaire."},
  assurPNO:{t:"Assurance PNO",b:"Obligatoire en copropriété. 100-300€/an."},
  fraisGestion:{t:"Gestion locative",b:"6-9% TTC des loyers encaissés si agence."},
  provision:{t:"Provision travaux",b:"Épargne de précaution. Règle : ~1% valeur/an."},
  revalLoyer:{t:"Revalorisation loyer",b:"Plafonnée à l'IRL. 1-4%/an selon inflation.",code:"Loyer an N = Loyer × (1+taux)^(N−1)"},
  tmi:{t:"TMI",b:"Tranche marginale : 0%, 11%, 30%, 41% ou 45%.",code:"Impôts = Rev. imposable × (TMI+PS)"},
  ps:{t:"Prélèvements sociaux",b:"17.2% sur les revenus fonciers (CSG+CRDS+solidarité)."},
  amortBien:{t:"Amortissement bien",b:"LMNP Réel uniquement. Typique 25-40 ans → 2.5-4%/an."},
  amortTravaux:{t:"Amortissement travaux",b:"LMNP Réel. Typique 7-10 ans → 10-14%/an."},
  impotPV:{t:"Impôt plus-value",b:"19% IR + 17.2% PS = 36.2%. Abattements progressifs. RP exonérée."},
  psPV:{t:"PS sur plus-value",b:"17.2%. Exonération totale après 30 ans."},
  loyerPerso:{t:"Loyer actuel (que vous payez)",b:"Le loyer mensuel que vous payez pour vous loger. En mode locatif : soustrait du CF pour comparer à situation équivalente. En mode RP : c'est l'économie réalisée si vous achetez.",code:"CF réel (loc) = CF locatif − Loyer perso\nÉconomie (RP) = Loyer perso − Mensualité"},
  revalLoyerPerso:{t:"Revalorisation loyer marché %/an",b:"Hausse annuelle de votre loyer. Sert à projeter l'économie future (RP) et le coût futur (locatif). ~1-3%/an indexé IRL."},
  assurHab:{t:"Assurance habitation",b:"Assurance multirisque habitation propriétaire occupant. 200-500€/an."},
  chargesCoproRP:{t:"Charges copropriété RP",b:"Totalité des charges (pas de distinction récupérable/non). 50-200€/mois."},
  taxeFonciereRP:{t:"Taxe foncière RP",b:"Même impôt que pour un locatif. Pas de taxe d'habitation depuis 2023 pour les RP."},
  provisionRP:{t:"Provision travaux RP",b:"Budget annuel pour l'entretien. ~1% de la valeur du bien."},
};

// ── Global settings ────────────────────────────────────────
export const G = {
  inflation:2, regime:'lmnp', horizon:20, tauxActu:3, rendAlt:6,
  loyerPerso:900, revalLoyerPerso:2, budgetMensuel:2500,
  investirSurplus:true, apportETF:60000,
};

export const COL = { A:'#6C9AFF', B:'#FF9D5C', C:'#5CEFB0' };
export const KEYS = ['A','B','C'];

// ── Simulation defaults ────────────────────────────────────
export function mkDef(mode){
  return{
    mode,
    enabled:true,
    label:mode==='loc'?'Locatif':'Résidence principale',
    prixAchat:250000,fraisNotaire:20000,travaux:15000,fraisAgence:0,apport:50000,
    taux:3.85,duree:20,assurance:0.25,
    revalBien:2.0,fraisVente:4,
    loyer:1000,vacance:5,taxeFonciere:1200,chargesCopro:800,assurPNO:200,
    fraisGestion:7,provision:500,revalLoyer:1.5,
    tmi:30,ps:17.2,amortBien:2.5,amortTravaux:10,
    impotPV:19,psPV:17.2,
    taxeFonciereRP:1200,chargesCoproRP:1200,assurHab:300,provisionRP:500,
  };
}

export const sims = {
  A:{...mkDef('loc'),label:'Locatif — Centre-ville',prixAchat:280000,fraisNotaire:22000,loyer:1050,apport:60000},
  B:{...mkDef('rp'),label:'RP — Achat appart',prixAchat:320000,fraisNotaire:25000,apport:70000},
  C:{...mkDef('loc'),label:'Locatif — Périphérie',prixAchat:180000,fraisNotaire:14000,loyer:750,apport:35000,taux:3.5,duree:15},
};

// ── Field definitions ──────────────────────────────────────
export const GRP_COMMON = [
  {t:'Acquisition',i:'🏠',f:[
    {k:'prixAchat',l:"Prix d'achat",tp:'e',mn:10000,mx:2000000,st:1000},
    {k:'fraisNotaire',l:'Frais de notaire',tp:'e',mn:0,mx:100000,st:500},
    {k:'travaux',l:'Travaux',tp:'e',mn:0,mx:400000,st:1000},
    {k:'fraisAgence',l:"Frais d'agence achat",tp:'e',mn:0,mx:40000,st:500},
    {k:'apport',l:'Apport personnel',tp:'e',mn:0,mx:500000,st:1000},
  ]},
  {t:'Financement',i:'💳',f:[
    {k:'taux',l:'Taux intérêt',tp:'%',mn:.5,mx:10,st:.05},
    {k:'duree',l:'Durée (ans)',tp:'n',mn:5,mx:30,st:1},
    {k:'assurance',l:'Assurance emprunteur',tp:'%',mn:0,mx:1,st:.01},
  ]},
  {t:'Revente',i:'🏷️',f:[
    {k:'revalBien',l:'Reval. bien %/an',tp:'%',mn:-2,mx:10,st:.1},
    {k:'fraisVente',l:'Frais agence vente',tp:'%',mn:0,mx:10,st:.5},
  ]},
];

export const GRP_LOC = [
  {t:'Exploitation',i:'📊',f:[
    {k:'loyer',l:'Loyer mensuel brut',tp:'e',mn:100,mx:8000,st:50},
    {k:'vacance',l:'Taux vacance',tp:'%',mn:0,mx:30,st:.5},
    {k:'taxeFonciere',l:'Taxe foncière (€/an)',tp:'e',mn:0,mx:10000,st:100},
    {k:'chargesCopro',l:'Charges copro (€/an)',tp:'e',mn:0,mx:8000,st:100},
    {k:'assurPNO',l:'Assurance PNO (€/an)',tp:'e',mn:0,mx:2000,st:50},
    {k:'fraisGestion',l:'Gestion locative',tp:'%',mn:0,mx:15,st:.5},
    {k:'provision',l:'Provision travaux (€/an)',tp:'e',mn:0,mx:5000,st:100},
    {k:'revalLoyer',l:'Reval. loyer %/an',tp:'%',mn:0,mx:5,st:.1},
  ]},
  {t:'Fiscalité',i:'🧾',f:[
    {k:'tmi',l:'TMI',tp:'%',mn:0,mx:45,st:1},
    {k:'ps',l:'Prélèvements sociaux',tp:'%',mn:0,mx:20,st:.1},
    {k:'amortBien',l:'Amort. bien %/an',tp:'%',mn:0,mx:5,st:.1},
    {k:'amortTravaux',l:'Amort. travaux %/an',tp:'%',mn:0,mx:25,st:1},
    {k:'impotPV',l:'Impôt plus-value',tp:'%',mn:0,mx:50,st:1},
    {k:'psPV',l:'PS sur plus-value',tp:'%',mn:0,mx:20,st:.1},
  ]},
];

export const GRP_RP = [
  {t:'Résidence principale',i:'🏡',f:[
    {k:'taxeFonciereRP',l:'Taxe foncière',tp:'e',mn:0,mx:10000,st:100},
    {k:'chargesCoproRP',l:'Charges copro (€/an)',tp:'e',mn:0,mx:8000,st:100},
    {k:'assurHab',l:'Assurance habitation (€/an)',tp:'e',mn:0,mx:2000,st:50},
    {k:'provisionRP',l:'Provision travaux (€/an)',tp:'e',mn:0,mx:5000,st:100},
  ]},
];

export function getGroups(mode){ return[...GRP_COMMON,...(mode==='loc'?GRP_LOC:GRP_RP)]; }
export function GROUPS_ALL(){ return[...GRP_COMMON,...GRP_LOC,...GRP_RP].flatMap(g=>g.f); }
