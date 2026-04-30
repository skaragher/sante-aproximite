param(
  [string]$OutputPath = "docs/Dossier_Commercial_Sante_Aproximite.docx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Escape-Xml {
  param([string]$Value)

  if ($null -eq $Value) { return "" }

  return $Value.
    Replace("&", "&amp;").
    Replace("<", "&lt;").
    Replace(">", "&gt;").
    Replace('"', "&quot;").
    Replace("'", "&apos;")
}

function New-ParagraphXml {
  param(
    [string]$Text,
    [string]$Style = "Body",
    [switch]$Bold,
    [switch]$Italic,
    [switch]$PageBreakBefore
  )

  $xmlText = Escape-Xml $Text
  $runProps = ""
  if ($Bold) { $runProps += "<w:b/>" }
  if ($Italic) { $runProps += "<w:i/>" }

  $pageBreakXml = ""
  if ($PageBreakBefore) {
    $pageBreakXml = "<w:r><w:br w:type='page'/></w:r>"
  }

  return @"
<w:p>
  <w:pPr>
    <w:pStyle w:val='$Style'/>
  </w:pPr>
  $pageBreakXml
  <w:r>
    <w:rPr>$runProps</w:rPr>
    <w:t xml:space='preserve'>$xmlText</w:t>
  </w:r>
</w:p>
"@
}

function New-SpacerXml {
  return @"
<w:p>
  <w:pPr>
    <w:spacing w:after='120'/>
  </w:pPr>
</w:p>
"@
}

$paragraphs = New-Object System.Collections.Generic.List[string]

