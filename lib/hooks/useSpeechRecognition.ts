"use client";

import { useCallback } from "react";

export type SpeechRecognitionResult = {
  isFinal: boolean;
  transcript: string;
  confidence: number;
};

export type SpeechRecognitionCallback = (
  result: SpeechRecognitionResult
) => void;

export const useSpeechRecognition = (
  onResult: SpeechRecognitionCallback,
  onStart?: () => void,
  onEnd?: () => void
) => {
  const startRecognition = useCallback(async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("Speech recognition is not supported in this browser");
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      onStart?.();
    };

    recognition.onend = () => {
      onEnd?.();
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      onEnd?.();
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex][0];
      onResult({
        isFinal: event.results[event.resultIndex].isFinal,
        transcript: result.transcript,
        confidence: result.confidence,
      });
    };

    try {
      await recognition.start();
      return recognition;
    } catch (error) {
      console.error("Failed to start recognition:", error);
      throw error;
    }
  }, [onResult, onStart, onEnd]);

  return startRecognition;
};
