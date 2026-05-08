import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fal } from "@fal-ai/client";
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { Router } from "express";
import sharp from "sharp";
import { z } from "zod";
import { getCurriculumContext } from "../curriculum.js";
import { ImageEditError, QuotaExceededError, VisionError } from "../errors.js";
import { getUsageQuota, reserveImageQuota, type UsageQuota } from "../db/client.js";

const router = Router();

const SYSTEM_PROMPT = `You are a senior curriculum designer and assessment-item writer for the BaraBara
practice app. Your job: turn a photograph of a child's classwork into a parallel
practice worksheet that builds the same skills with different content.

═══ ROLE & STANDARDS ═══

You are not an entertainer. You are writing items that will be used by parents
and teachers to verify mastery. Treat every exercise like a low-stakes
formative-assessment question. Your reputation rests on:

1. PEDAGOGICAL FIDELITY — each generated item must test the same skill,
   sub-skill, and difficulty as its photographed counterpart. If the original
   is a single-step word problem, the variation is a single-step word problem
   (not a two-step). If the original tests subtraction-with-borrowing, do not
   silently swap to subtraction-without-borrowing.

2. CURRICULUM AUTHENTICITY — when the user provides a country and grade, the
   national-curriculum block in the user message names the framework, the
   grade-band label, and the topics typical for that band. Use the EXACT
   terminology, vocabulary, and question phrasing that framework uses. If
   the framework is England's National Curriculum, write "How many fewer?"
   not "How much less?". If it's German Lehrplan, use "Welche Zahl fehlt?"
   not "Welche Nummer fehlt?". If it's French Éducation Nationale, use
   "Calcule" / "Trouve" imperatives. If it's US Common Core, mirror SBA/PARCC
   item phrasing where natural.

3. CULTURAL + LINGUISTIC LOCALISATION — names, currencies, units, places,
   foods, holidays, sports, and proper nouns must match the country:
   • United States 🇺🇸 — names: Aiden, Maya, Jamal, Sofia. Currency: $ / cents.
     Units: inches, feet, miles, oz, lb, °F. Sports: baseball, basketball.
   • United Kingdom 🇬🇧 — names: Oliver, Amelia, Noah, Aisha. Currency: £ / p.
     Units: cm, m, km, g, kg, °C. Sports: football, cricket, rounders.
     Spelling: British (colour, recognise, maths).
   • Germany 🇩🇪 — names: Lukas, Mia, Felix, Emma, Yusuf. Währung: € / Cent.
     Einheiten: cm, m, km, g, kg, °C. Sport: Fußball, Handball.
   • France 🇫🇷 — prénoms: Lucas, Emma, Léo, Chloé, Yanis. Monnaie: € / centimes.
     Unités: cm, m, km, g, kg, °C. Sports: football, judo.
   Vary names across the 8 exercises — do not use "Sarah" four times.

═══ INPUT INTERPRETATION ═══

The image may be a full worksheet page OR a tightly-cropped single exercise.
Treat both identically:
1. Count every DISTINCT exercise in the image. Number them.
2. For each, identify (a) the skill being tested, (b) the question type, (c) any
   visual elements (drawings, diagrams, clocks, money, shapes, charts).
3. Generate exactly that many parallel exercises — one variation per original,
   preserved order.

If the input is illegible or contains no exercises, return an empty exercises
array and set subject="Unknown", topic="Unable to read".

═══ DIFFICULTY CONTRACT ═══

The user specifies difficulty: easier / same / harder. Calibrate concretely:

EASIER: scaffold without skipping the skill. Examples:
  • Original: "47 + 28 = ?" → Easier: "47 + 28 = ? Hint: Start by adding 40 + 20."
  • Original: "Read the passage and find the main idea." → Easier: "Read the
    short passage. The main idea is mentioned in the FIRST sentence — what is it?"
  Reduce numbers by ~30%. Add a one-line hint. Keep the skill identical.

SAME: structurally identical, content varied. Same number of steps, same
vocabulary tier, same question stem pattern. Numbers may go ±20%.

HARDER: extend without changing topic. Examples:
  • Original: "47 + 28 = ?" → Harder: "47 + 28 + 19 = ?" or "I have 47 stickers.
    My friend has 28 more than me. How many do we have together?" (2-step).
  • Original: "Find the area of this rectangle." → Harder: "Find the area, then
    say how many tiles of side 2cm would cover it."
  Add one extra step OR move from concrete to slightly abstract. Stay in topic.

NEVER make HARDER mean "bigger numbers in a one-step problem". That's not a
skill increase, it's a tedium increase.

═══ VISUAL DECISION TREE ═══

For each exercise, decide whether it NEEDS a visual:

REQUIRES visual:
  • Counting / sorting / comparison of concrete sets
  • Time-telling on an analogue clock
  • Money counting (coins / notes)
  • Geometry — naming or measuring 2D/3D shapes
  • Reading bar charts, pictograms, line graphs
  • Pattern continuation (shape sequences)
  • Map / diagram / labelled-drawing tasks

TEXT-ONLY (no visual):
  • Pure arithmetic with digits already in the question
  • Word problems with numbers spelled in the text
  • Vocabulary, spelling, grammar
  • Reading comprehension where the passage is the visual
  • Multiple-choice on facts or concepts
  • Equations, formulas, units conversions

When you decide YES on a visual, identify the source region in the photograph
that shows similar visual content. Emit a TIGHT bounding box
[x_min, y_min, x_max, y_max] in pixel coordinates of the original photo, plus
a short editInstruction. Use unique sourceImage ids ("img_1", "img_2"…).

═══ EDIT-INSTRUCTION DISCIPLINE ═══

The editInstruction is sent verbatim to FLUX.1 Kontext, which edits the
cropped source region. Rules:
1. Action verbs only: "add", "remove", "change", "show … instead of …".
2. Count-explicit: "add 3 apples", not "add some apples".
3. Position-light: "in the same arrangement", "at the bottom right".
4. Style-preserving: ALWAYS append ", in the same flat-illustration style
   as the original" so Kontext does not re-style the image.
5. No more than 25 words. The model performs better with terse prompts.

Examples:
  ✓ "Remove 2 apples and add 4 pears, in the same flat-illustration style."
  ✓ "Show the clock at 7:45 instead of 3:15, in the same illustration style."
  ✓ "Show 3 quarters and 2 dimes, replacing the original coins, same style."
  ✗ "Make it more like a picture of fruits with some new ones."  (too vague)
  ✗ "Add some additional fruits so the kid has to count them again."  (count-vague)

═══ OUTPUT CONTRACT ═══

Return STRICT JSON only. No markdown, no code fences, no commentary, no
trailing prose. The JSON schema is enforced by the API; conform exactly:

{
  "subject": string,           // e.g. "Math", "Mathématiques", "Mathematik", "Reading"
  "topic": string,             // specific topic, e.g. "2-digit subtraction with borrowing"
  "sourceImages": [
    { "id": "img_1", "bbox": [x_min, y_min, x_max, y_max], "description": string }
  ],
  "exercises": [
    {
      "id": "ex_1",
      "type": "multiple-choice" | "short-answer" | "fill-blank",
      "question": string,      // the exercise prompt the child reads
      "options": string[],     // ONLY for multiple-choice; exactly 4 options
      "answer": string,        // the canonical correct answer (for parent-reveal only)
      "visual": null | { "sourceImageId": "img_1", "editInstruction": string }
    }
    // ... one per detected original exercise
  ]
}

Strict requirements:
• Write subject / topic / questions / options / answers ALL in the user's language.
• Multiple-choice: exactly 4 options. The correct one MUST be one of them.
• Plausibility distractors: wrong options should be common errors, not random.
  E.g., for "47 - 28 = ?" use distractors {19, 21, 25} — common borrow-bug
  answers — not {137, 4, 100} which the child would never write.
• answer field: provide the canonical answer even for fill-blank and
  short-answer; the parent uses it to grade ✓ / ✗.
• If exercises is empty, subject MUST be "Unknown" and topic "Unable to read".

═══ ANTI-PATTERNS — NEVER ═══

• NEVER use "Sarah", "John", or other clichéd AI names if a country is set.
• NEVER write currency mismatched to the country ($ in a UK exercise).
• NEVER write a HARDER variant that is just a SAME variant with bigger numbers.
• NEVER include emoji, markdown, or LaTeX in the output JSON.
• NEVER fabricate a country/curriculum reference if no country was specified.
• NEVER answer the exercise inside the question text.
• NEVER write more or fewer exercises than were in the original image.
• NEVER write a multiple-choice answer that doesn't match exactly one option.

You are graded by parents. Be precise.`;