$null = $paragraphs.Add((New-ParagraphXml -Text "SANTE APROXIMITE" -Style "Title"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Dossier commercial et publicitaire" -Style "Subtitle"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Document de presentation destine aux autorites publiques, partenaires financiers et bailleurs." -Style "Subtitle"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Version editable Word - Avril 2026" -Style "Subtitle"))
$null = $paragraphs.Add((New-SpacerXml))
$null = $paragraphs.Add((New-ParagraphXml -Text "Acces aux soins, coordination d'urgence et pilotage territorial dans une seule plateforme." -Style "Quote" -Italic))
$null = $paragraphs.Add((New-SpacerXml))
$null = $paragraphs.Add((New-ParagraphXml -Text "Resume executif" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Sante Aproximite est une solution numerique complete qui relie les citoyens, les centres de sante, les services d'urgence et les autorites de regulation autour d'un meme systeme d'information. L'application combine une experience mobile pour les usagers et les equipes terrain avec un back-office web de pilotage pour les institutions." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "La plateforme permet de geolocaliser les centres de sante, afficher les services disponibles, orienter les usagers vers le point de prise en charge le plus proche, remonter des plaintes, suivre la satisfaction, et transmettre des alertes d'urgence ou de securite avec la position GPS." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Pour les pouvoirs publics et les financeurs, Sante Aproximite apporte un double impact: un meilleur service rendu a la population et des donnees de terrain exploitables pour la decision, la planification et l'evaluation des politiques publiques." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Le defi a resoudre" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Dans de nombreux territoires, l'information sanitaire reste dispersee: les citoyens connaissent mal l'offre de soins disponible, les etablissements sont inegalement visibles, les services d'urgence manquent parfois de donnees fiables au moment critique, et les autorites disposent de peu d'indicateurs consolides sur la qualite de service et la couverture territoriale." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Cette fragmentation entraine des pertes de temps, des erreurs d'orientation, une saturation de certains centres, une faible tracabilite des plaintes et une difficulte a prioriser les investissements publics ou prives." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Notre reponse" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Sante Aproximite propose une infrastructure numerique simple, concrete et operationnelle pour connecter l'offre de soins, les besoins des usagers et le pilotage institutionnel." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "La solution s'appuie sur trois briques complementaires:" -Style "Body" -Bold))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Une application mobile pour les citoyens et les operateurs terrain." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Une plateforme web d'administration, de regulation et de supervision." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Une API centralisee avec gestion des roles, des territoires, des centres, des alertes et des indicateurs." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Fonctionnalites strategiques deja structurees dans l'application" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "1. Cartographie et orientation vers les soins" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Recherche des centres de sante les plus proches selon la position GPS de l'usager." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Affichage du plateau technique, des services disponibles, du niveau et du type d'etablissement." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Navigation directe vers le centre selectionne." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Consultation des bases d'urgence a proximite." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "2. Gestion des urgences et coordination de terrain" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Transmission d'alertes vers le SAMU, les sapeurs-pompiers, la police, la gendarmerie ou la protection civile." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Envoi de la position GPS, du telephone, du point de prise en charge, de la description et, si besoin, de photos." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Suivi du statut de l'alerte: nouvelle, prise en charge, equipe en route, equipe sur site, intervention terminee." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Tableaux de bord de supervision pour les acteurs operationnels." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "3. Gouvernance, regulation et qualite de service" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Gestion des utilisateurs par role: national, region, district, etablissement, urgences et securite." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Validation des comptes et des centres avant activation." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Administration du referentiel territorial: regions et districts." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Gestion et traitement des plaintes usagers avec commentaires, statuts et historique." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Evaluation de la satisfaction et notation des centres." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Syntheses statistiques sur les plaintes, la satisfaction et la couverture des evaluations." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "4. Industrialisation et passage a l'echelle" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Importation de centres, regions et districts depuis des fichiers Excel ou CSV." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Structuration des donnees avec codes d'etablissement, rattachements territoriaux et statuts de validation." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Architecture monorepo avec application mobile, application web et backend API." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Pourquoi les autorites publiques ont interet a soutenir Sante Aproximite" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Renforcer l'equite d'acces aux soins par une meilleure orientation des populations." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Disposer d'une cartographie dynamique et exploitable des structures sanitaires." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Accroitre la reactivite face aux urgences sanitaires et evenements critiques." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Instaurer une boucle de redevabilite grace aux plaintes, aux justifications et aux evaluations." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Mieux cibler les decisions d'investissement public selon les territoires sous-servis ou mal evalues." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Moderniser la relation entre l'Etat, les etablissements et les usagers avec un outil visible, utile et mesurable." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Pourquoi les partenaires financiers et bailleurs ont interet a accompagner le projet" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Sante Aproximite n'est pas seulement une application. C'est un levier de transformation mesurable, facilement presentable dans un programme de financement oriente sante publique, services essentiels, inclusion numerique, resilience territoriale ou gouvernance." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Le projet offre aux bailleurs une opportunite d'investir dans une solution a impact direct, visible et pilotable autour de cinq axes:" -Style "Body" -Bold))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Impact social: reduction des obstacles d'acces a l'information sanitaire et meilleure orientation des patients." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Impact institutionnel: renforcement des capacites de regulation, de supervision et de coordination." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Impact territorial: meilleure couverture des zones prioritaires grace a des donnees geolocalisees." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Impact reputatif: un projet concret, visible sur le terrain, facilement valorisable dans les rapports d'impact." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Impact economique: meilleure allocation des ressources, reduction des pertes de temps et meilleure priorisation des investissements." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Elements differenciants" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Une approche unifiee qui relie sante de proximite, urgence, securite et gouvernance." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Une logique multi-acteurs: usagers, chefs d'etablissement, regulateurs, services d'urgence et services de securite." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Une lecture territoriale native avec regions, districts, centres et bases d'urgence." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Une capacite de passage a l'echelle grace aux imports en masse et aux workflows d'approbation." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Un potentiel fort de reporting, de suivi d'indicateurs et de redevabilite publique." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Proposition de valeur par cible" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Pour les ministeres et agences publiques" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Un outil de modernisation de l'offre de service public, d'orientation des citoyens et de supervision territoriale." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Pour les collectivites et structures decentralisees" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Une solution concrete pour visualiser les besoins, suivre les centres, documenter la qualite de service et repondre plus vite aux situations critiques." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Pour les partenaires financiers" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Un projet numerique avec impact mesurable, portefeuille d'indicateurs clair et forte possibilite de replication par territoire." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Pour les bailleurs et fondations" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Une intervention a forte utilite sociale, orientee acces, urgence, redevabilite et amelioration continue des services publics." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Indicateurs d'impact a mettre en avant" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Nombre de centres references, geolocalises et valides." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Nombre d'usagers actifs et de recherches de centres effectuees." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Nombre d'alertes d'urgence et de securite transmises et traitees." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Delai moyen de prise en charge d'une alerte." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Volume de plaintes traitees et taux de resolution." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Note moyenne et taux de satisfaction des centres." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Couverture territoriale du dispositif par region et district." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Modeles de partenariat proposes" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "1. Pilotage institutionnel" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Accompagnement d'un pilote sur une region, un district sanitaire ou une zone urbaine prioritaire, avec mesure des resultats sur une periode de 3 a 6 mois." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "2. Financement de passage a l'echelle" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Extension progressive de la plateforme a plusieurs territoires avec renforcement de l'hebergement, de l'assistance, de la formation et de la collecte de donnees." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "3. Appui en equipements et connectivite" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Mise a disposition de smartphones, tablettes, forfaits data, stations de supervision ou appuis logistiques pour les equipes terrain et les centres pilotes." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "4. Partenariat technique et data" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Co-construction de tableaux de bord, indicateurs d'impact, mecanismes d'interoperabilite et outils de decision pour les institutions." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Message publicitaire institutionnel" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Sante Aproximite rapproche les populations des soins, donne aux decideurs une vision claire du territoire et aide les services d'urgence a intervenir plus vite. C'est une solution utile, visible et finançable pour moderniser l'acces aux soins et renforcer la confiance entre citoyens, etablissements et institutions." -Style "Quote" -Italic))
$null = $paragraphs.Add((New-ParagraphXml -Text "Formulation courte pour brochure ou presentation" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Une plateforme numerique qui localise l'offre de soins, facilite l'orientation des usagers, remonte les alertes en temps reel et fournit aux autorites des tableaux de bord pour agir mieux et plus vite." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Formulation courte pour financeurs" -Style "Heading2"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Investir dans Sante Aproximite, c'est financer une infrastructure de sante digitale a impact direct, avec des retombees concretes sur l'acces, l'urgence, la satisfaction usager et la gouvernance territoriale." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Prochaines etapes recommandees" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Lancer une demonstration institutionnelle guidee." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Selectionner un territoire pilote et definir les indicateurs de succes." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Structurer un plan de financement en trois volets: technologie, deploiement, accompagnement." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "• Preparer une convention de partenariat avec calendrier, livrables et reporting d'impact." -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Contacts a personnaliser" -Style "Heading1"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Promoteur du projet: [A completer]" -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Organisation: [A completer]" -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Telephone: [A completer]" -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Email: [A completer]" -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Ville / Pays: [A completer]" -Style "Body"))
$null = $paragraphs.Add((New-ParagraphXml -Text "Annexe - Base factuelle issue de l'application" -Style "Heading1" -PageBreakBefore))
$null = $paragraphs.Add((New-ParagraphXml -Text "Le present dossier s'appuie sur les modules effectivement structures dans le projet: application mobile, application web Vue.js, API Node.js / Express, gestion des centres de sante, recherche geolocalisee, alertes d'urgence, alertes de securite, plaintes usagers, evaluations de satisfaction, administration territoriale, validation des comptes et imports Excel/CSV." -Style "Body"))

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
            xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
            xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
            mc:Ignorable="w14 wp14">
  <w:body>
    $($paragraphs -join "`n")
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

$stylesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Aptos" w:cs="Aptos"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="fr-FR"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="0F4C81"/>
      <w:sz w:val="34"/>
      <w:szCs w:val="34"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:color w:val="4A5568"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="220" w:after="100"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="0F4C81"/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="160" w:after="60"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="1F2937"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Body">
    <w:name w:val="Body"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="80"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Quote">
    <w:name w:val="Quote"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="80" w:after="80"/>
      <w:ind w:left="720" right="240"/>
      <w:jc w:val="both"/>
    </w:pPr>
    <w:rPr>
      <w:color w:val="334155"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>
"@

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"@

$rootRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$docRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@

$now = [DateTime]::UtcNow.ToString("s") + "Z"

$coreXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Sante Aproximite - Dossier commercial et publicitaire</dc:title>
  <dc:subject>Presentation commerciale et institutionnelle</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:keywords>sante, urgence, geolocalisation, plaidoyer, bailleurs, partenaires</cp:keywords>
  <dc:description>Dossier Word de presentation de l'application Sante Aproximite.</dc:description>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$now</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$now</dcterms:modified>
</cp:coreProperties>
"@

$appXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
            xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Title</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>Sante Aproximite</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>
"@

$resolvedOutput = Join-Path (Get-Location) $OutputPath
$outputDir = Split-Path -Parent $resolvedOutput
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$stagingRoot = Join-Path (Get-Location) "docs\\.docx-staging"
if (Test-Path $stagingRoot) {
  Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingRoot | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stagingRoot "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stagingRoot "docProps") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stagingRoot "word") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stagingRoot "word\\_rels") | Out-Null

Set-Content -LiteralPath (Join-Path $stagingRoot "[Content_Types].xml") -Value $contentTypesXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $stagingRoot "_rels\\.rels") -Value $rootRelsXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $stagingRoot "docProps\\core.xml") -Value $coreXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $stagingRoot "docProps\\app.xml") -Value $appXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $stagingRoot "word\\document.xml") -Value $documentXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $stagingRoot "word\\styles.xml") -Value $stylesXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $stagingRoot "word\\_rels\\document.xml.rels") -Value $docRelsXml -Encoding UTF8

$zipPath = [System.IO.Path]::ChangeExtension($resolvedOutput, ".zip")
if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}
if (Test-Path $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Force
}

Push-Location $stagingRoot
try {
  Compress-Archive -Path * -DestinationPath $zipPath -Force
}
finally {
  Pop-Location
}

Move-Item -LiteralPath $zipPath -Destination $resolvedOutput -Force
Write-Output "Document cree: $resolvedOutput"
