"""Classification indicative des intitulés et pays explicitement fournis.

Aucune règle ne conclut à l'éligibilité d'un étudiant ou à une équivalence
internationale de diplôme/contrat. Les catégories sans annonce restent visibles.
"""
import re
import unicodedata

DOMAINS = ["it", "finance", "sales", "hr", "law", "marketing", "management",
           "engineering", "health", "arts", "education", "environment", "other"]
COUNTRIES = {
    "france": ("FR", "France"), "allemagne": ("DE", "Allemagne"),
    "arabie saoudite": ("SA", "Arabie saoudite"), "australie": ("AU", "Australie"),
    "bresil": ("BR", "Brésil"), "chine": ("CN", "Chine"),
    "hong kong": ("HK", "Hong Kong"), "inde": ("IN", "Inde"),
    "italie": ("IT", "Italie"), "luxembourg": ("LU", "Luxembourg"),
    "monaco": ("MC", "Monaco"), "poland": ("PL", "Pologne"),
    "pologne": ("PL", "Pologne"), "royaume-uni": ("GB", "Royaume-Uni"),
    "singapour": ("SG", "Singapour"), "suisse": ("CH", "Suisse"),
    "suede": ("SE", "Suède"), "taiwan": ("TW", "Taïwan"),
    "emirats arabes unis": ("AE", "Émirats arabes unis"),
    "etats-unis": ("US", "États-Unis"),
}


def normalized(text):
    return "".join(c for c in unicodedata.normalize("NFKD", str(text or "").lower())
                   if not unicodedata.combining(c))


def country_fields(row):
    raw = row.get("country") or ""
    value = row.get("state") if normalized(raw) == "international" else raw
    code, label = COUNTRIES.get(normalized(value), (None, value or None))
    return {"country_code": code, "country": label,
            "country_evidence": {"country": raw, "state": row.get("state")}}


def domain_for(title):
    """Première règle correspondante, sur l'intitulé seulement."""
    text = normalized(title)
    rules = [
        ("health", r"medecin|infirmier|nurse|medical|travailleur social"),
        ("education", r"enseignant|professeur|chercheur|research scientist|formateur|pedagog"),
        ("environment", r"environnement|biodivers|ecolog|agronom|agricult|sustainab|\besg\b"),
        ("hr", r"ressources humaines|human resources|\brh\b|recrut|talent|payroll|paie|hris"),
        ("marketing", r"marketing|communication|brand|publicite|social media"),
        ("law", r"juridi|juriste|legal|counsel|compliance|conformite|audit|risque|\brisk\b"),
        ("it", r"informat|\bit\b|\bsi\b|data|donnee|developp|developer|software|cyber|digital|numerique|technolog|\bsap\b|\berp\b|cloud|devops|testeur|tester|application consultant|product owner|scrum"),
        ("arts", r"graphiste|graphic design|designer|culturel|artist"),
        ("engineering", r"ingenieur|engineer|industri|logisti|supply chain|maintenance|immobilier|real estate|achats|acheteur|procurement"),
        ("sales", r"conseiller|conseillere|commercial|client|customer|sales|coverage|retail|account manager|centre.*affaires|charge.*affaires|doradca|doradczyni"),
        ("finance", r"financ|comptab|account|credit|leasing|banqu|bank|trader|trading|invest|asset|assuran|treasur|tresor|actuari|controller|controle.*gestion|cash|gestionnaire|analyst|strategist|back.office|middle.office|mo deal"),
        ("management", r"consult|projet|project|organisation|transformation|business|strategy|strategie|directeur|directrice|director|assistant|administrat|manager"),
    ]
    for domain, expression in rules:
        if re.search(expression, text):
            return domain
    return "other"
