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

export const GRADE_GROUPS = [
  {
    label: "Elementary School",
    grades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  },
  {
    label: "Middle School",
    grades: ["Grade 7", "Grade 8"],
  },
] as const;

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

export function getSubjectLabel(id: string): string {
  return SUBJECTS.find((s) => s.id === id)?.label ?? id;
}

export function getSubjectEmoji(id: string): string {
  return SUBJECTS.find((s) => s.id === id)?.emoji ?? "📚";
}
