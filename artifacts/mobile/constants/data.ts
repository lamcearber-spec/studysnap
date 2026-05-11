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

// UK National Curriculum: Year 1 (age 5-6) through Year 9 (age 13-14).
// Year 1-2 = Key Stage 1; Year 3-6 = Key Stage 2; Year 7+ = Key Stage 3.
// Mirrors the canonical Grade 1-8 ages (~6-13) with one-year offset.
export const UK_GRADE_GROUPS = [
  {
    label: "Key Stage 1",
    grades: ["Year 1", "Year 2"],
  },
  {
    label: "Key Stage 2",
    grades: ["Year 3", "Year 4", "Year 5", "Year 6"],
  },
  {
    label: "Key Stage 3",
    grades: ["Year 7", "Year 8"],
  },
] as const satisfies readonly GradeGroup[];

// French Éducation Nationale: CP/CE1/CE2/CM1/CM2 = primaire (ages 6-11);
// 6ème/5ème/4ème = collège (ages 11-14).
export const FRANCE_GRADE_GROUPS = [
  {
    label: "École primaire",
    grades: ["CP", "CE1", "CE2", "CM1", "CM2"],
  },
  {
    label: "Collège",
    grades: ["6ème", "5ème", "4ème"],
  },
] as const satisfies readonly GradeGroup[];

export function getGradeGroupsForCountry(countryCode?: string): readonly GradeGroup[] {
  switch (countryCode) {
    case "DE":
      return GERMANY_GRADE_GROUPS;
    case "GB":
      return UK_GRADE_GROUPS;
    case "FR":
      return FRANCE_GRADE_GROUPS;
    default:
      return GRADE_GROUPS;
  }
}

export const ALL_GRADES = GRADE_GROUPS.flatMap((g) => g.grades);

// Phosphor icon name strings — resolved at render time by SubjectIcon
export const SUBJECTS = [
  { id: "math", label: "Math", icon: "MathOperations" },
  { id: "reading", label: "Reading & Writing", icon: "BookOpen" },
  { id: "science", label: "Science", icon: "Flask" },
  { id: "history", label: "History", icon: "Bank" },
  { id: "geography", label: "Geography", icon: "Globe" },
  { id: "art", label: "Art", icon: "Palette" },
  { id: "music", label: "Music", icon: "MusicNote" },
  { id: "computing", label: "Computing", icon: "Code" },
  { id: "pe", label: "Physical Ed.", icon: "SoccerBall" },
  { id: "social", label: "Social Studies", icon: "UsersThree" },
  { id: "biology", label: "Biology", icon: "Plant" },
  { id: "chemistry", label: "Chemistry", icon: "TestTube" },
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

export function getSubjectsForLanguage(language?: string) {
  if (language !== "German") return SUBJECTS;
  return SUBJECTS.map((subject) => ({
    ...subject,
    label: GERMAN_SUBJECT_LABELS[subject.id],
  }));
}

export const DIFFICULTIES = [
  {
    id: "easier" as const,
    label: "Easier",
    desc: "More hints, simpler questions",
    icon: "Seedling", // Phosphor — small growing thing
    color: "#22C55E",
  },
  {
    id: "same" as const,
    label: "Same Level",
    desc: "Similar to your classwork",
    icon: "Plant", // mid-growth
    color: "#F59E0B",
  },
  {
    id: "harder" as const,
    label: "More Challenging",
    desc: "Push beyond your classwork",
    icon: "Tree", // full grown
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

export function getDifficultiesForLanguage(language?: string) {
  if (language !== "German") return DIFFICULTIES;
  return DIFFICULTIES.map((difficulty) => ({
    ...difficulty,
    ...GERMAN_DIFFICULTY_COPY[difficulty.id],
  }));
}

export function getSubjectLabel(id: string, language?: string): string {
  return getSubjectsForLanguage(language).find((s) => s.id === id)?.label ?? id;
}

export function getSubjectIconName(id: string): string {
  return SUBJECTS.find((s) => s.id === id)?.icon ?? "BookOpen";
}

// Backward-compat shim during the transition. Returns empty string so any
// remaining callers render nothing instead of an emoji. Remove after the
// rebrand sweep is fully merged.
export function getSubjectEmoji(_id: string): string {
  return "";
}

export function getDifficultyIconName(id: string): string {
  return DIFFICULTIES.find((d) => d.id === id)?.icon ?? "Plant";
}
