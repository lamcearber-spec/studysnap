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

const SYSTEM_PROMPT = `You are an expert educational content designer for school children grades 1-8.
You will see a photo of a worksheet page or a tightly-cropped single exercise.
Identify every distinct exercise in the input image. Count them.
Generate exactly that many similar practice variations - one-to-one correspondence with the originals.
Treat full worksheet pages and cropped single exercises identically: count what you see, generate that many.
Each variation tests the same skill as its original counterpart but uses different content (different numbers, objects, names, etc.).

For each exercise, decide whether it benefits from a visual aid:
- Counting / sorting / set-comparison questions: REQUIRES visual
- Time-telling, money-counting, geometry, simple diagrams: REQUIRES visual
- Reading comprehension, arithmetic, vocabulary, fill-blank: text-only
- Multiple-choice on conceptual questions: text-only

When an exercise needs a visual, identify the source region in the photograph that
shows similar visual content. Emit a tight bounding box [x_min, y_min, x_max, y_max]
in pixel coordinates of the original photo, plus a short editInstruction describing
the exact change needed to produce the new exercise's visual ("add 3 apples and remove
4 pears" / "show the clock at 7:45 instead of 3:15" / "3 quarters and 2 dimes").

The editInstruction is sent to a downstream image-editor that operates on a crop of
the source region. Be specific about counts and positions; preserve "in the same
flat-illustration style" in every instruction.

Output STRICT JSON only, no markdown, matching this schema exactly:

{
  "subject": string,
  "topic": string,
  "sourceImages": [{ "id": "img_1", "bbox": [number,number,number,number], "description": string }],
  "exercises": [
    {
      "id": "ex_1",
      "type": "multiple-choice" | "short-answer" | "fill-blank",
      "question": string,
      "options": string[],
      "answer": string,
      "visual": null | { "sourceImageId": string, "editInstruction": string }
    }
  ]
}

Write all questions/options/answers/subject/topic in the user's language.
Match the user's grade level + national curriculum if specified.`;

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
    return "Difficulty: Make exercises EASIER than the classwork - add helpful hints, use simpler vocabulary, break questions into smaller steps.";
  }
  if (difficulty === "harder") {
    return "Difficulty: Make exercises MORE CHALLENGING than the classwork - require deeper understanding, add extension questions, use more complex scenarios.";
  }
  return "Difficulty: Match the SAME difficulty level as the classwork.";
}

function getCurriculumInstruction(countryCode?: string, grade?: string) {
  const curriculum = countryCode && grade ? getCurriculumContext(countryCode, grade) : null;
  if (!curriculum) return "";

  return (
    `National Curriculum: ${curriculum.systemName} - ${curriculum.gradeBandLabel}.\n` +
    `Curriculum guidance for this grade band: ${curriculum.context}\n` +
    "Use the terminology, topics, and question formats typical of this curriculum system."
  );
}

function buildUserMessage(input: GenerateRequest) {
  return [
    "Please analyze this classwork page, count every distinct exercise you see, and generate one similar practice variation for each original exercise.",
    input.subject ? `Subject hint: ${input.subject}` : "",
    input.grade ? `Grade level: ${input.grade}` : "",
    input.language
      ? `Language: Write ALL questions, options, answers, subject name, and topic in ${input.language}.`
      : "Language: English",
    getDifficultyInstruction(input.difficulty),
    getCurriculumInstruction(input.countryCode, input.grade),
  ]
    .filter(Boolean)
    .join("\n");
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
