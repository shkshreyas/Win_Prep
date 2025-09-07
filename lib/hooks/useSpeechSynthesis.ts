"use client";

import { useCallback } from "react";

export const useSpeechSynthesis = (
  isMuted: boolean,
  volume: number,
  selectedVoice: string | null,
  voiceRate: number,
  voicePitch: number,
  setIsSpeaking: (speaking: boolean) => void,
  synthRef: React.MutableRefObject<SpeechSynthesis | null>
) => {
  return useCallback(
    async (text: string, interrupt: boolean = false): Promise<void> => {
      if (!synthRef.current || isMuted) return Promise.resolve();

      return new Promise<void>((resolve) => {
        try {
          if (interrupt) synthRef.current!.cancel();

          const utterance = new SpeechSynthesisUtterance(text);

          const voices = synthRef.current!.getVoices();
          if (voices && voices.length > 0) {
            if (selectedVoice) {
              const voice = voices.find((v) => v.name === selectedVoice);
              if (voice) utterance.voice = voice;
            }
          }

          utterance.rate = voiceRate;
          utterance.pitch = voicePitch;
          utterance.volume = volume / 100;

          utterance.onstart = () => setIsSpeaking(true);

          const timeoutId = setTimeout(() => {
            setIsSpeaking(false);
            resolve();
          }, 10000);

          utterance.onend = () => {
            clearTimeout(timeoutId);
            setIsSpeaking(false);
            resolve();
          };

          utterance.onerror = (error) => {
            clearTimeout(timeoutId);
            setIsSpeaking(false);
            console.error("Speech synthesis error:", error);
            resolve();
          };

          synthRef.current!.speak(utterance);
        } catch (error) {
          console.error("Unexpected error in speech synthesis:", error);
          setIsSpeaking(false);
          resolve();
        }
      });
    },
    [
      isMuted,
      volume,
      selectedVoice,
      voiceRate,
      voicePitch,
      setIsSpeaking,
      synthRef,
    ]
  );
};
