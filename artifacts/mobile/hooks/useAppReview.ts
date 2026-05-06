import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY = "@studysnap_review_count";
const THRESHOLDS = [10, 20]; // sessions at which to prompt

/**
 * Call after every new session is saved.
 * Prompts for a store review at session 10, then again at session 20.
 * Stops after 2 prompts — never bothers the user a third time.
 */
export async function maybeRequestReview(totalSessions: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const promptCount = raw ? parseInt(raw, 10) : 0;

    if (promptCount >= THRESHOLDS.length) return;

    const threshold = THRESHOLDS[promptCount];
    if (totalSessions < threshold) return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    await StoreReview.requestReview();
    await AsyncStorage.setItem(STORAGE_KEY, String(promptCount + 1));
  } catch {
    // Never crash the app over a review prompt
  }
}
