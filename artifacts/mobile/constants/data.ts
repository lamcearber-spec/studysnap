// Country flags are intentionally retained — they are nationally-recognizable
// glyphs, not generic decorative emojis. Subject + difficulty emojis have been
// replaced with Phosphor icon name references; render via SubjectIcon / DifficultyIcon
// components. Greeting time-of-day glyphs and the streak flame are dropped from
// data and handled in-component (drop the emoji entirely or use a Phosphor flame).

// V1 launch markets — four countries we have rich curriculum coverage for.
// Other markets fall back to English/general content if accessed via API
// directly, but the in-app picker is gated to these four. When new countries
// graduate from "interest list" to launched, append them here AND extend the
// CURRICULA dict in artifacts/api-server/src/curriculum.ts.
export const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", language: "English" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", language: "English" },
  { code: "DE", name: "Germany", flag: "🇩🇪", language: "German" },
  { code: "FR", name: "France", flag: "🇫🇷", language: "French" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function getLanguageForCountry(countryCode?: string, fallback = "English"): string {
  return COUNTRIES.find((country) => country.code === countryCode)?.language ?? fallback;
}

export function shouldUseGermanContent(language?: string, countryCode?: string): boolean {
  return getLanguageForCountry(countryCode, language) === "German";
}

export type GradeGroup = {
  label: string;
  grades: readonly string[];
};

export const GRADE_GROUPS = [
  {
    label: "Elementary School",
    grades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  },
  {
    label: "Middle School",
    grades: ["Grade 7", "Grade 8"],
  },
] as const satisfies readonly GradeGroup[];

export const GERMANY_GRADE_GROUPS = [
  {
    label: "Grundschule",
    grades: ["Klasse 1", "Klasse 2", "Klasse 3", "Klasse 4"],
  },
  {
    label: "Gymnasium",
    grades: ["Klasse 5", "Klasse 6", "Klasse 7", "Klasse 8"],
  },
] as const satisfies readonly GradeGroup[];

export const FRANCE_GRADE_GROUPS = [
  {
    label: "École primaire",
    grades: ["CP", "CE1", "CE2", "CM1", "CM2"],
  },
  {
    label: "Collège",
    grades: ["6ème", "5ème"],
  },
] as const satisfies readonly GradeGroup[];

export function getGradeGroupsForCountry(countryCode?: string): readonly GradeGroup[] {
  if (countryCode === "DE") return GERMANY_GRADE_GROUPS;
  if (countryCode === "FR") return FRANCE_GRADE_GROUPS;
  return GRADE_GROUPS;
}

export const ALL_GRADES = GRADE_GROUPS.flatMap((g) => g.grades);

export const SUBJECTS = [
  { id: "math", label: "Math" },
  { id: "reading", label: "Reading & Writing" },
  { id: "science", label: "Science" },
  { id: "history", label: "History" },
  { id: "geography", label: "Geography" },
  { id: "art", label: "Art" },
  { id: "music", label: "Music" },
  { id: "computing", label: "Computing" },
  { id: "pe", label: "Physical Ed." },
  { id: "social", label: "Social Studies" },
  { id: "biology", label: "Biology" },
  { id: "chemistry", label: "Chemistry" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];

const GERMAN_SUBJECT_LABELS: Record<SubjectId, string> = {
  math: "Mathe",
  reading: "Lesen & Schreiben",
  science: "Sachkunde",
  history: "Geschichte",
  geography: "Geografie",
  art: "Kunst",
  music: "Musik",
  computing: "Informatik",
  pe: "Sport",
  social: "Sozialkunde",
  biology: "Biologie",
  chemistry: "Chemie",
};

const FRENCH_SUBJECT_LABELS: Record<SubjectId, string> = {
  math: "Maths",
  reading: "Lecture & Écriture",
  science: "Sciences",
  history: "Histoire",
  geography: "Géographie",
  art: "Arts",
  music: "Musique",
  computing: "Informatique",
  pe: "Éducation physique",
  social: "Éducation civique",
  biology: "Biologie",
  chemistry: "Chimie",
};

export function getSubjectsForLanguage(language?: string) {
  if (language === "German") {
    return SUBJECTS.map((subject) => ({
      ...subject,
      label: GERMAN_SUBJECT_LABELS[subject.id],
    }));
  }
  if (language === "French") {
    return SUBJECTS.map((subject) => ({
      ...subject,
      label: FRENCH_SUBJECT_LABELS[subject.id],
    }));
  }
  return SUBJECTS;
}

export const DIFFICULTIES = [
  {
    id: "easier" as const,
    label: "Easier",
    desc: "More hints, simpler questions",
    color: "#22C55E",
  },
  {
    id: "same" as const,
    label: "Same Level",
    desc: "Similar to your classwork",
    color: "#F59E0B",
  },
  {
    id: "harder" as const,
    label: "More Challenging",
    desc: "Push beyond your classwork",
    color: "#EF4444",
  },
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number]["id"];

const GERMAN_DIFFICULTY_COPY: Record<Difficulty, { label: string; desc: string }> = {
  easier: {
    label: "Leichter",
    desc: "Mehr Hinweise, einfachere Fragen",
  },
  same: {
    label: "Gleiches Niveau",
    desc: "Ähnlich wie deine Aufgaben in der Schule",
  },
  harder: {
    label: "Schwieriger",
    desc: "Etwas anspruchsvoller als deine Schulaufgaben",
  },
};

const FRENCH_DIFFICULTY_COPY: Record<Difficulty, { label: string; desc: string }> = {
  easier: {
    label: "Plus facile",
    desc: "Plus d'indices, questions simplifiées",
  },
  same: {
    label: "Même niveau",
    desc: "Similaire à ton travail en classe",
  },
  harder: {
    label: "Plus difficile",
    desc: "Un peu plus exigeant que tes devoirs",
  },
};

export function getDifficultiesForLanguage(language?: string) {
  if (language === "German") {
    return DIFFICULTIES.map((difficulty) => ({
      ...difficulty,
      ...GERMAN_DIFFICULTY_COPY[difficulty.id],
    }));
  }
  if (language === "French") {
    return DIFFICULTIES.map((difficulty) => ({
      ...difficulty,
      ...FRENCH_DIFFICULTY_COPY[difficulty.id],
    }));
  }
  return DIFFICULTIES;
}

export function getSubjectLabel(id: string, language?: string): string {
  return getSubjectsForLanguage(language).find((s) => s.id === id)?.label ?? id;
}

const SUBJECT_ICON_MAP: Record<string, string> = {
  math: "MathOperations",
  reading: "BookOpen",
  science: "Flask",
  history: "Bank",
  geography: "Globe",
  art: "Palette",
  music: "MusicNote",
  computing: "Code",
  pe: "SoccerBall",
  social: "UsersThree",
  biology: "Plant",
  chemistry: "TestTube",
};

export function getSubjectIconName(id: string): string {
  return SUBJECT_ICON_MAP[id] ?? "BookOpen";
}

const DIFFICULTY_ICON_MAP: Record<string, string> = {
  easier: "Leaf",
  same: "Plant",
  harder: "Tree",
};

export function getDifficultyIconName(id: string): string {
  return DIFFICULTY_ICON_MAP[id] ?? "Plant";
}
