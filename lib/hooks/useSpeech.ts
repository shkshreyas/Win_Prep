import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechProps {
  onTranscript?: (text: string) => void;
  onSpeakEnd?: () => void;
}

export function useSpeech({ onTranscript, onSpeakEnd }: UseSpeechProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speakingRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!recognitionRef.current) {
      recognitionRef.current = new window.SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (speakingRef.current) return;
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("")
        .trim();

      const latest = event.results[event.results.length - 1];
      if (latest && latest.isFinal && transcript && onTranscript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (
        event.error !== "not-allowed" &&
        event.error !== "service-not-allowed"
      ) {
        setTimeout(() => startListening(), 500);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!speakingRef.current) {
        setTimeout(() => startListening(), 300);
      }
    };

    try {
      recognition.start();
    } catch {}
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    const recognition = recognitionRef.current;
    try {
      recognition?.stop();
    } catch {}
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (typeof window === "undefined") return;

      return new Promise<void>((resolve) => {
        setIsSpeaking(true);
        speakingRef.current = true;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          setIsSpeaking(false);
          speakingRef.current = false;
          if (onSpeakEnd) onSpeakEnd();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [onSpeakEnd]
  );

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
  };
}
