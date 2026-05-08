/**
 * Curriculum context per country and grade band.
 * Used to ground AI-generated exercises in the actual national curriculum
 * terminology, topics, and standards for each country.
 */

export type GradeBand =
  | "lower_elementary" // Grade 1–2, ages 5–7
  | "mid_elementary" // Grade 3–4, ages 8–10
  | "upper_elementary" // Grade 5–6, ages 10–12
  | "lower_secondary"; // Grade 7–8, ages 12–14

// French Éducation Nationale grade labels are non-numeric, so map them
// explicitly to age-equivalent bands. Other countries' labels embed a
// digit ("Grade 4", "Year 4", "Klasse 4") and can be band-mapped numerically.
const FRENCH_GRADE_BAND: Record<string, GradeBand> = {
  "CP": "lower_elementary",        // age 6-7  (~ Grade 1)
  "CE1": "lower_elementary",       // age 7-8  (~ Grade 2)
  "CE2": "mid_elementary",         // age 8-9  (~ Grade 3)
  "CM1": "mid_elementary",         // age 9-10 (~ Grade 4)
  "CM2": "upper_elementary",       // age 10-11 (~ Grade 5)
  "6ème": "upper_elementary",      // age 11-12 (~ Grade 6, start of collège)
  "6e": "upper_elementary",
  "5ème": "lower_secondary",        // age 12-13 (~ Grade 7)
  "5e": "lower_secondary",
  "4ème": "lower_secondary",        // age 13-14 (~ Grade 8)
  "4e": "lower_secondary",
};

export function getGradeBand(grade: string): GradeBand {
  if (grade in FRENCH_GRADE_BAND) return FRENCH_GRADE_BAND[grade];
  const num = parseInt(grade.replace(/\D/g, ""), 10);
  if (Number.isNaN(num)) return "upper_elementary"; // safe middle fallback
  if (num <= 2) return "lower_elementary";
  if (num <= 4) return "mid_elementary";
  if (num <= 6) return "upper_elementary";
  return "lower_secondary";
}

export interface CurriculumContext {
  systemName: string;
  gradeBandLabel: string;
  context: string;
}

type CountryCurriculum = Record<GradeBand, CurriculumContext>;

