"""Règles de rattachement indicatif aux parcours MSI, pas d'éligibilité automatique."""
FAMILY_PATHWAYS = {
    "Business Analyst": ["CMSI", "ID"],
    "Consultant ERP / solutions métier": ["CMSI"],
    "Conseil & transformation SI": ["CMSI", "ARAMIS"],
    "Product Owner": ["CMSI"],
    "Scrum Master": ["CMSI"],
    "Chef de projet SI": ["CMSI"],
    "Consultant cybersécurité": ["CMSI"],
    "Auditeur SI": ["CMSI", "ARAMIS"],
    "Consultant BI / décisionnel": ["ID"],
    "Data Analyst": ["ID"],
    "Responsable Analytics": ["ID"],
    "Gouvernance et qualité des données": ["ID"],
    "Webanalytics": ["ID"],
    "Data Scientist": ["ID"],
    "Data Engineer / Architecture": ["ID"],
    "Autres métiers data": ["ID"],
    "Doctorat en SI": ["ARAMIS"],
    "Enseignement-recherche en SI": ["ARAMIS"],
}


def pathways(family):
    return FAMILY_PATHWAYS.get(family, [])
