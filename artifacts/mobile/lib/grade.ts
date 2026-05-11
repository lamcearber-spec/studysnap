import type { Exercise, ExerciseStatus, UserAnswer } from "@/context/SessionContext";

/**
 * Deterministic answer grading for the auto-grade ("validation") mode.
 *
 * Free-drawing exercises are never auto-graded — the kid's drawing always needs
 * a parent eye. Multiple-choice, number, text, tap-to-mark, and connect-pairs
 * can all be compared against the AI-provided answer.
 */
export function supportsAutoGrade(exercise: Exercise): boolean {
  const cardType = exercise.cardType;
  if (!cardType) return Boolean(exercise.answer);
  if (cardType === "freeDrawing") return false;
  if (cardType === "tapToMark") return Array.isArray(exercise.tapToMarkItems);
  if (cardType === "connectPairs") return Array.isArray(exercise.pairs);
  return Boolean(exercise.answer);
}

function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function numericEqual(a: string, b: string): boolean {
  const an = Number(a.replace(",", "."));
  const bn = Number(b.replace(",", "."));
  if (Number.isNaN(an) || Number.isNaN(bn)) return false;
  return Math.abs(an - bn) < 1e-9;
}

export function gradeAnswer(exercise: Exercise): ExerciseStatus {
  const ans = exercise.userAnswer;
  if (ans === undefined || ans === null) return "pending";

  const cardType = exercise.cardType ?? (exercise.type === "multiple-choice" ? "multipleChoice" : "textInput");

  if (cardType === "freeDrawing") return "pending";

  if (cardType === "tapToMark") {
    const marked = (ans as { marked?: string[] }).marked ?? [];
    const correctIds = (exercise.tapToMarkItems ?? [])
      .filter((it) => it.id.startsWith("correct:") || it.label === exercise.answer)
      .map((it) => it.id);
    // AI returns target count via `tapToMarkTarget` plus item id convention
    // "correct:<n>"; fall back to count match.
    if (exercise.tapToMarkTarget !== undefined) {
      return marked.length === exercise.tapToMarkTarget ? "correct" : "wrong";
    }
    if (correctIds.length === 0) return "pending";
    const a = new Set(marked);
    const b = new Set(correctIds);
    if (a.size !== b.size) return "wrong";
    for (const id of a) if (!b.has(id)) return "wrong";
    return "correct";
  }

  if (cardType === "connectPairs") {
    const conns = (ans as { connections?: { left: string; right: string }[] }).connections ?? [];
    const expected = exercise.pairs ?? [];
    if (conns.length !== expected.length) return "wrong";
    const expectedMap = new Map(expected.map((p) => [p.left, p.right]));
    for (const c of conns) {
      if (expectedMap.get(c.left) !== c.right) return "wrong";
    }
    return "correct";
  }

  // string-based comparisons (numberInput, textInput, multipleChoice)
  if (typeof ans !== "string") return "pending";
  if (!exercise.answer) return "pending";

  if (cardType === "numberInput") {
    return numericEqual(ans, exercise.answer) ? "correct" : "wrong";
  }

  return normalize(ans) === normalize(exercise.answer) ? "correct" : "wrong";
}

export function isUserAnswerEmpty(answer: UserAnswer | undefined): boolean {
  if (answer === undefined || answer === null) return true;
  if (typeof answer === "string") return answer.length === 0;
  if ("marked" in answer) return answer.marked.length === 0;
  if ("connections" in answer) return answer.connections.length === 0;
  if ("strokes" in answer) return answer.strokes.length === 0;
  return false;
}