const CURRICULA: Record<string, CountryCurriculum> = {
  // ── United Kingdom (England) — National Curriculum ─────────────────────────
  GB: {
    lower_elementary: {
      systemName: "England National Curriculum",
      gradeBandLabel: "Key Stage 1 (Years 1–2)",
      context:
        "Maths: number bonds to 20, counting in 2s/5s/10s, place value to 100, addition and subtraction, halves and quarters, measuring in cm and m, naming 2D and 3D shapes. " +
        "English: phonics (Letters and Sounds Phase 3–5 / Read Write Inc), decoding CVC words, simple sentences, capital letters, full stops, nouns, verbs, adjectives. " +
        "Science: everyday materials (wood, plastic, metal, glass), plants and animals and their habitats, seasonal changes, senses. " +
        "Use British English spelling conventions (colour, maths, recognise) and Ofsted/DfE terminology.",
    },
    mid_elementary: {
      systemName: "England National Curriculum",
      gradeBandLabel: "Key Stage 2 Lower (Years 3–4)",
      context:
        "Maths: multiplication tables up to 12×12, column addition and subtraction, equivalent fractions, Roman numerals to C, perimeter and area, coordinates in first quadrant, bar charts and pictograms. " +
        "English: fronted adverbials, inverted commas for speech, paragraphs, prefixes and suffixes, reading inference and deduction, persuasive and narrative writing. " +
        "Science: rocks and soils, light and shadows, forces and magnets, plant parts and functions, nutrition and digestion basics, food chains, habitats. " +
        "Use British English spelling and SATs-style question phrasing (e.g. 'Tick the correct answer').",
    },
    upper_elementary: {
      systemName: "England National Curriculum",
      gradeBandLabel: "Key Stage 2 Upper (Years 5–6)",
      context:
        "Maths: long multiplication and division, ratio and proportion, simple algebra (find the value of), fractions/decimals/percentages, negative numbers, angle properties, mean and median, line graphs. " +
        "English: modal verbs, subjunctive mood, passive voice, formal essay writing, literary devices (metaphor, simile, personification), KS2 SATs comprehension style. " +
        "Science: living things and life cycles, evolution and adaptation, properties and changes of materials, Earth and space, gravity and air resistance, electrical circuits (symbols, series/parallel). " +
        "Use British English; refer to the Arithmetic and Reasoning papers style for maths.",
    },
    lower_secondary: {
      systemName: "England National Curriculum",
      gradeBandLabel: "Key Stage 3 (Years 7–8)",
      context:
        "Maths: expanding brackets, solving linear equations, Pythagoras' theorem, probability (theoretical and experimental), transformations (reflection, rotation, translation, enlargement), standard form, indices and prime factorisation. " +
        "English: analytical essays with embedded quotations, Shakespeare plays, Victorian and contemporary literature, language analysis using PEE (Point, Evidence, Explain) structure. " +
        "Science — Biology: cells (plant vs animal), organisation, digestion, reproduction. Chemistry: particle model, elements/compounds/mixtures, word and symbol equations. Physics: forces (speed, velocity, acceleration), electricity (V = I × R, series/parallel), waves. " +
        "Use GCSE-preparatory phrasing and mark-scheme language.",
    },
  },

  // ── United States — Common Core + NGSS ────────────────────────────────────
  US: {
    lower_elementary: {
      systemName: "US Common Core / NGSS",
      gradeBandLabel: "Grades 1–2",
      context:
        "Math (CCSS): Operations and Algebraic Thinking — addition and subtraction within 20, fact families; Number and Operations in Base Ten — tens and ones, skip-counting; Measurement and Data — measuring length in inches and centimeters, reading picture graphs. " +
        "ELA (CCSS): phonics and word recognition, RL/RI standards for reading literature and informational text, writing opinion and narrative pieces, grammar (nouns, verbs, adjectives, proper nouns, punctuation). " +
        "Science (NGSS K–2): physical science (pushes and pulls, light and sound), life science (plant/animal needs, habitats), Earth science (weather patterns, landforms). " +
        "Use American English spelling (math, color, recognize) and Common Core standard codes where appropriate.",
    },
    mid_elementary: {
      systemName: "US Common Core / NGSS",
      gradeBandLabel: "Grades 3–4",
      context:
        "Math (CCSS): multiplication and division (×/÷ within 100), fractions on a number line, equivalent fractions, multi-digit addition/subtraction, area and perimeter, telling time, line plots. " +
        "ELA (CCSS): RI/RL standards — main idea, key details, text evidence, compare and contrast, point of view; writing informative and opinion essays with supporting details; language — conjunctions, prepositions, relative pronouns, figurative language. " +
        "Science (NGSS 3–5): ecosystems and food webs, adaptations, weather and climate, matter (solids/liquids/gases, properties), forces and motion (balanced/unbalanced). " +
        "Reference Common Core standards (e.g. 3.OA, 4.NF) and use American English.",
    },
    upper_elementary: {
      systemName: "US Common Core / NGSS",
      gradeBandLabel: "Grades 5–6",
      context:
        "Math (CCSS): multi-digit multiplication/division, fractions (add, subtract, multiply, divide), decimals, ratios and rates (Grade 6), variables and expressions, coordinate plane, volume of rectangular prisms, statistics (mean, median, mode, range). " +
        "ELA (CCSS): citing textual evidence (RI.5/6.1), author's purpose and point of view, structural analysis of arguments, narrative with dialogue and description, research writing, grammar — perfect tenses, punctuation in complex sentences. " +
        "Science (NGSS 3–5 / MS): matter and its interactions, energy (potential/kinetic), ecosystems, Earth's systems (rock cycle, water cycle), space systems. " +
        "Use Common Core and NGSS framing; reference disciplinary core ideas (DCIs).",
    },
    lower_secondary: {
      systemName: "US Common Core / NGSS Middle School",
      gradeBandLabel: "Grades 7–8",
      context:
        "Math (CCSS 7–8): ratios and proportional relationships, rational numbers, linear equations and inequalities, functions (slope-intercept form), the Pythagorean theorem, transformations (congruence and similarity), probability (simple and compound), statistics (bivariate data, scatter plots). " +
        "ELA (CCSS 7–8): argument writing with evidence and counterargument (W.7-8.1), analysis of literary and informational texts (RL/RI.7-8), academic vocabulary, grammar — subjunctive, active/passive voice. " +
        "Science (NGSS MS): life science — cells, genetics, evolution, ecosystems; physical science — matter (periodic table, chemical reactions), energy, forces and Newton's laws, waves; Earth science — climate change, plate tectonics. " +
        "Use NGSS science and engineering practices (SEPs) framing.",
    },
  },

  // ── Australia — Australian Curriculum (ACARA) ──────────────────────────────
  AU: {
    lower_elementary: {
      systemName: "Australian Curriculum (ACARA)",
      gradeBandLabel: "Foundation–Year 2",
      context:
        "Mathematics: number and place value (counting, grouping in tens), simple addition and subtraction, halves and quarters, measurement (centimetres, metres, kilograms), 2D shapes and 3D objects, data (simple tables). " +
        "English: phonics and word knowledge, reading and viewing, oral language, simple narrative and informative texts, punctuation (capital letters, full stops, question marks). " +
        "Science: living things and their environments, physical sciences (sound, light, push/pull), Earth and space (daily and seasonal changes). " +
        "Use Australian English spelling (colour, programme, recognise) and ACARA strand/sub-strand terminology (Number and Algebra, Measurement and Geometry, Statistics and Probability).",
    },
    mid_elementary: {
      systemName: "Australian Curriculum (ACARA)",
      gradeBandLabel: "Years 3–4",
      context:
        "Mathematics: multiplication and division facts, fractions and decimals, area and perimeter, angles, time (12 and 24 hour), interpreting data displays (bar graphs, dot plots). " +
        "English: language features of narratives and information reports, text connectives, noun groups, figurative language, comprehension strategies (predicting, inferring, summarising). " +
        "Science: ecosystems, food chains, rocks and soils, light (reflection), electrical circuits, simple machines. HASS: Australian history and geography (First Nations peoples, local government, mapping). " +
        "Reference ACARA year-level achievement standards.",
    },
    upper_elementary: {
      systemName: "Australian Curriculum (ACARA)",
      gradeBandLabel: "Years 5–6",
      context:
        "Mathematics: equivalent fractions, decimals and percentages, prime and composite numbers, algebra (order of operations, variables), transformations, volume of prisms, mean and median, probability. " +
        "English: persuasive texts (arguments, expositions), literary analysis, grammar — clauses, complex sentences, modal verbs, cohesive devices; NAPLAN-style language conventions. " +
        "Science: body systems, adaptation and ecosystems, properties of matter, electricity (circuits, conductors/insulators), Earth and space (solar system, moon phases). HASS: Ancient history (civilisations), Australia's role in the world, economics and business basics. " +
        "Align with Australian Curriculum Version 9.0 descriptors.",
    },
    lower_secondary: {
      systemName: "Australian Curriculum (ACARA)",
      gradeBandLabel: "Years 7–8",
      context:
        "Mathematics: integers, fractions, decimals and percentages (Year 7); linear relationships, Pythagoras (Year 8); probability and statistics (Year 7–8); financial mathematics (profit/loss, simple interest). " +
        "English: analytical and persuasive writing (argument, review), close reading of literary texts, language for interaction, vocabulary in context, grammar — complex sentences, nominalisation. " +
        "Science — Biology: cells, classification, body systems; Chemistry: matter (atomic theory, elements, compounds, mixtures, chemical vs physical change); Physics: energy transformations, forces, simple machines; Earth Science: plate tectonics, rock cycle. HASS: Medieval history, Australia and the Asia-Pacific, civics and citizenship. " +
        "Reference Australian Curriculum Achievement Standards Years 7–8.",
    },
  },

  // ── Canada — Provincial Curricula ─────────────────────────────────────────
  // (Ontario most widely used; broadly similar across provinces)
  CA: {
    lower_elementary: {
      systemName: "Canadian Provincial Curriculum (Ontario)",
      gradeBandLabel: "Grades 1–2",
      context:
        "Mathematics (Ontario 2020): number (counting to 200, addition/subtraction within 50, equal groups), spatial sense (2D shapes, measurement in non-standard and standard units), data literacy (sorting, graphing), financial literacy (coins). " +
        "Language: oral communication, reading (decoding, comprehension, phonics), writing (simple recounts, stories, labels), grammar (capital letters, periods, question marks). " +
        "Science and Technology: life systems (needs of living things), matter and materials (properties, sorting), energy and control (push/pull forces), Earth and space (daily weather). " +
        "Use Canadian English spelling (colour, recognise) and Ontario curriculum expectations (Overall and Specific Expectations).",
    },
    mid_elementary: {
      systemName: "Canadian Provincial Curriculum (Ontario)",
      gradeBandLabel: "Grades 3–4",
      context:
        "Mathematics: multiplication and division (3s, 4s, 6s, 7s, 8s, 9s), fractions (equivalent fractions, comparing), measurement (perimeter, area, time in minutes), patterning and algebra (growing patterns, variables), data management (bar graphs, pictographs, mean). " +
        "Language: reading strategies (making connections, inferring, synthesising), writing forms (report, letter, recount), media literacy, grammar — compound/complex sentences, conjunctions, verb tenses. " +
        "Science and Technology: habitats and communities, light and sound, pulleys and gears, rocks and minerals, weather systems. Social Studies: Canadian communities, mapping, early civilisations. " +
        "Reference Ontario curriculum strands and French Immersion where language context suggests.",
    },
    upper_elementary: {
      systemName: "Canadian Provincial Curriculum (Ontario)",
      gradeBandLabel: "Grades 5–6",
      context:
        "Mathematics: fractions, decimals, percentages and ratios; algebra (solving equations, pattern rules); geometry (angle measurement, transformations, coordinate grid); measurement (area, volume, surface area); probability; financial literacy. " +
        "Language: literary and informational text analysis, opinion and persuasive writing, media and digital literacy, grammar — clauses, active/passive voice, figurative language, EQAO-style reading comprehension. " +
        "Science and Technology: human organ systems, biodiversity, electricity (circuits), flight and space. Social Studies: First Nations and European contact, government in Canada, global issues, geographic thinking (GIS, land use). " +
        "Align with Ontario curriculum and Education Quality and Accountability Office (EQAO) assessment style.",
    },
    lower_secondary: {
      systemName: "Canadian Provincial Curriculum (Ontario)",
      gradeBandLabel: "Grades 7–8",
      context:
        "Mathematics: integers (operations), rational numbers, linear relations (slope, y-intercept), Pythagorean theorem, surface area and volume, probability (theoretical vs experimental), data analysis (scatter plots, mean/median/mode). " +
        "Language: essay writing (five-paragraph, literary analysis), research and citation (MLA), reading complex fiction and non-fiction, grammar — semicolons, colons, sentence variety, figurative language analysis. " +
        "Science — Biology: cells (Grade 8), reproduction; Chemistry: pure substances vs mixtures, matter (Grade 7 heat, Grade 8 water systems); Physics: optics (Grade 8), structures and mechanisms, space exploration. " +
        "Reference Ontario Science and Technology curriculum expectations.",
    },
  },

  // ── Ireland — Primary Curriculum / Junior Cycle ────────────────────────────
  IE: {
    lower_elementary: {
      systemName: "Irish Primary Curriculum",
      gradeBandLabel: "Junior and Senior Infants / 1st–2nd Class",
      context:
        "Mathematics: number (counting, addition and subtraction within 20, number sentences), shape and space (2D and 3D shapes), measures (non-standard and standard), fractions (halves, quarters), data (block graphs). " +
        "English/Gaeilge: phonics (Jolly Phonics widely used), reading fluency, simple writing (recounts, stories), oral language development; Gaeilge — simple phrases, colours, numbers, family words. " +
        "Science/SESE (Social, Environmental and Scientific Education): living things (plants, animals), materials (natural/man-made), energy and forces (light, sound, push/pull), Earth and environment (weather, seasons). " +
        "Use Irish curriculum terminology (strands and strand units); note that Irish (Gaeilge) may appear alongside English.",
    },
    mid_elementary: {
      systemName: "Irish Primary Curriculum",
      gradeBandLabel: "3rd–4th Class",
      context:
        "Mathematics: multiplication and division (tables to 10), fractions and decimals, long multiplication, measures (area, perimeter, capacity, time), directed numbers, data (bar and line graphs, averages). " +
        "English: comprehension strategies, grammar (nouns, verbs, adjectives, adverbs, prepositions, conjunctions), writing genres (report, narrative, letter), spelling rules. " +
        "SESE — Science: plants, animals (food chains, habitats), materials (properties, heat conductivity), forces (friction, gravity), Earth and space (solar system). History: ancient civilisations (Celts, Romans, Vikings), Irish history. Geography: map skills, European countries and capitals, weather and climate. " +
        "Reference Irish Primary Curriculum strands.",
    },
    upper_elementary: {
      systemName: "Irish Primary Curriculum",
      gradeBandLabel: "5th–6th Class",
      context:
        "Mathematics: operations with large numbers, fractions/decimals/percentages/ratio, algebra (simple equations), 2D and 3D shapes (area, volume), statistics (mean, mode, median, range), probability, financial maths (VAT, profit/loss). " +
        "English: literary analysis (novels, poetry), persuasive writing, grammar — clauses, complex sentences, figurative language; prepare for Junior Certificate-style reading comprehension. " +
        "SESE — Science: living things (reproduction, classification), energy (electricity, magnetism, light, sound), materials (properties, state changes), Earth and space (Earth's structure, renewable energy). History: Modern Ireland, WWII, global history. Geography: physical geography, development studies, mapping. " +
        "Note: Junior Cycle begins at age 12 (1st Year); calibrate difficulty accordingly for 6th class.",
    },
    lower_secondary: {
      systemName: "Irish Junior Cycle",
      gradeBandLabel: "1st–2nd Year (Junior Cycle)",
      context:
        "Mathematics (Project Maths): number (rational/irrational numbers, percentages, scientific notation), algebra (expressions, linear equations), geometry (Theorem of Pythagoras, coordinate geometry), statistics (sampling, histograms, median, interquartile range), probability. " +
        "English: Junior Cycle framework — reading (literary and non-literary texts), oral language, writing (personal essays, analytical responses); Gaeilge — An Ghaeilge as a core subject. " +
        "Science (Junior Cycle): biology — cells, human body systems; chemistry — elements, compounds, mixtures, reactions, periodic table; physics — forces, energy, light, sound, electricity. " +
        "Reference Junior Cycle for Teachers (JCT) learning outcomes and specification language.",
    },
  },

  // ── Germany — Lehrplan (KMK / Bundesländer) ───────────────────────────────
  DE: {
    lower_elementary: {
      systemName: "Deutscher Lehrplan (Grundschule)",
      gradeBandLabel: "Klasse 1–2",
      context:
        "Mathematik: Zahlen und Operationen bis 100 (Addition, Subtraktion, Verdoppeln, Halbieren), Muster und Strukturen, Größen und Messen (cm, m, kg, l, Uhrzeit), Geometrie (ebene Figuren, Körper). " +
        "Deutsch: Schreiben (Druckschrift, Schreibschrift), Lesen (Lesestrategie, Sinnentnahme), Sprachreflexion (Nomen/Großschreibung, Verben, Adjektive, einfache Sätze), Zuhören und Sprechen. " +
        "Sachunterricht: Natur und Leben (Pflanzen, Tiere, Jahreszeiten), Mensch und Gemeinschaft (Familie, Schule, Verkehrssicherheit), Raum und Umwelt (Orientierung, Wetter), Technik (einfache Alltagsgeräte). " +
        "Fachbegriffe auf Deutsch verwenden; Bezug auf KMK-Bildungsstandards für die Grundschule.",
    },
    mid_elementary: {
      systemName: "Deutscher Lehrplan (Grundschule)",
      gradeBandLabel: "Klasse 3–4",
      context:
        "Mathematik: Zahlenraum bis 1.000.000 (Klasse 4), schriftliche Addition/Subtraktion/Multiplikation/Division, Brüche (Hälfte, Viertel, Einheitsbrüche), Flächen- und Rauminhalte, Diagramme (Balken, Linie), Kommaschreibweise. " +
        "Deutsch: Aufsatzformen (Erlebniserzählung, Beschreibung, Brief), Grammatik (Satzglieder: Subjekt/Prädikat/Objekt, Wortarten, Zeitformen: Präteritum/Perfekt), Rechtschreibregeln (Dehnung, Schärfung, Groß- und Kleinschreibung). " +
        "Sachunterricht: Lebewesen (Ökosystem, Nahrungskette), Stoffe und ihre Eigenschaften, Energie (Strom, Wärme), Geschichte (Römer, Mittelalter), Erdkunde (Kontinente, Klimazonen). " +
        "Auf KMK-Bildungsstandards Klasse 4 verweisen (Kompetenzbereich Lesen, Schreiben, Mathematik).",
    },
    upper_elementary: {
      systemName: "Deutscher Lehrplan (Klasse 5–6)",
      gradeBandLabel: "Klasse 5–6 (Gymnasium/Realschule/Hauptschule)",
      context:
        "Mathematik: rationale Zahlen, Brüche (Addition, Subtraktion, Multiplikation, Division), Dezimalzahlen, Prozentrechnung, Proportionalität, Flächen (Viereck, Dreieck, Kreis), Terme und Gleichungen (Klasse 6). " +
        "Deutsch: Textsorten (Inhaltsangabe, Charakterisierung, Erörterung), Grammatik (Konjunktiv I/II, Passiv, Gliedsätze: Relativ-, Kausal-, Temporalsatz), Literaturanalyse (Fabeln, Kurzgeschichten, Gedichte). " +
        "Natur und Technik / Biologie / Physik / Chemie: Zellen und Gewebe, Ökosystem, Stoffe (Gemische/Reinstoffe, Atome/Moleküle), Magnetismus, Elektrizität (Schaltkreise, Ohmsches Gesetz als Einstieg). " +
        "Schulformspezifisch differenzieren (Gymnasium anspruchsvoller); auf Lehrpläne der Bundesländer (Bayern LehrplanPLUS, NRW Kernlehrplan) Bezug nehmen.",
    },
    lower_secondary: {
      systemName: "Deutscher Lehrplan (Klasse 7–8)",
      gradeBandLabel: "Klasse 7–8 (Sekundarstufe I)",
      context:
        "Mathematik: lineare Funktionen und Gleichungssysteme, quadratische Gleichungen (Klasse 8), Statistik (Mittelwert, Median, Modus, Boxplot), Wahrscheinlichkeitsrechnung, Zinsrechnung, Geometrie (Strahlensatz, Pythagoras, Ähnlichkeit). " +
        "Deutsch: Erörterung (dialektisch), Kurzgeschichten- und Romananalyse, Sprachgeschichte, Argumentation (Thema–These–Begründung–Beispiel), Grammatik (Erweiterter Infinitiv, Partizipialkonstruktionen). " +
        "Biologie: Genetik (DNA, Mendel-Gesetze), Evolution (Selektion, Anpassung), Ökologie (Biotop, Biozönose). Chemie: Atombau, Periodensystem, chemische Bindungen, Reaktionsgleichungen. Physik: Kinematik (v = s/t), Dynamik (Newton-Gesetze), Energie (Arbeit, Leistung, Wirkungsgrad), Wellen (Schall, Licht). " +
        "Auf MSA-Anforderungen (Mittlerer Schulabschluss) ausrichten.",
    },
  },

  // ── Austria — Österreichischer Lehrplan ────────────────────────────────────
  AT: {
    lower_elementary: {
      systemName: "Österreichischer Lehrplan (Volksschule)",
      gradeBandLabel: "1.–2. Schulstufe",
      context:
        "Mathematik: Zahlen bis 100, Addition und Subtraktion, einfache Malaufgaben, Messen (Länge, Gewicht, Zeit), geometrische Formen. " +
        "Deutsch: Leseerziehung (Buchstaben, Laute, Silben), Schreiben (Druckschrift, verbundene Schrift), einfache Sätze, Groß- und Kleinschreibung, Nomen und Verben. " +
        "Sachunterricht: Ich und meine Umgebung (Familie, Schule, Jahreszeiten, Tiere und Pflanzen in Österreich, Bundesländer und ihre Hauptstädte als Einstieg). " +
        "Österreichischen Bezug herstellen (z. B. Bundesländer, Alpen, Wiener Schulbuchverlag-Begriffe); österreichische Rechtschreibkonventionen beachten.",
    },
    mid_elementary: {
      systemName: "Österreichischer Lehrplan (Volksschule)",
      gradeBandLabel: "3.–4. Schulstufe",
      context:
        "Mathematik: Zahlenraum bis 1.000.000, schriftliche Grundrechnungsarten, Brüche, Maßeinheiten (m, km, kg, l, €), Zeitrechnung, Geometrie (Fläche, Umfang). " +
        "Deutsch: Aufsatzformen (Erzählung, Beschreibung, Bericht), Wortlehre (Nomen, Verb, Adjektiv, Pronomen, Präposition, Konjunktion), Satzlehre (Subjekt, Prädikat, Objekt), Diktat und Rechtschreibung. " +
        "Sachunterricht: Heimat- und Sachkunde — Österreich (Bundesländer, Geschichte als Einstieg: Kelten, Römer, Babenberger, Habsburg), Natur (Ökosystem Wald, Wasser, Landwirtschaft), Technik (einfache Maschinen, Strom). " +
        "Bezug auf österreichische Lehrpläne und Standardüberprüfungen (BIST) nehmen.",
    },
    upper_elementary: {
      systemName: "Österreichischer Lehrplan (AHS-Unterstufe / Mittelschule)",
      gradeBandLabel: "5.–6. Schulstufe",
      context:
        "Mathematik: Brüche und Dezimalzahlen (Grundrechnungsarten), Prozent- und Zinsrechnung, Terme und einfache Gleichungen, Flächeninhalt und Umfang (Parallelogramm, Dreieck, Kreis), Koordinatensystem. " +
        "Deutsch: Textsorten (Inhaltsangabe, Charakterisierung, Sachtextanalyse), Grammatik (Satzgefüge, Relativsätze, Konjunktiv, Passiv), Stilmittel (Metapher, Vergleich, Personifikation). " +
        "Biologie: Zellen, Organsysteme, Fotosynthese; Geographie und Wirtschaftskunde: Europa (physische und politische Geographie, EU), Wirtschaft als Einstieg. Physik: Kräfte, Druck, Wärme; Chemie: Stoffe (Aggregatzustände, Gemische). " +
        "Bezug auf AHS-Lehrplan Unterstufe und Mittelschule-Lehrplan herstellen.",
    },
    lower_secondary: {
      systemName: "Österreichischer Lehrplan (AHS-Unterstufe / Mittelschule)",
      gradeBandLabel: "7.–8. Schulstufe",
      context:
        "Mathematik: lineare Gleichungen und Funktionen, Dreisatz und Proportionalität, Statistik (Mittelwert, Median, Häufigkeit), Geometrie (Pythagoras, Ähnlichkeit, Trigonometrie als Einstieg). " +
        "Deutsch: Erörterung, literarische Analyse (Kurzgeschichte, Lyrik, Roman), Sprachbetrachtung (Wortarten, Satzglieder, Gliedsätze, direkte/indirekte Rede), Bewerbungsschreiben. " +
        "Biologie: Genetik und Evolution; Geographie: Globalisierung, Klimawandel, Österreich in der Welt; Geschichte: 20. Jahrhundert (Weltkriege, Österreich nach 1945); Physik: Elektrizität (Ohmsches Gesetz), Optik, Mechanik; Chemie: Atommodell, Reaktionsgleichungen, organische Chemie als Einstieg. " +
        "Auf BRP/Reife- und Diplomprüfung als Fernziel und NMS-Bildungsstandards ausrichten.",
    },
  },

  // ── Switzerland — Lehrplan 21 ──────────────────────────────────────────────
  CH: {
    lower_elementary: {
      systemName: "Schweizer Lehrplan 21",
      gradeBandLabel: "Zyklus 1 (1.–2. Klasse)",
      context:
        "Mathematik: Zahlraum bis 100, Addition und Subtraktion, Größen und Maße (cm, m, kg, Rappen/Franken), geometrische Formen, Raum und Form. " +
        "Deutsch: Hören und Sprechen (Standardsprache / Hochdeutsch neben Schweizerdeutsch), Lesen (Buchstaben, Silben, einfache Texte), Schreiben (Buchstaben, einfache Wörter und Sätze). " +
        "Natur, Mensch, Gesellschaft (NMG): Körper und Gesundheit, Lebewesen (Tiere und Pflanzen in der Schweiz und Umgebung), Identität und Gemeinschaft (Familie, Schule, Kanton). " +
        "Schweizerischen Bezug herstellen (Kantone, Franken, Alpen); Lehrplan 21 Kompetenzbeschreibungen verwenden.",
    },
    mid_elementary: {
      systemName: "Schweizer Lehrplan 21",
      gradeBandLabel: "Zyklus 2 (3.–4. Klasse)",
      context:
        "Mathematik: Zahlraum bis 1.000.000, schriftliche Operationen, Brüche (Hälfte, Viertel, Einheitsbrüche), Geometrie (Fläche, Umfang, Körper), Daten und Wahrscheinlichkeit (Diagramme, einfache Häufigkeiten). " +
        "Deutsch: Textsorten (Erzählung, Beschreibung, Brief), Grammatik (Wortarten, Satzglieder, Zeitformen), Rechtschreibung (Groß-/Kleinschreibung, Dehnung/Schärfung), Medien und Informatik als Querschnittsbereich. " +
        "NMG: Natur und Technik (einfache Versuche, Ökosystem, Stoffe), Raum und Gesellschaft (Karte der Schweiz, Nachbarländer, Kantone und Hauptorte), Geschichte (Eidgenossenschaft, 1291). " +
        "Bezug auf Lehrplan 21 Fachbereichslehrpläne und HarmoS-Bildungsstandards.",
    },
    upper_elementary: {
      systemName: "Schweizer Lehrplan 21",
      gradeBandLabel: "Zyklus 2 (5.–6. Klasse)",
      context:
        "Mathematik: Brüche (alle Operationen), Dezimalzahlen, Prozentzahlen, Proportionalität, negative Zahlen, Terme und Gleichungen, Geometrie (Flächen- und Rauminhalt), Statistik. " +
        "Deutsch: Erörterung, Sachtextanalyse, Literaturbetrachtung (Erzählperspektive, Stilmittel), Grammatik (Satzgefüge, Relativsatz, Konjunktiv), Medien und Informatik (Quellenprüfung, Informationsrecherche). " +
        "NMG / Natur und Technik: Biologie (Zellen, Organsysteme, Ökologie), Chemie (Aggregatzustände, Stoffe und ihre Eigenschaften), Physik (Kräfte, Elektrizität). Räume, Zeiten, Gesellschaften (RZG): Weltgeschichte (Antike bis Frühe Neuzeit), Erdkunde Europa. " +
        "Auf Lehrplan 21 und kantonale Anpassungen (z. B. Kanton Zürich) Bezug nehmen.",
    },
    lower_secondary: {
      systemName: "Schweizer Lehrplan 21 (Sekundarstufe I)",
      gradeBandLabel: "Zyklus 3 (7.–8. Klasse)",
      context:
        "Mathematik: lineare Funktionen und Gleichungen, Statistik und Wahrscheinlichkeit, Pythagoras, Ähnlichkeit, Prozent- und Zinsrechnung, kombinatorische Grundaufgaben. " +
        "Deutsch: Argumentation und Erörterung, Literaturanalyse (Roman, Kurzgeschichte, Lyrik, Drama), Sprachbetrachtung (Wortbildung, Satzgefüge, Modalität), Bewerbung und Protokoll als Textformen. " +
        "Naturwissenschaften: Biologie (Genetik, Evolution, Ökologie), Chemie (Atombau, Reaktionsgleichungen, Periodensystem), Physik (Kinematik, Dynamik, Elektrizität, Optik). RZG: Zeitgeschichte (20. Jahrhundert, Schweiz neutral), Globalisierung, Nachhaltigkeit. " +
        "Bezug auf den Abschluss der obligatorischen Schule (OSA/Sek I) und Orientierungsnoten der Kantone.",
    },
  },

  // ── France — Éducation Nationale ───────────────────────────────────────────
  FR: {
    lower_elementary: {
      systemName: "Éducation Nationale Française",
      gradeBandLabel: "Cycle 2 — CP / CE1 (Grades 1–2)",
      context:
        "Mathématiques: nombres et calculs jusqu'à 100 (addition, soustraction, numération), grandeurs et mesures (cm, kg, heure), géométrie (figures planes, solides), résolution de problèmes simples. " +
        "Français: phonologie (conscience phonémique, grapho-phonème), déchiffrage et lecture de syllabes, copie et dictée de mots et de phrases, grammaire (nom, verbe, déterminant, phrase simple), conjugaison (présent de l'indicatif). " +
        "Questionner le monde: le vivant (animaux, végétaux, cycle de vie), la matière (états de l'eau), les objets techniques (utilisation et sécurité), le temps (repères chronologiques, famille). " +
        "Utiliser la terminologie des programmes officiels de l'Éducation nationale (Bulletin officiel) et l'orthographe française.",
    },
    mid_elementary: {
      systemName: "Éducation Nationale Française",
      gradeBandLabel: "Cycle 2–3 — CE2 / CM1 (Grades 3–4)",
      context:
        "Mathématiques: numération jusqu'à 1.000.000, multiplication et division (tables, algorithme), fractions (demi, quart, dixième), aires et périmètres, angles, représentation de données (tableaux, diagrammes). " +
        "Français: types de textes (récit, lettre, compte rendu, texte documentaire), grammaire (GN, GV, complément d'objet, CC, attribut du sujet), orthographe (accord sujet-verbe, pluriel, féminin, homophones grammaticaux), conjugaison (présent, passé composé, imparfait, futur). " +
        "Sciences et technologie: vivant (photosynthèse, chaînes alimentaires), matière (mélanges, états), énergie et mouvements simples; Histoire: Antiquité, Moyen Âge, découvertes; Géographie: la France physique et administrative, l'Europe. " +
        "Référencer les programmes du MEN (Bulletin officiel 2018).",
    },
    upper_elementary: {
      systemName: "Éducation Nationale Française",
      gradeBandLabel: "Cycle 3 — CM2 / 6e (Grades 5–6)",
      context:
        "Mathématiques: fractions décimales et opérations, pourcentages, proportionnalité, expressions littérales et résolution d'équations simples, géométrie (triangles, cercle, prisme, symétrie axiale et centrale), statistiques (moyenne, médiane). " +
        "Français: textes argumentatifs et littéraires (roman, nouvelle, poésie), analyse des procédés stylistiques, grammaire (propositions subordonnées relatives/conjonctives, participe passé, discours direct/indirect), orthographe (accord du participe passé). " +
        "Sciences (6e): vivant (cellule, reproduction), matière (atome, molécule, mélanges), mouvements (vitesse, forces), Terre et Univers (tectonique, système solaire). Histoire-Géographie: Révolutions (française, industrielle), monde contemporain, mondialisation. " +
        "Utiliser les attendus de fin de cycle 3 et le cadre du DNB (diplôme national du brevet) comme référence.",
    },
    lower_secondary: {
      systemName: "Éducation Nationale Française (Collège)",
      gradeBandLabel: "Cycle 4 — 5e / 4e (Grades 7–8)",
      context:
        "Mathématiques (5e–4e): nombres relatifs, fractions et priorité des opérations, équations et inéquations du 1er degré, fonctions linéaires et affines, Pythagore et Thalès, statistiques (écart interquartile, diagramme en boîte), probabilités. " +
        "Français: dissertations et commentaires littéraires, étude d'œuvres intégrales (roman, théâtre, poésie du Moyen Âge à l'époque contemporaine), grammaire approfondie (mode subjonctif, voix passive, style indirect libre), lexique littéraire. " +
        "Sciences de la vie et de la Terre (SVT): génétique (ADN, mutations), évolution, écosystèmes et biodiversité. Physique-chimie: modèle atomique, réactions chimiques (équations bilan), forces et lois de Newton, ondes (son, lumière), énergie. Histoire-Géographie: Révolutions, XIXe–XXe siècle, géopolitique contemporaine. " +
        "Aligner sur les compétences du socle commun et les sujets du DNB.",
    },
  },

  // ── Belgium (French) / Luxembourg — Programmes scolaires ──────────────────
  BE: {
    lower_elementary: {
      systemName: "Programmes de la Fédération Wallonie-Bruxelles",
      gradeBandLabel: "1re–2e primaire",
      context:
        "Mathématiques: nombres jusqu'à 100, addition et soustraction, mesures (cm, kg, heure), géométrie (formes planes), résolution de problèmes. " +
        "Français: lecture (déchiffrage, compréhension), écriture (copie, production de phrases simples), grammaire (nom, verbe, déterminant), conjugaison (présent). " +
        "Éveil (sciences et société): monde vivant, matières et énergie, environnement et développement durable, histoire et géographie (la famille, le quartier, la Belgique). " +
        "Utiliser la terminologie des socles de compétences (1D — fin du cycle 5/6 ans et 2D — fin du cycle 8 ans) de la Fédération Wallonie-Bruxelles; référence à la Belgique (régions, Bruxelles-Capitale, langues).",
    },
    mid_elementary: {
      systemName: "Programmes de la Fédération Wallonie-Bruxelles",
      gradeBandLabel: "3e–4e primaire",
      context:
        "Mathématiques: multiplication et division (tables jusqu'à 10), nombres décimaux simples, fractions, mesures (périmètre, superficie), représentation de données. " +
        "Français: types de textes (récit, lettre, description, texte informatif), grammaire (GN, GV, compléments circonstanciels, accord sujet-verbe), orthographe (pluriels, féminins, homophones), conjugaison (présent, passé composé, imparfait, futur simple). " +
        "Éveil: sciences (chaînes alimentaires, photosynthèse, corps humain, matières), histoire (Antiquité, Moyen Âge en Belgique), géographie (la Belgique — régions, fleuves, relief). " +
        "Référence aux socles de compétences (fin du cycle 10 ans) et aux programmes CEB (Certificat d'Études de Base).",
    },
    upper_elementary: {
      systemName: "Programmes de la Fédération Wallonie-Bruxelles",
      gradeBandLabel: "5e–6e primaire",
      context:
        "Mathématiques: fractions et décimaux (opérations), pourcentages, proportionnalité, algèbre élémentaire, géométrie (aires, volumes), statistiques (moyenne, tableaux, graphiques). " +
        "Français: textes argumentatifs et littéraires, rédaction structurée (introduction, développement, conclusion), grammaire (propositions subordonnées, participe passé, voix passive), vocabulaire (formation des mots, registres). " +
        "Sciences: cellule et vie (reproduction, écosystèmes, évolution), matière (propriétés, états, transformations), physique (forces, énergie, électricité). Histoire: Révolutions (française, industrielle), Belgique indépendante (1830), XXe siècle. Géographie: mondialisation, développement durable, continents. " +
        "Préparation au CEB (Certificat d'Études de Base) et à l'entrée au secondaire.",
    },
    lower_secondary: {
      systemName: "Programmes du Secondaire (FWB) / Tronc commun",
      gradeBandLabel: "1re–2e secondaire (Tronc commun)",
      context:
        "Mathématiques: nombres rationnels, équations du 1er degré, fonctions linéaires, géométrie analytique (plan cartésien), probabilités, statistiques (indicateurs de position et de dispersion). " +
        "Français: essai littéraire, commentaire de texte, grammaire approfondie (subjonctif, conditionnel, propositions subordonnées complexes), rhétorique et argumentation. " +
        "Sciences: SVT — cellule, génétique, évolution, écologie; Physique-chimie — modèle atomique, réactions chimiques, forces (lois de Newton), énergie, lumière. Histoire: XIXe–XXe siècle (mondialisation, guerres mondiales, décolonisation, Belgique dans l'Europe). " +
        "Référence au Tronc commun rénové (réforme 2019) et aux référentiels de compétences.",
    },
  },

  LU: {
    lower_elementary: {
      systemName: "Plan d'études luxembourgeois",
      gradeBandLabel: "Cycle 2 (1re–2e année)",
      context:
        "Mathématiques: nombres jusqu'à 100, addition et soustraction, grandeurs (cm, kg, heure), formes géométriques. " +
        "Langues: Luxembourgeois (oral), Allemand (lecture, écriture), Français (oral, amorce de lecture); trilinguisme fondamental au Luxembourg. " +
        "Sciences humaines et naturelles: le monde vivant, les matières, orientation dans le temps et l'espace (commune, pays Luxembourg, Europe). " +
        "Tenir compte du contexte trilingue luxembourgeois (Lëtzebuergesch / Deutsch / Français); les exercices peuvent alterner les langues selon le cours concerné.",
    },
    mid_elementary: {
      systemName: "Plan d'études luxembourgeois",
      gradeBandLabel: "Cycle 3 (3e–4e année)",
      context:
        "Mathématiques: multiplication et division, fractions simples, mesures, géométrie plane, données et graphiques. " +
        "Allemand (Deutsch): lecture et compréhension de textes, grammaire (Nomen, Verben, Adjektive, Satzglieder), Diktat et orthographe; Français: lecture, production écrite, grammaire de base. " +
        "Éveil aux sciences: êtres vivants, matières et énergie, environnement (le Luxembourg, la Grande Région, l'Europe). Histoire et géographie: le Luxembourg historique (Romains, comté, duché, indépendance 1839), carte du pays. " +
        "Références aux socles de compétences du MENJE (Ministère de l'Éducation nationale et de la Jeunesse).",
    },
    upper_elementary: {
      systemName: "Plan d'études luxembourgeois",
      gradeBandLabel: "Cycle 4 (5e–6e année / fin du fondamental)",
      context:
        "Mathématiques: fractions et décimaux, proportionnalité, algèbre élémentaire, géométrie (aires, volumes), probabilités simples. " +
        "Allemand: rédaction structurée, analyse de textes littéraires et factuels, grammaire avancée (Konjunktiv, Passiv, Gliedsätze); Français: dissertation courte, grammaire (subjonctif, participe), littérature francophone. " +
        "Sciences naturelles: biologie (cellule, systèmes), physique (forces, énergie, électricité), chimie (matières et transformations). Histoire: XXe siècle (guerres mondiales, rôle du Luxembourg en Europe). " +
        "Préparation aux examens de fin d'enseignement fondamental et à l'orientation (classe de 7e secondaire classique ou général).",
    },
    lower_secondary: {
      systemName: "Enseignement secondaire luxembourgeois",
      gradeBandLabel: "7e–8e classe (Secondaire classique / général)",
      context:
        "Mathématiques: équations et inéquations du 1er degré, fonctions affines et linéaires, statistiques, probabilités, géométrie (Pythagore, Thalès, trigonométrie en introduction). " +
        "Langues: Allemand et Français à niveau avancé (essais, commentaires, analyse littéraire); Anglais comme 3e langue active à partir du secondaire. " +
        "Sciences: biologie (génétique, évolution, écologie), chimie (tableau périodique, réactions, équations), physique (mécanique, énergie, électricité, optique). Histoire-Géographie: histoire mondiale et européenne (XIXe–XXIe siècle), géopolitique. " +
        "Différencier selon la filière (classique plus exigeant, général plus pratique); référencer le programme SCRIPT Luxembourg.",
    },
  },

  // ── Spain — LOMLOE / Real Decreto ─────────────────────────────────────────
  ES: {
    lower_elementary: {
      systemName: "Currículo Español LOMLOE",
      gradeBandLabel: "1.º–2.º de Educación Primaria",
      context:
        "Matemáticas: números hasta 100, suma y resta, medida (cm, m, kg, litros, horas), geometría (figuras planas, cuerpos geométricos), iniciación a la estadística (pictogramas). " +
        "Lengua Castellana y Literatura: lectura (conciencia fonológica, decodificación, fluidez), escritura (letras, palabras, frases simples), gramática (sustantivo, verbo, adjetivo, género y número, punto y mayúscula), comprensión lectora. " +
        "Ciencias Naturales: seres vivos (animales y plantas, ciclos de vida), materia y energía (estados del agua, materiales), espacio y tiempo (día/noche, estaciones). Ciencias Sociales: familia, escuela, localidad, mapa de España como introducción. " +
        "Utilizar terminología del Real Decreto 157/2022 (Educación Primaria) y el Boletín Oficial del Estado.",
    },
    mid_elementary: {
      systemName: "Currículo Español LOMLOE",
      gradeBandLabel: "3.º–4.º de Educación Primaria",
      context:
        "Matemáticas: multiplicación y división (tablas hasta 10×10), fracciones (mitad, cuarto, décima), números decimales, perímetro y área, ángulos, estadística (tablas de frecuencia, diagramas de barras) y probabilidad básica. " +
        "Lengua Castellana y Literatura: textos narrativos e informativos, gramática (clases de palabras: nombre, adjetivo, determinante, verbo, adverbio, preposición; sujeto y predicado, complemento directo), ortografía (tildes, b/v, g/j, homofonía), textos literarios (cuentos, poesías, fábulas). " +
        "Ciencias Naturales: ecosistemas y cadenas alimentarias, cuerpo humano (aparatos y sistemas), materia y energía, tecnología básica. Ciencias Sociales: España (comunidades autónomas, capitales, relieve, ríos), Europa, historia (Prehistoria, Roma, Al-Ándalus, Reyes Católicos). " +
        "Referencia a las competencias clave LOMLOE (CCL, STEM, CCEC) y criterios de evaluación autonómicos.",
    },
    upper_elementary: {
      systemName: "Currículo Español LOMLOE",
      gradeBandLabel: "5.º–6.º de Educación Primaria",
      context:
        "Matemáticas: fracciones y decimales (las cuatro operaciones), porcentajes, proporcionalidad, álgebra (uso de letras, ecuaciones simples), geometría (áreas y volúmenes de figuras planas y cuerpos), estadística (media, mediana, moda), probabilidad. " +
        "Lengua Castellana y Literatura: análisis sintáctico (sujeto, predicado verbal/nominal, complemento directo/indirecto/circunstancial, CN, predicativo), morfología (conjugación verbal completa, clases de palabras), textos argumentativos y expositivos, literatura española (poesía, prosa, teatro). " +
        "Ciencias Naturales: materia (mezclas, propiedades, cambios físicos y químicos), energía y electricidad, cuerpo humano (reproducción, genética básica), medioambiente y sostenibilidad. Historia de España: siglos XVIII–XXI (Ilustración, constituciones, República, franquismo, transición, democracia). " +
        "Alinear con las evaluaciones de diagnóstico de 6.º de Primaria y las competencias LOMLOE.",
    },
    lower_secondary: {
      systemName: "Currículo Español LOMLOE (ESO)",
      gradeBandLabel: "1.º–2.º de ESO",
      context:
        "Matemáticas (1.º–2.º ESO): números enteros y racionales, potencias y raíces, álgebra (polinomios, ecuaciones de 1.er y 2.º grado), funciones (lineal y afín), estadística (tabla de distribución de frecuencias, diagramas, medidas de centralización y dispersión), geometría (Pitágoras, semejanza, trigonometría básica), probabilidad. " +
        "Lengua Castellana y Literatura: comentario de texto literario y no literario, análisis sintáctico oracional (proposiciones subordinadas sustantivas, adjetivas y adverbiales), literatura española medieval y del Siglo de Oro (Romancero, Cervantes, Lope de Vega). " +
        "Biología y Geología: célula (procariota/eucariota), reinos de los seres vivos, ecosistemas, geología (minerales, rocas, procesos geológicos internos y externos, tectónica de placas). Física y Química: magnitudes y unidades (SI), materia (átomo, tabla periódica, enlace químico), movimiento (MRU, MRUA), fuerzas (leyes de Newton), energía. Historia: Historia Medieval y Moderna (Reinos Medievales, Renacimiento, Barroco, Ilustración). " +
        "Referencia al Real Decreto 217/2022 (ESO) y estándares de aprendizaje evaluables.",
    },
  },

  // ── Mexico — SEP / Aprendizajes Clave ─────────────────────────────────────
  MX: {
    lower_elementary: {
      systemName: "Currículo SEP México (Nueva Escuela Mexicana)",
      gradeBandLabel: "1.º–2.º de Primaria",
      context:
        "Matemáticas: números hasta 100, suma y resta, introducción a la multiplicación, monedas y billetes mexicanos (pesos y centavos), medición con unidades no convencionales y convencionales (cm, m), figuras geométricas. " +
        "Español: conciencia fonológica, decodificación y lectura de textos cortos, escritura de palabras y oraciones, signos de puntuación (punto, interrogación, exclamación), géneros textuales (cuento, recado, lista). " +
        "Conocimiento del Medio: seres vivos (animales, plantas), materiales (propiedades, usos), el cuerpo humano (partes, cuidado), la familia y la comunidad, México (estados como primer acercamiento). " +
        "Usar la terminología de la Nueva Escuela Mexicana (NEM) y el Plan de Estudios 2022 de la SEP; incluir referentes culturales mexicanos.",
    },
    mid_elementary: {
      systemName: "Currículo SEP México (Nueva Escuela Mexicana)",
      gradeBandLabel: "3.º–4.º de Primaria",
      context:
        "Matemáticas: multiplicación y división (tablas del 1 al 10), fracciones (medios, cuartos, octavos, décimos), números decimales, perímetro y área, eje de simetría, estadística (tablas, gráficas de barras y circulares), probabilidad básica. " +
        "Español: producción de textos (carta, noticia, reseña, instrucciones), análisis de textos literarios (cuento, leyenda, poema), gramática (sustantivo, adjetivo, verbo, adverbio, conectivos, puntuación, acentuación), comprensión lectora (inferencia, predicción, síntesis). " +
        "Ciencias Naturales: ecosistemas y biodiversidad, cuerpo humano (aparatos digestivo, circulatorio, respiratorio), materia (estados y cambios), energía y fuerza (gravedad, fricción). Historia: México prehispánico (culturas mesoamericanas: Olmeca, Maya, Teotihuacana, Azteca), Conquista española, Virreinato. Geografía: México físico (relieve, ríos, climas, zonas naturales), continentes. " +
        "Referencia a los Programas de Estudio SEP y al Plan 2022 (NEM).",
    },
    upper_elementary: {
      systemName: "Currículo SEP México (Nueva Escuela Mexicana)",
      gradeBandLabel: "5.º–6.º de Primaria",
      context:
        "Matemáticas: fracciones y decimales (las cuatro operaciones), porcentajes, razones y proporciones, álgebra (expresiones literales, ecuaciones de primer grado), geometría (áreas de figuras, volumen de prismas), estadística y probabilidad (media, moda, mediana, experimentos aleatorios). " +
        "Español: textos argumentativos (ensayo, artículo de opinión), argumentación y refutación, análisis literario (novela, cuento, poema), gramática (oraciones compuestas, voz activa y pasiva, uso del punto y coma, dos puntos), comprensión lectora PISA-style. " +
        "Ciencias Naturales: cuerpo humano (sistema nervioso, reproducción, genética básica), ecosistemas y problemática ambiental, materia y energía (transformaciones, electricidad). Historia de México: Independencia, Reforma, Porfiriato, Revolución Mexicana, México contemporáneo. Geografía: territorio nacional, recursos naturales, población y economía de México y el mundo. " +
        "Preparación para PLANEA/Evaluación Diagnóstica SEP y el ingreso a la secundaria.",
    },
    lower_secondary: {
      systemName: "Currículo SEP México (Nueva Escuela Mexicana — Secundaria)",
      gradeBandLabel: "1.º–2.º de Secundaria",
      context:
        "Matemáticas (1.º–2.º Sec): números racionales e irracionales, potencias y notación científica, álgebra (polinomios, ecuaciones lineales y cuadráticas, sistemas de ecuaciones), funciones (lineal, cuadrática), geometría (Pitágoras, semejanza, trigonometría básica), estadística y probabilidad (distribuciones de frecuencia, medidas de tendencia central y dispersión). " +
        "Español: ensayo argumentativo, comentario literario (novela, cuento, poesía, teatro), análisis sintáctico (proposiciones subordinadas), recursos retóricos, investigación documental y uso de fuentes. " +
        "Biología: célula y organización de los seres vivos, genética y herencia, evolución (Darwin, selección natural), ecología y medio ambiente. Química: materia (modelos atómicos, tabla periódica, enlace químico, reacciones químicas y balanceo). Física: cinemática (MRU, MRUA), dinámica (leyes de Newton), energía y calor. Historia Universal: siglos XVIII–XXI (Ilustración, Revolución Francesa, Revolución Industrial, Guerras mundiales, guerra fría, globalización). " +
        "Referencia al Plan de Estudios SEP 2022 (Nueva Escuela Mexicana) y PLANEA/PISA.",
    },
  },

  // ── Argentina — Diseño Curricular Nacional ─────────────────────────────────
  AR: {
    lower_elementary: {
      systemName: "Diseño Curricular Nacional — Argentina",
      gradeBandLabel: "1.º–2.º grado",
      context:
        "Matemática: números hasta 100, suma y resta, iniciación a la multiplicación, moneda nacional (pesos argentinos), figuras geométricas y cuerpos, medición con unidades no convencionales y convencionales. " +
        "Lengua: lectura y escritura (conciencia fonológica, oralidad), producción de textos breves (cuento, lista, carta), gramática (sustantivo, verbo, adjetivo, oración simple, signos de puntuación). " +
        "Ciencias Naturales: seres vivos (animales, plantas, ecosistemas locales), el cuerpo humano, materiales y sus propiedades, fenómenos físicos (luz, sonido, movimiento). Ciencias Sociales: la familia, el barrio, el municipio, Argentina (provincias como primer acercamiento). " +
        "Incluir referentes culturales argentinos (fauna pampeana, patagónica, etc.); uso del voseo en contextos coloquiales; referencia a los Núcleos de Aprendizaje Prioritarios (NAP).",
    },
    mid_elementary: {
      systemName: "Diseño Curricular Nacional — Argentina",
      gradeBandLabel: "3.º–4.º grado",
      context:
        "Matemática: multiplicación y división (hasta 4 cifras), fracciones (mitad, cuarto, décimo), números decimales, perímetro y área, estadística simple (tablas, gráficos de barras y pictogramas). " +
        "Lengua: producción de textos (narración, descripción, instrucciones, nota informativa), gramática (clases de palabras, sujeto y predicado, concordancia, signos de puntuación, acentuación), comprensión lectora (inferencia, paráfrasis). " +
        "Ciencias Naturales: ecosistemas (biodiversidad argentina: Pampas, Patagonia, Yungas, Litoral), cuerpo humano (aparatos y sistemas), materia (estados, mezclas, cambios físicos). Ciencias Sociales: Argentina (provincias y capitales, economía regional, población, gobierno democrático), América Latina, pueblos originarios y Conquista. " +
        "Referencia a los NAP (Núcleos de Aprendizaje Prioritarios) y al diseño curricular de cada provincia (Buenos Aires, Córdoba, etc.).",
    },
    upper_elementary: {
      systemName: "Diseño Curricular Nacional — Argentina",
      gradeBandLabel: "5.º–6.º grado",
      context:
        "Matemática: fracciones y decimales (las cuatro operaciones), porcentajes, razones y proporciones, algebra elemental (fórmulas, ecuaciones simples), geometría (polígonos, círculo, prismas, pirámides), estadística y probabilidad. " +
        "Lengua: argumentación y exposición, análisis literario (cuento, novela, poesía, teatro), gramática (oraciones compuestas, subordinadas sustantivas y adjetivas, voz activa y pasiva, conectores), literatura argentina e hispanoamericana. " +
        "Ciencias Naturales: genética y reproducción, ecosistemas y sustentabilidad, materia (propiedades, cambios químicos), energía (electricidad, circuitos). Ciencias Sociales: Historia argentina (Revolución de Mayo, Independencia, guerras civiles, organización nacional, siglo XX), geografía física y humana de Argentina y América. " +
        "Preparación para las evaluaciones nacionales (Aprender) y el ingreso a la escuela secundaria.",
    },
    lower_secondary: {
      systemName: "Diseño Curricular — Educación Secundaria Argentina",
      gradeBandLabel: "1.º–2.º año de Secundaria",
      context:
        "Matemática: números enteros y racionales, potencias y raíces, álgebra (polinomios, ecuaciones de 1.er y 2.º grado, sistemas de ecuaciones), funciones (lineal y cuadrática), geometría analítica (plano cartesiano, recta, cónica básica), estadística y probabilidad. " +
        "Lengua y Literatura: ensayo y texto argumentativo, análisis literario (literatura universal y argentina: Borges, Cortázar, poesía gauchesca, modernismo), gramática oracional (proposiciones subordinadas), retórica y discurso. " +
        "Biología: célula (organelas, procariota/eucariota), genética (ADN, herencia mendeliana), evolución, ecología. Química: materia (modelos atómicos, tabla periódica, enlace, soluciones, reacciones y balanceo). Física: cinemática (MRU, MRUA), dinámica (leis de Newton), hidrostática, energía. Historia: Revolución Francesa, Revolución Industrial, imperialismo, Primera y Segunda Guerra Mundial, guerra fría, Argentina en el siglo XX. " +
        "Referencia a los NAP de Secundaria y a las jurisdicciones provinciales (Buenos Aires, Córdoba, Santa Fe).",
    },
  },

  // ── Colombia — MEN / Estándares Básicos de Competencias ───────────────────
  CO: {
    lower_elementary: {
      systemName: "Currículo MEN Colombia — Estándares Básicos",
      gradeBandLabel: "1.º–2.º grado",
      context:
        "Matemáticas: sistemas numéricos (números naturales hasta 100, valor posicional), pensamiento numérico (suma y resta), pensamiento espacial (figuras planas y cuerpos), pensamiento métrico (longitud con regla, masa, tiempo), estadística básica. " +
        "Lenguaje: comunicación oral y escrita, lectura de palabras y textos cortos, producción de textos (cuentos, listas, cartas breves), gramática (oración simple, punto, mayúscula). " +
        "Ciencias Naturales: entorno vivo (animales, plantas, ecosistemas colombianos: Andes, Amazonía, Caribe, Pacífico), entorno físico (materiales, estados), ciencia, tecnología y sociedad. Ciencias Sociales: familia, colegio, municipio, Colombia (regiones naturales como introducción). " +
        "Incluir referentes culturales colombianos (fauna y flora de cada región); referencia a los Estándares Básicos de Competencias (EBC) del MEN y las Mallas Curriculares.",
    },
    mid_elementary: {
      systemName: "Currículo MEN Colombia — Estándares Básicos",
      gradeBandLabel: "3.º–4.º grado",
      context:
        "Matemáticas: pensamiento numérico (multiplicación y división, fracciones, números decimales), variacional (patrones, relaciones de proporcionalidad), espacial (polígonos, transformaciones, coordenadas), métrico (perímetro, área, volumen como introducción), estadístico (tablas y gráficas). " +
        "Lenguaje: comprensión lectora (literal, inferencial, crítica), producción de textos (narración, descripción, instrucciones, texto informativo), análisis gramatical (clases de palabras, complementos, puntuación, tildación), literatura (cuento, mito, leyenda colombiana e hispanoamericana). " +
        "Ciencias Naturales: ecosistemas (biodiversidad colombiana, cadenas tróficas), cuerpo humano (sistemas), materia y energía, educación ambiental. Ciencias Sociales: Colombia (departamentos y capitales, geografía física, economía, etnias y culturas, historia precolombina, Conquista y Colonia). " +
        "Referencia a los EBC del MEN y Pruebas Saber 3.º y 5.º.",
    },
    upper_elementary: {
      systemName: "Currículo MEN Colombia — Estándares Básicos",
      gradeBandLabel: "5.º–6.º grado",
      context:
        "Matemáticas: fracciones y decimales (todas las operaciones), porcentajes, razones y proporciones, álgebra (expresiones algebraicas, ecuaciones de primer grado), geometría (áreas y volúmenes), estadística y probabilidad. " +
        "Lenguaje: ensayo, artículo de opinión, comentario literario, análisis de textos argumentativos e informativos, gramática (proposiciones coordinadas y subordinadas, voz activa y pasiva, cohesión y coherencia), literatura colombiana e hispanoamericana (García Márquez, Rulfo, Neruda). " +
        "Ciencias Naturales: genética (herencia, ADN como introducción), evolución y adaptación, ecosistemas y problemática ambiental, materia y energía (electricidad, calor, luz). Historia de Colombia: siglo XIX–XX (Independencia, República, Violencia, FARC, paz), historia universal contemporánea. Geografía: Colombia en el mundo, desarrollo sostenible, migración. " +
        "Preparación para Pruebas Saber 5.º y 9.º (ICFES).",
    },
    lower_secondary: {
      systemName: "Currículo MEN Colombia — Básica Secundaria",
      gradeBandLabel: "6.º–7.º grado",
      context:
        "Matemáticas (6.º–7.º): números enteros y racionales, potenciación y radicación, álgebra (polinomios, ecuaciones e inecuaciones lineales, sistemas de ecuaciones), proporcionalidad directa e inversa, funciones lineal y afín, estadística (tablas de frecuencia, histogramas, medidas de tendencia central), probabilidad. " +
        "Lenguaje: ensayo argumentativo, análisis de textos literarios (cuento, novela, poesía, teatro colombiano e hispanoamericano), gramática (oraciones compuestas, proposiciones subordinadas), semiótica y medios de comunicación, oralidad (debate, exposición). " +
        "Ciencias Naturales — Biología: célula (tipos, organelas, funciones), tejidos y órganos, genética (leyes de Mendel, ADN, mutaciones), evolución (Darwin, selección natural). Química: materia (modelos atómicos, tabla periódica, enlace químico, reacciones). Física: movimiento (MRU, MRUA), fuerzas (leyes de Newton), energía, ondas. Ciencias Sociales: Historia universal (siglos XVIII–XX), Colombia en el siglo XX, derechos humanos, constitución de 1991. " +
        "Referencia a los EBC del MEN y Pruebas Saber 9.º.",
    },
  },

  // ── Netherlands — Kerndoelen / SLO ────────────────────────────────────────
  NL: {
    lower_elementary: {
      systemName: "Nederlands Kerndoelen (SLO)",
      gradeBandLabel: "Groep 3–4 (leerjaar 1–2)",
      context:
        "Rekenen: getallen tot 100, optellen en aftrekken, eerste oriëntatie op vermenigvuldigen, meten (cm, m, kg, liter, klokken lezen), geometrie (vlakke en ruimtelijke figuren), gegevens verzamelen (eenvoudige grafieken). " +
        "Taal (Nederlands): technisch lezen (Veilig Leren Lezen / Zwijsen methode), begrijpend lezen, schrijven (letters, woorden, eenvoudige zinnen), spreken en luisteren, woordenschat, spelling (klankzuivere woorden, meervoud). " +
        "Oriëntatie op jezelf en de wereld: natuur (planten, dieren, seizoenen), omgeving (buurt, gemeente), gezondheid (hygiëne, veiligheid), eenvoudige natuurkunde (licht, geluid, beweging). " +
        "Gebruik kerndoelen SLO en referentieniveaus taal (1F) en rekenen; Nederlandse spelling en terminologie.",
    },
    mid_elementary: {
      systemName: "Nederlands Kerndoelen (SLO)",
      gradeBandLabel: "Groep 5–6 (leerjaar 3–4)",
      context:
        "Rekenen: vermenigvuldigen en delen (tafels t/m 10), breuken (helft, kwart, tienden, honderdsten), schriftelijk optellen/aftrekken/vermenigvuldigen/delen, meten (omtrek, oppervlakte, inhoud), statistiek (staaf- en lijndiagrammen, gemiddelde). " +
        "Taal (Nederlands): begrijpend lezen (hoofdgedachte, inferentie), schrijven (brief, samenvatting, verhaal, instructie), grammatica (zin, zinsdelen: onderwerp/persoonsvorm/lijdend en meewerkend voorwerp, woordsoorten: zelfstandig naamwoord/werkwoord/bijvoeglijk naamwoord/bijwoord/voornaamwoord), spelling (werkwoordspelling, tussenklank). " +
        "Aardrijkskunde: Nederland (provincies, rivieren, Wadden/Delta/Randstad), Europa, wereld (continenten, klimaatzones). Geschiedenis: prehistorie, Grieken/Romeinen, Middeleeuwen, VOC/Gouden Eeuw. Natuur & Techniek: ecosystemen, stoffen, krachten, elektriciteit (eenvoudige schakelingen). " +
        "Referentieniveaus 1F/1S taal en rekenen; Cito-toetsstijl (begrijpend lezen, rekenen).",
    },
    upper_elementary: {
      systemName: "Nederlands Kerndoelen (SLO)",
      gradeBandLabel: "Groep 7–8 (leerjaar 5–6)",
      context:
        "Rekenen: breuken/decimalen/procenten (alle bewerkingen), verhouding en schaal, algebra (eenvoudige formules, letter-variabelen), meetkunde (oppervlakte en inhoud complexe figuren, Pythagoras als voorbereiding), statistiek (gemiddelde, mediaan, modus, diagrammen), kans (eenvoudige experimenten). " +
        "Taal (Nederlands): betogend schrijven (argumentatie, onderbouwing), literaire analyse (roman, gedicht, verhaal), grammatica (bijzinnen: bijvoeglijke/bijwoordelijke/onderwerpszin, lijdende en bedrijvende zin, indirecte rede), spelling (werkwoordspelling niveau 2F), woordenschat (connotatie, formeel/informeel). " +
        "Natuur & Techniek: biologie (cel, organen, ecologie, voortplanting), scheikunde (stoffen en mengsels, reacties), natuurkunde (krachten, energie, elektriciteit, licht). Aardrijkskunde: wereld (klimaatverandering, globalisering), Europa en Nederland (economie, bevolking). Geschiedenis: moderne tijd (industrialisering, wereldoorlogen, dekolonisatie). " +
        "Voorbereiding op de Centrale Eindtoets (Cito) en ISCED Level 2 (voortgezet onderwijs); referentieniveaus 2F taal en rekenen.",
    },
    lower_secondary: {
      systemName: "Voortgezet Onderwijs — Kerndoelen Onderbouw (SLO)",
      gradeBandLabel: "Klas 1–2 VO (leerjaar 7–8)",
      context:
        "Wiskunde (vmbo/havo/vwo onderbouw): gehele getallen en rationele getallen, machten en wortels, algebra (vergelijkingen en ongelijkheden, lineaire functies, uitwerken en vereenvoudigen), meetkunde (stelling van Pythagoras, transformaties, coördinatenstelsel, ruimtemeetkunde), statistiek (frequentieverdelingen, box-plots, regressie als voorbereiding), kansrekening. " +
        "Nederlands: betoog en argumentatieve teksten, literaire analyse (roman, drama, poëzie), taalvaardigheid (2F–3F), grammatica (hoofdzin/bijzin, persoonsvorm/gezegde, naamwoordelijk/werkwoordelijk gezegde, lijdende/bedrijvende zin, interpunctie), spelling werkwoorden en niet-werkwoorden. " +
        "Biologie: cel en erfelijkheid, voortplanting, evolutie, ecologie. Scheikunde: stoffen en mengsels, atoommodel, periodiek systeem, chemische reacties en reactievergelijkingen. Natuurkunde: beweging (eenparig en versneld), krachten (Newton), energie en vermogen, elektriciteit (wet van Ohm, serieschakeling/parallelschakeling), golven (licht en geluid). Aardrijkskunde: geografie van Europa en de wereld, klimaatverandering, duurzaamheid. Geschiedenis: 10 tijdvakken (tot heden). " +
        "Differentieer naar leerroute (vmbo basis/kader/gl-tl, havo, vwo); refereer aan SLO-kerndoelen onderbouw VO en de VAVO/CVO-exameneisen.",
    },
  },
};

/**
 * Returns the curriculum context for a given country code and grade string.
 * Falls back to a generic context if the country is not found.
 */
export function getCurriculumContext(
  countryCode: string,
  grade: string
): CurriculumContext | null {
  const band = getGradeBand(grade);
  const country = CURRICULA[countryCode.toUpperCase()];
  if (!country) return null;
  return country[band] ?? null;
}
