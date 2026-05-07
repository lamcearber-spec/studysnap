export class QuotaExceededError extends Error {
  override readonly name = "QuotaExceededError";
}

export class ImageEditError extends Error {
  override readonly name = "ImageEditError";
}

export class VisionError extends Error {
  override readonly name = "VisionError";
}

