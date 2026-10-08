"""Scoped DILA fields: salaried PER, general PEE and private real estate."""
import re

SOURCES = {
 'pee': ('F2142', "Plan d'épargne entreprise (PEE)", {
  'peeCeiling': r"L'abondement ne peut pas dépasser \d+ fois le montant versé par le salarié, ni être supérieur à ([\d ,]+) €",
  'peeMultiplier': r"L'abondement ne peut pas dépasser ([\d]+) fois le montant versé par le salarié",
 }),
 'per': ('F34982', "Plan d'épargne retraite (PER)", {}),
 'property': ('F10864', 'Impôt sur le revenu - Plus-value immobilière', {
  'propertyIncome': r"La plus-value immobilière, après déduction du ou des abattements, est imposée à l'impôt sur le revenu au taux de ([\d,]+) %",
  'propertySocial': r'Vous devez payer des prélèvements sociaux au taux de ([\d,]+) %',
  'propertyIncomeYears': r"Vous êtes exonéré d'impôt sur la plus-value immobilière pour tout bien détenu depuis plus de ([\d]+) ans",
  'propertySocialYears': r'La plus-value réalisée lors de la vente d.un bien détenu depuis plus de ([\d]+) ans est aussi exonérée de prélèvements sociaux',
 }),
 'rent': ('F1991', 'Impôt sur le revenu - Revenus locatifs (location non meublée)', {
  'rentCeiling': r'Si vos revenus ne dépassent pas ([\d ]+) €, vous serez automatiquement soumis au régime micro-foncier',
  'rentAllowance': r'Vous avez droit à un abattement forfaitaire de ([\d,]+) %',
  'rentSocial': r"C'est aussi le cas pour les prélèvements sociaux \(au taux de ([\d,]+) %\)",
 }),
 'lmnp': ('F32744', "Impôt sur le revenu - Revenus d'une location meublée", {}),
}

def extra_values(name, root, today, text, unique):
 parents = {c:p for p in root.iter() for c in p}
 def headings(node):
  labels=[]
  while node in parents:
   node=parents[node];title=node.find('Titre')
   if title is not None: labels.append(text(title))
  return labels
 def scoped_paragraphs(*labels):
  return [(p,text(p),headings(p)) for p in root.iter('Paragraphe')
          if all(label in headings(p) for label in labels)]
 year=int(today[:4])
 if name=='per':
  candidates=[]
  for _,s,_ in scoped_paragraphs('PER individuel','Vous êtes salarié','Avantage fiscal sur les versements volontaires'):
   m=re.search(r'plafond de déduction des cotisations retraite est égal à ([\d,]+) % .*?de (20\d{2}) \(avec un maximum de ([\d ]+) €\), ou à ([\d ]+) €',s)
   if m and int(m[2])+1<=year: candidates.append((int(m[2]),m))
  if not candidates: raise ValueError('Plafond PER salarié et année absents')
  latest=max(y for y,_ in candidates);matches=[m for y,m in candidates if y==latest]
  if len(matches)!=1: raise ValueError('Plafond PER salarié ambigu')
  m=matches[0]
  values={'perDeductionRate':float(m[1].replace(',','.')),'perRevenueYear':latest,
          'perDeductionYear':latest+1,'perMaximum':float(m[3].replace(' ','')),
          'perMinimum':float(m[4].replace(' ',''))}
  # Only voluntary deducted contributions, capital, individual PER. Never rents,
  # death benefits or employer contributions; future legal periods are excluded.
  candidates=[]
  for _,s,labels in scoped_paragraphs('PER individuel','Vous avez déduit les versements PER de votre revenu imposable','Sortie en capital'):
   m=re.search(r'Pour les intérêts perçus à compter du 1er janvier (20\d{2}), le taux global .*?est de ([\d,]+) %, correspondant à ([\d,]+) % .*?et ([\d,]+) %',s)
   if m and f'À partir de {m[1]}' in labels and int(m[1])<=year: candidates.append(m)
  if not candidates: raise ValueError('PFU PER capital et période absents')
  latest=max(int(m[1]) for m in candidates);selected=[m for m in candidates if int(m[1])==latest]
  if len(selected)!=1: raise ValueError('PFU PER capital ambigu')
  m=selected[0];values.update(perTaxYear=latest,perTotal=float(m[2].replace(',','.')),
    perIncome=float(m[3].replace(',','.')),perSocial=float(m[4].replace(',','.')))
  if abs(values['perTotal']-values['perIncome']-values['perSocial'])>.001: raise ValueError('Somme PFU PER incohérente')
  return values
 if name=='lmnp':
  candidates=[]
  for _,s,labels in scoped_paragraphs('Location meublée de longue durée','Régime micro-BIC'):
   years=[int(m[1]) for label in labels if (m:=re.fullmatch(r'Revenus (20\d{2})',label))]
   if len(years)==1 and years[0]<=year: candidates.append((years[0],s))
  if not candidates: raise ValueError('Micro-BIC longue durée et période absents')
  latest=max(y for y,_ in candidates);s='\n'.join(s for y,s in candidates if y==latest)
  return {'lmnpRevenueYear':latest,
   'lmnpCeiling':unique(r'Si vos recettes annuelles ne dépassent pas ([\d ]+) €',s),
   'lmnpAllowance':unique(r'abattement forfaitaire pour frais de ([\d,]+) %',s)}
 return {}
