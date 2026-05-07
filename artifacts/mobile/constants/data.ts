export const COUNTRIES = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", language: "English" },
  { code: "US", name: "United States", flag: "🇺🇸", language: "English" },
  { code: "AU", name: "Australia", flag: "🇦🇺", language: "English" },
  { code: "CA", name: "Canada", flag: "🇨🇦", language: "English" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", language: "English" },
  { code: "DE", name: "Germany", flag: "🇩🇪", language: "German" },
  { code: "AT", name: "Austria", flag: "🇦🇹", language: "German" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", language: "German" },
  { code: "FR", name: "France", flag: "🇫🇷", language: "French" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", language: "French" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", language: "French" },
  { code: "ES", name: "Spain", flag: "🇪🇸", language: "Spanish" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", language: "Spanish" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", language: "Spanish" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", language: "Spanish" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", language: "Dutch" },
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

export function getGradeGroupsForCountry(countryCode?: string): readonly GradeGroup[] {
  return countryCode === "DE" ? GERMANY_GRADE_GROUPS : GRADE_GROUPS;
}

export const ALL_GRADES = GRADE_GROUPS.flatMap((g) => g.grades);

export const SUBJECTS = [
  { id: "math", label: "Math", emoji: "📐" },
  { id: "reading", label: "Reading & Writing", emoji: "📖" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "history", label: "History", emoji: "🏛️" },
  { id: "geography", label: "Geography", emoji: "🌍" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "computing", label: "Computing", emoji: "💻" },
  { id: "pe", label: "Physical Ed.", emoji: "⚽" },
  { id: "social", label: "Social Studies", emoji: "👥" },
  { id: "biology", label: "Biology", emoji: "🌿" },
  { id: "chemistry", label: "Chemistry", emoji: "⚗️" },
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
    emoji: "😊",
    color: "#22C55E",
  },
  {
    id: "same" as const,
    label: "Same Level",
    desc: "Similar to your classwork",
    emoji: "⚡",
    color: "#F59E0B",
  },
  {
    id: "harder" as const,
    label: "More Challenging",
    desc: "Push beyond your classwork",
    emoji: "🔥",
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

export function getSubjectEmoji(id: string): string {
  return SUBJECTS.find((s) => s.id === id)?.emoji ?? "📚";
}
