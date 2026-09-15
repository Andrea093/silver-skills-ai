import { createContext, useCallback, useContext, useState } from "react";

// The Mentor chat used to be a full page (/mentor), which reset its whole conversation every time
// someone navigated away and back. Lifting the "open" state up here — mounted once, outside
// <Routes>, alongside <MentorWidget /> — lets the floating widget keep the conversation alive across
// every page, and lets any page (e.g. Pensión's "habla con el mentor sobre esto" cards) open it with
// a prefilled message without a route change.
interface MentorContextValue {
  isOpen: boolean;
  prefillMessage: string | null;
  openMentor: (prefillMessage?: string) => void;
  closeMentor: () => void;
  clearPrefill: () => void;
}

const MentorContext = createContext<MentorContextValue | null>(null);

export function MentorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState<string | null>(null);

  const openMentor = useCallback((message?: string) => {
    if (message) setPrefillMessage(message);
    setIsOpen(true);
  }, []);

  const closeMentor = useCallback(() => setIsOpen(false), []);
  const clearPrefill = useCallback(() => setPrefillMessage(null), []);

  return (
    <MentorContext.Provider value={{ isOpen, prefillMessage, openMentor, closeMentor, clearPrefill }}>
      {children}
    </MentorContext.Provider>
  );
}

export function useMentor() {
  const ctx = useContext(MentorContext);
  if (!ctx) throw new Error("useMentor must be used within MentorProvider");
  return ctx;
}
