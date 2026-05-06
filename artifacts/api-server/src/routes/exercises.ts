import { openai } from "@workspace/integrations-openai-ai-server";
import { Router } from "express";
import { getCurriculumContext } from "../curriculum.js";

const router = Router();

const SYSTEM_PROMPT = `You are an expert educational content creator for school children.
Your task is to analyze a classwork page image and generate similar practice exercises.

Rules:
- Generate exactly 8 exercises similar in style and difficulty to what you see
- Mix exercise types: multiple-choice (4 options), short-answer, and fill-in-the-blank
- Keep language age-appropriate and encouraging
- Make exercises that genuinely test the same concepts shown
- When a national curriculum is specified, align topics, terminology, and question style with that curriculum's standards and typical assessment formats
- IMPORTANT: Write ALL exercise questions, options, and answers in the language specified by the user. If no language is specified, use English.
- Return ONLY valid JSON, no markdown, no code blocks

Output format (strict JSON):
{
  "subject": "detected subject name (in the requested language)",
  "topic": "specific topic/concept covered (in the requested language)",
  "exercises": [
    {
      "id": "ex_1",
      "type": "multiple-choice",
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "answer": "correct option text"
    },
    {
      "id": "ex_2", 
      "type": "short-answer",
      "question": "question text",
      "answer": "expected answer"
    },
    {
      "id": "ex_3",
      "type": "fill-blank",
      "question": "The ___ is the powerhouse of the cell.",
      "answer": "mitochondria"
    }
  ]
}`;

router.post("/generate", async (req, res) => {
  const { imageBase64, subject, grade, language, difficulty, countryCode } = req.body as {
    imageBase64: string;
    subject?: string;
    grade?: string;
    language?: string;
    difficulty?: "easier" | "same" | "harder";
    countryCode?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const difficultyInstruction =
    difficulty === "easier"
      ? "Difficulty: Make exercises EASIER than the classwork — add helpful hints, use simpler vocabulary, break questions into smaller steps."
      : difficulty === "harder"
        ? "Difficulty: Make exercises MORE CHALLENGING than the classwork — require deeper understanding, add extension questions, use more complex scenarios."
        : "Difficulty: Match the SAME difficulty level as the classwork.";

  // Look up national curriculum context
  const curriculum =
    countryCode && grade ? getCurriculumContext(countryCode, grade) : null;

  const curriculumInstruction = curriculum
    ? `National Curriculum: ${curriculum.systemName} — ${curriculum.gradeBandLabel}.\n` +
      `Curriculum guidance for this grade band: ${curriculum.context}\n` +
      `Use the terminology, topics, and question formats typical of this curriculum system.`
    : "";

  try {
    const userMessage = [
      "Please analyze this classwork page and generate 8 similar practice exercises.",
      subject ? `Subject hint: ${subject}` : "",
      grade ? `Grade level: ${grade}` : "",
      language ? `Language: Write ALL questions, options, answers, subject name, and topic in ${language}.` : "Language: English",
      difficultyInstruction,
      curriculumInstruction,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: userMessage,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";

    let parsed: {
      subject: string;
      topic: string;
      exercises: Array<{
        id: string;
        type: string;
        question: string;
        options?: string[];
        answer?: string;
      }>;
    };

    try {
      // Strip any accidental markdown code blocks
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      req.log.error({ content }, "Failed to parse OpenAI response as JSON");
      res.status(500).json({ error: "Failed to parse exercise generation response" });
      return;
    }

    res.json({
      exercises: parsed.exercises ?? [],
      subject: parsed.subject ?? subject ?? "General",
      topic: parsed.topic ?? "Study Practice",
    });
  } catch (err) {
    req.log.error({ err }, "Exercise generation failed");
    res.status(500).json({ error: "Exercise generation failed" });
  }
});

export default router;
