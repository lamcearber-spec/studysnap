import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ExerciseType = "multiple-choice" | "short-answer" | "fill-blank";
export type ExerciseStatus = "pending" | "correct" | "wrong";

export interface Exercise {
  id: string;
  question: string;
  type: ExerciseType;
  options?: string[];
  answer?: string;
  imageUrl?: string;
  status?: ExerciseStatus;
}

export interface Session {
  id: string;
  imageUri: string;
  subject: string;
  topic: string;
  title?: string;
  grade?: string;
  language?: string;
  exercises: Exercise[];
  createdAt: string;
  totalAnswered: number;
  totalCorrect: number;
}

interface SessionContextType {
  sessions: Session[];
  addSession: (session: Session) => Promise<void>;
  updateSession: (session: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getSession: (id: string) => Session | undefined;
  setExerciseStatus: (sessionId: string, exerciseId: string, status: ExerciseStatus) => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

const STORAGE_KEY = "@studysnap_sessions";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Session[];
        setSessions(parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessions = async (updated: Session[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addSession = useCallback(async (session: Session) => {
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
  }, []);

  const updateSession = useCallback(async (session: Session) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === session.id ? session : s));
      saveSessions(updated);
      return updated;
    });
  }, []);

  const setExerciseStatus = useCallback(async (
    sessionId: string,
    exerciseId: string,
    status: ExerciseStatus,
  ) => {
    setSessions((prev) => {
      const updated = prev.map((session) => {
        if (session.id !== sessionId) return session;

        const exercises = session.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, status } : exercise
        );
        const totalAnswered = exercises.filter((exercise) =>
          exercise.status === "correct" || exercise.status === "wrong"
        ).length;
        const totalCorrect = exercises.filter((exercise) => exercise.status === "correct").length;

        return { ...session, exercises, totalAnswered, totalCorrect };
      });
      saveSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
  }, []);

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions]
  );

  return (
    <SessionContext.Provider
      value={{
        sessions,
        addSession,
        updateSession,
        deleteSession,
        getSession,
        setExerciseStatus,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