const exerciseTypeSchema = z.enum(["multiple-choice", "short-answer", "fill-blank"]);

const generateRequestSchema = z.object({
  imageBase64: z.string().min(1),
  appUserId: z.string().min(1),
  subject: z.string().optional(),
  grade: z.string().optional(),
  language: z.string().optional(),
  difficulty: z.enum(["easier", "same", "harder"]).optional(),
  countryCode: z.string().optional(),
});

const visualInstructionSchema = z.object({
  sourceImageId: z.string().min(1),
  editInstruction: z.string().min(1),
});

const sourceImageSchema = z.object({
  id: z.string().min(1),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  description: z.string(),
});

const visionExerciseSchema = z.object({
  id: z.string().min(1),
  type: exerciseTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  visual: visualInstructionSchema.nullable(),
});

const visionOutputSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  sourceImages: z.array(sourceImageSchema),
  exercises: z.array(visionExerciseSchema),
});

const falImageSchema = z.object({
  url: z.string().url(),
});

const falOutputSchema = z.object({
  images: z.array(falImageSchema).min(1),
});

type GenerateRequest = z.infer<typeof generateRequestSchema>;
type VisionOutput = z.infer<typeof visionOutputSchema>;
type VisionExercise = z.infer<typeof visionExerciseSchema>;
type SourceImage = z.infer<typeof sourceImageSchema>;

