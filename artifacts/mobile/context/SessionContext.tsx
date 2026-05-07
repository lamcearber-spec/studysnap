import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ExerciseType = "multiple-choice" | "short-answer" | "fill-blank";

export interface Exercise {
  id: string;
  question: string;
  type: ExerciseType;
  options?: string[];
  answer?: string;
  imageUrl?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface Session {
  id: string;
  imageUri: string;
  subject: string;
  topic: string;
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
      value={{ sessions, addSession, updateSession, deleteSession, getSession, isLoading }}
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
