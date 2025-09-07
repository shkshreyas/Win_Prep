"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { Button } from "@/components/ui/button";
import { createFeedback } from "@/lib/actions/general.action";
import {
  analyzeResponse,
  getFollowUpQuestion,
} from "@/lib/actions/interview.action";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InterviewProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  questions?: string[];
}

export default function Interview({
  userName,
  userId,
  interviewId,
  questions = [],
}: InterviewProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const transcriptHandlerRef = useRef<((text: string) => void) | null>(null);

  const { isListening, isSpeaking, startListening, stopListening, speak } =
    useSpeech({
      onTranscript: (t: string) => transcriptHandlerRef.current?.(t),
    });

  const endInterview = useCallback(async () => {
    stopListening();
    setIsActive(false);

    if (userId && interviewId) {
      const { success } = await createFeedback({
        interviewId,
        userId,
        transcript: messages,
      });

      if (success) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.error("Failed to save feedback");
        router.push("/");
      }
    }
  }, [interviewId, messages, router, stopListening, userId]);

  const onTranscript = useCallback(
    async (text: string) => {
      // Add user's response to messages
      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);

      // Get current question
      const currentQuestion = questions[currentQuestionIndex];

      // Analyze response
      setIsProcessing(true);
      const analysis = await analyzeResponse(currentQuestion, text);
      setFeedback(analysis);

      // Check for follow-up
      const followUp = await getFollowUpQuestion(
        currentQuestion,
        text,
        messages.map((m) => `${m.role}: ${m.content}`).join("\n")
      );

      if (followUp) {
        // Add follow-up question to messages
        const followUpMessage: Message = {
          role: "assistant",
          content: followUp,
        };
        setMessages((prev) => [...prev, followUpMessage]);
        await speak(followUp);
      } else {
        // Move to next question if no follow-up
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          // End interview if no more questions
          await endInterview();
        }
      }
      setIsProcessing(false);
    },
    [currentQuestionIndex, questions, messages, speak, endInterview]
  );

  useEffect(() => {
    transcriptHandlerRef.current = onTranscript;
  }, [onTranscript]);

  const startInterview = useCallback(async () => {
    setIsActive(true);
    const welcomeMessage = `Hello ${userName}! I'll be conducting your interview today. Let's begin with the first question.`;
    await speak(welcomeMessage);
    await speak(questions[0]);
    startListening();
  }, [userName, questions, speak, startListening]);

  useEffect(() => {
    if (isActive && !isProcessing && !isSpeaking && currentQuestionIndex > 0) {
      speak(questions[currentQuestionIndex]);
    }
  }, [
    currentQuestionIndex,
    isActive,
    isSpeaking,
    isProcessing,
    questions,
    speak,
  ]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-5xl">
        <div className="call-view mb-8">
          <div className="card-interviewer">
            <div className="avatar">
              {!isSpeaking ? null : <span className="animate-speak" />}
              <Image
                src="/ai-avatar.png"
                alt="AI Interviewer"
                width={90}
                height={90}
                className="rounded-full"
              />
            </div>
            <h3 className="text-foreground">AI Interviewer</h3>
            <p className="interview-text">
              {isListening
                ? "Listening..."
                : isSpeaking
                ? "Speaking..."
                : "Ready"}
            </p>
            <div className="progress w-40 mt-2" />
            <p className="text-xs text-muted-foreground">
              Time: {Math.floor(elapsed / 60)}:
              {("0" + (elapsed % 60)).slice(-2)}
            </p>
            {isActive ? (
              <div className="flex gap-3 mt-4">
                <button className="btn-disconnect" onClick={endInterview}>
                  End Call
                </button>
              </div>
            ) : (
              <div className="flex gap-3 mt-4">
                <button className="btn-call" onClick={startInterview}>
                  Start Call
                </button>
              </div>
            )}
          </div>

          <div className="card-border">
            <div className="card-content">
              <p className="text-sm text-muted-foreground">Live transcript</p>
              <div className="w-full h-full overflow-auto max-h-[320px] space-y-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg w-fit max-w-[80%] ${
                      m.role === "assistant"
                        ? "bg-blue-50 text-foreground"
                        : "bg-gray-50 text-foreground ml-auto"
                    }`}
                  >
                    <p className="text-sm tracking-wide leading-6">
                      {m.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={50}
              height={50}
              className="rounded-full"
            />
            <div>
              <h2 className="font-semibold text-foreground">AI Interviewer</h2>
              <p className="text-sm text-muted-foreground">
                {isListening
                  ? "Listening..."
                  : isSpeaking
                  ? "Speaking..."
                  : "Ready"}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === "assistant"
                    ? "bg-blue-50 ml-4 text-foreground"
                    : "bg-gray-50 mr-4 text-foreground"
                }`}
              >
                <p className="tracking-wide leading-7 text-base md:text-lg">
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          {!isActive && (
            <Button onClick={startInterview} className="w-full">
              Start Interview
            </Button>
          )}
        </div>

        {feedback && (
          <div className="bg-white dark:bg-card rounded-lg shadow-lg p-6">
            <h3 className="font-semibold mb-2 text-foreground">
              Response Analysis
            </h3>
            <div className="space-y-2">
              <p className="text-foreground">Score: {feedback.score}/100</p>
              <p className="text-foreground">{feedback.feedback}</p>
            </div>
            {interviewId && (
              <div className="mt-4">
                <a
                  href={`/api/feedback/pdf?id=${interviewId}`}
                  className="btn-secondary"
                >
                  Download Summary PDF
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