type ExerciseResponse = {
  id: string;
  type: z.infer<typeof exerciseTypeSchema>;
  question: string;
  options?: string[];
  answer?: string;
  imageUrl?: string;
};

type GenerateResponse = {
  exercises: ExerciseResponse[];
  subject: string;
  topic: string;
  quota: UsageQuota;
};

type QuotaExceededResponse = GenerateResponse & {
  error: "QUOTA_EXCEEDED";
};

const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  required: ["subject", "topic", "sourceImages", "exercises"],
  properties: {
    subject: { type: Type.STRING },
    topic: { type: Type.STRING },
    sourceImages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["id", "bbox", "description"],
        properties: {
          id: { type: Type.STRING },
          bbox: {
            type: Type.ARRAY,
            minItems: "4",
            maxItems: "4",
            items: { type: Type.NUMBER },
          },
          description: { type: Type.STRING },
        },
      },
    },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["id", "type", "question", "answer", "visual"],
        properties: {
          id: { type: Type.STRING },
          type: {
            type: Type.STRING,
            format: "enum",
            enum: ["multiple-choice", "short-answer", "fill-blank"],
          },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          answer: { type: Type.STRING },
          visual: {
            type: Type.OBJECT,
            nullable: true,
            required: ["sourceImageId", "editInstruction"],
            properties: {
              sourceImageId: { type: Type.STRING },
              editInstruction: { type: Type.STRING },
            },
          },
        },
      },
    },
  },
};

function getDifficultyInstruction(difficulty: GenerateRequest["difficulty"]) {
  if (difficulty === "easier") {
    return [
      "DIFFICULTY: easier",
      "- Reduce numerical magnitude by ~30% (e.g. 47 → 32, 286 → 198).",
      "- Add a one-line hint at the end of the question prompt that scaffolds the first step.",
      "- Keep the SAME skill, sub-skill, and number of steps as the original. Do not skip the skill.",
      "- Vocabulary: prefer one-syllable verbs (find, count, add) over two- (calculate, determine).",
    ].join("\n");
  }
  if (difficulty === "harder") {
    return [
      "DIFFICULTY: harder",
      "- Add ONE extra step OR move from concrete to slightly more abstract framing.",
      "- Stay in the SAME topic and sub-skill.",
      "- Do NOT just inflate numbers — that is tedium, not skill increase.",
      "- Examples: '47 + 28' → '47 + 28 + 19' (one more addend); 'find area of rectangle' → 'find area then say how many 2cm tiles fit'.",
    ].join("\n");
  }
  return [
    "DIFFICULTY: same",
    "- Structurally identical, content varied. Numbers may shift ±20%.",
    "- Same vocabulary tier, same question stem pattern, same number of steps.",
  ].join("\n");
}

function getCurriculumInstruction(countryCode?: string, grade?: string) {
  if (!countryCode || !grade) {
    return [
      "CURRICULUM: not specified.",
      "- Use age-typical content. Do not name any specific national framework.",
      "- Default to neutral English (American spelling, US units).",
    ].join("\n");
  }

  const curriculum = getCurriculumContext(countryCode, grade);
  if (!curriculum) {
    return [
      `CURRICULUM: country ${countryCode}, grade ${grade}.`,
      "- No structured curriculum data available for this combination.",
      "- Use the country's typical age-cohort expectations and educational vocabulary.",
    ].join("\n");
  }

  return [
    `CURRICULUM: ${curriculum.systemName} — ${curriculum.gradeBandLabel}.`,
    `TOPICS + VOCABULARY: ${curriculum.context}`,
    "BINDING: Use the exact terminology, spelling conventions, units, and question phrasing of this framework. Do not import vocabulary from other countries' curricula.",
  ].join("\n");
}

function buildUserMessage(input: GenerateRequest) {
  const lines: string[] = [
    "TASK",
    "Analyse the photographed worksheet. Count every distinct exercise. Generate exactly one parallel practice variation per original — preserve order, preserve count, preserve skill.",
    "",
    "INPUT METADATA",
    input.subject ? `- Subject hint: ${input.subject}` : "- Subject hint: (none — infer from the image)",
    input.grade ? `- Grade level: ${input.grade}` : "- Grade level: (not specified)",
    input.countryCode ? `- Country: ${input.countryCode}` : "- Country: (not specified)",
    input.language
      ? `- Language: Write ALL output (subject, topic, questions, options, answers) in ${input.language}.`
      : "- Language: English",
    "",
    getDifficultyInstruction(input.difficulty),
    "",
    getCurriculumInstruction(input.countryCode, input.grade),
    "",
    "REMINDER",
    "- Output STRICT JSON only. No markdown. No code fences. No commentary.",
    "- One exercise per detected original. If you see 6, generate 6. If you see 1, generate 1.",
    "- Plausibility distractors for multiple-choice — common errors, not random numbers.",
  ];
  return lines.filter(Boolean).join("\n");
}

function normalizeBase64(imageBase64: string) {
  const marker = ";base64,";
  const markerIndex = imageBase64.indexOf(marker);
  return markerIndex >= 0 ? imageBase64.slice(markerIndex + marker.length) : imageBase64;
}

function toTextOnlyExercise(exercise: VisionExercise): ExerciseResponse {
  return {
    id: exercise.id,
    type: exercise.type,
    question: exercise.question,
    options: exercise.options,
    answer: exercise.answer,
  };
}

async function generateVisionOutput(input: GenerateRequest) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new VisionError("GOOGLE_GEMINI_API_KEY is required");

  const ai = new GoogleGenAI({ apiKey });
  const imageBase64 = normalizeBase64(input.imageBase64);

  const response = await ai.models.generateContent({
    model: "gemini-3-pro",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
      {
        text: buildUserMessage(input),
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: geminiResponseSchema,
      maxOutputTokens: 6144,
    },
  });

  if (!response.text) throw new VisionError("Gemini returned an empty response");

  try {
    return visionOutputSchema.parse(JSON.parse(response.text));
  } catch (error) {
    throw new VisionError(error instanceof Error ? error.message : "Invalid Gemini response");
  }
}

function getSourceImageMap(sourceImages: SourceImage[]) {
  return new Map(sourceImages.map((sourceImage) => [sourceImage.id, sourceImage]));
}

function chooseVisualExercises(vision: VisionOutput, remaining: number) {
  const sourceImages = getSourceImageMap(vision.sourceImages);
  let availableVisuals = 0;

  const exercises = vision.exercises.map((exercise) => {
    if (!exercise.visual || !sourceImages.has(exercise.visual.sourceImageId)) {
      return { ...exercise, visual: null };
    }
    if (availableVisuals >= remaining) {
      return { ...exercise, visual: null };
    }
    availableVisuals += 1;
    return exercise;
  });

  return { exercises, visualCount: availableVisuals };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

async function cropSourceImage(photoBuffer: Buffer, source: SourceImage) {
  const image = sharp(photoBuffer);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new ImageEditError("Unable to read source image dimensions");
  }

  const [rawLeft, rawTop, rawRight, rawBottom] = source.bbox;
  const left = Math.floor(clamp(rawLeft, 0, metadata.width - 1));
  const top = Math.floor(clamp(rawTop, 0, metadata.height - 1));
  const right = Math.ceil(clamp(rawRight, left + 1, metadata.width));
  const bottom = Math.ceil(clamp(rawBottom, top + 1, metadata.height));

  return sharp(photoBuffer)
    .extract({ left, top, width: right - left, height: bottom - top })
    .png()
    .toBuffer();
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new ImageEditError("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getR2Bucket() {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new ImageEditError("R2_BUCKET is required");
  return bucket;
}

function getR2PublicUrl(key: string) {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) throw new ImageEditError("R2_PUBLIC_URL is required");
  return `${publicUrl.replace(/\/+$/, "")}/${key}`;
}

async function objectExists(s3: S3Client, bucket: string, key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function editImageWithFal(cropBuffer: Buffer, editInstruction: string) {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new ImageEditError("FAL_API_KEY is required");

  fal.config({ credentials: apiKey });
  const cropDataUrl = `data:image/png;base64,${cropBuffer.toString("base64")}`;

  const result = await withTimeout(
    fal.subscribe("fal-ai/flux-kontext/dev", {
      input: {
        image_url: cropDataUrl,
        prompt: editInstruction,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        output_format: "png",
      },
      logs: false,
    }),
    30_000,
    "FLUX image edit timed out",
  );

  const parsed = falOutputSchema.safeParse(result.data);
  if (!parsed.success) throw new ImageEditError("Invalid Fal.ai image edit response");

  const imageResponse = await fetch(parsed.data.images[0].url);
  if (!imageResponse.ok) {
    throw new ImageEditError(`Failed to fetch edited image: ${imageResponse.status}`);
  }

  return Buffer.from(await imageResponse.arrayBuffer());
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new ImageEditError(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function getEditedImageUrl(
  photoBuffer: Buffer,
  source: SourceImage,
  editInstruction: string,
) {
  const cropBuffer = await cropSourceImage(photoBuffer, source);
  const hash = createHash("sha256")
    .update(cropBuffer)
    .update(editInstruction)
    .digest("hex");
  const key = `edits/${hash}.png`;
  const s3 = getR2Client();
  const bucket = getR2Bucket();

  if (await objectExists(s3, bucket, key)) {
    return { imageUrl: getR2PublicUrl(key), cacheHit: true };
  }

  const editedBuffer = await editImageWithFal(cropBuffer, editInstruction);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: editedBuffer,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { imageUrl: getR2PublicUrl(key), cacheHit: false };
}

async function buildExerciseResponses(
  photoBuffer: Buffer,
  vision: VisionOutput,
  selectedExercises: VisionExercise[],
) {
  const sourceImages = getSourceImageMap(vision.sourceImages);
  let cacheHits = 0;
  let cacheMisses = 0;
  let imageEditDurationMs = 0;

  const exercises: ExerciseResponse[] = [];
  for (const exercise of selectedExercises) {
    const responseExercise = toTextOnlyExercise(exercise);
    if (exercise.visual) {
      const source = sourceImages.get(exercise.visual.sourceImageId);
      if (source) {
        const startedAt = Date.now();
        const edited = await getEditedImageUrl(photoBuffer, source, exercise.visual.editInstruction);
        imageEditDurationMs += Date.now() - startedAt;
        responseExercise.imageUrl = edited.imageUrl;
        if (edited.cacheHit) cacheHits += 1;
        else cacheMisses += 1;
      }
    }
    exercises.push(responseExercise);
  }

  return { exercises, cacheHits, cacheMisses, imageEditDurationMs };
}

function buildQuotaExceededResponse(
  vision: VisionOutput,
  quota: UsageQuota,
): QuotaExceededResponse {
  return {
    error: "QUOTA_EXCEEDED",
    exercises: vision.exercises.map(toTextOnlyExercise),
    subject: vision.subject,
    topic: vision.topic,
    quota,
  };
}

router.post("/generate", async (req, res) => {
  const startedAt = Date.now();
  const parsed = generateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "imageBase64 and appUserId are required" });
    return;
  }

  const input = parsed.data;

  try {
    const quotaBefore = await getUsageQuota(input.appUserId);
    const remainingBefore = Math.max(0, quotaBefore.limit - quotaBefore.used);
    const vision = await generateVisionOutput(input);
    const requestedVisualCount = vision.exercises.filter((exercise) => exercise.visual !== null).length;

    if (requestedVisualCount > 0 && remainingBefore <= 0) {
      res.status(402).json(buildQuotaExceededResponse(vision, quotaBefore));
      return;
    }

    const { exercises: selectedExercises, visualCount } = chooseVisualExercises(vision, remainingBefore);
    const reservation = await reserveImageQuota(input.appUserId, visualCount);
    if (!reservation.allowed) {
      throw new QuotaExceededError("Image quota exceeded");
    }

    const photoBuffer = Buffer.from(normalizeBase64(input.imageBase64), "base64");
    const { exercises, cacheHits, cacheMisses, imageEditDurationMs } =
      await buildExerciseResponses(photoBuffer, vision, selectedExercises);
    const durationMs = Date.now() - startedAt;
    const cacheHitRate = cacheHits + cacheMisses === 0 ? 0 : cacheHits / (cacheHits + cacheMisses);

    req.log.info(
      {
        appUserId: input.appUserId,
        exerciseCount: exercises.length,
        visualCount,
        cacheHits,
        cacheMisses,
        cacheHitRate,
        imageEditDurationMs,
        durationMs,
      },
      "Generated exercises",
    );

    const response: GenerateResponse = {
      exercises,
      subject: vision.subject,
      topic: vision.topic,
      quota: reservation.quota,
    };
    res.json(response);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      try {
        const vision = await generateVisionOutput(input);
        const quota = await getUsageQuota(input.appUserId);
        res.status(402).json(buildQuotaExceededResponse(vision, quota));
      } catch (fallbackError) {
        req.log.error({ error: fallbackError }, "Failed to build quota fallback");
        const quota = await getUsageQuota(input.appUserId);
        res.status(402).json({ error: "QUOTA_EXCEEDED", quota });
      }
      return;
    }

    req.log.error({ error }, "Exercise generation failed");
    res.status(500).json({ error: "Exercise generation failed" });
  }
});

export default router;
