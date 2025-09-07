"use client";

import { useCallback, useReducer } from "react";

export type InterviewPhase = "intro" | "background" | "main" | "complete";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  confidence?: number;
}

export interface InterviewState {
  isActive: boolean;
  currentQuestionIndex: number;
  messages: Message[];
  interviewPhase: InterviewPhase;
  feedback: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null;
  isProcessing: boolean;
  elapsed: number;
}

type InterviewAction =
  | { type: "START_INTERVIEW" }
  | { type: "END_INTERVIEW" }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "SET_FEEDBACK"; feedback: InterviewState["feedback"] }
  | { type: "NEXT_QUESTION" }
  | { type: "NEXT_PHASE" }
  | { type: "UPDATE_ELAPSED"; elapsed: number };

export const createInitialState = (): InterviewState => ({
  isActive: false,
  currentQuestionIndex: 0,
  messages: [],
  interviewPhase: "intro",
  feedback: null,
  isProcessing: false,
  elapsed: 0,
});

const interviewReducer = (
  state: InterviewState,
  action: InterviewAction
): InterviewState => {
  switch (action.type) {
    case "START_INTERVIEW":
      return {
        ...state,
        isActive: true,
      };
    case "END_INTERVIEW":
      return {
        ...state,
        isActive: false,
      };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    case "SET_PROCESSING":
      return {
        ...state,
        isProcessing: action.isProcessing,
      };
    case "SET_FEEDBACK":
      return {
        ...state,
        feedback: action.feedback,
      };
    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };
    case "NEXT_PHASE":
      const phases: InterviewPhase[] = [
        "intro",
        "background",
        "main",
        "complete",
      ];
      const currentIndex = phases.indexOf(state.interviewPhase);
      return {
        ...state,
        interviewPhase: phases[Math.min(currentIndex + 1, phases.length - 1)],
      };
    case "UPDATE_ELAPSED":
      return {
        ...state,
        elapsed: action.elapsed,
      };
    default:
      return state;
  }
};

export const useInterviewState = () => {
  const [state, dispatch] = useReducer(
    interviewReducer,
    undefined,
    createInitialState
  );

  const startInterview = useCallback(
    () => dispatch({ type: "START_INTERVIEW" }),
    []
  );
  const endInterview = useCallback(
    () => dispatch({ type: "END_INTERVIEW" }),
    []
  );
  const addMessage = useCallback(
    (message: Message) => dispatch({ type: "ADD_MESSAGE", message }),
    []
  );
  const setProcessing = useCallback(
    (isProcessing: boolean) =>
      dispatch({ type: "SET_PROCESSING", isProcessing }),
    []
  );
  const setFeedback = useCallback(
    (feedback: InterviewState["feedback"]) =>
      dispatch({ type: "SET_FEEDBACK", feedback }),
    []
  );
  const nextQuestion = useCallback(
    () => dispatch({ type: "NEXT_QUESTION" }),
    []
  );
  const nextPhase = useCallback(() => dispatch({ type: "NEXT_PHASE" }), []);
  const updateElapsed = useCallback(
    (elapsed: number) => dispatch({ type: "UPDATE_ELAPSED", elapsed }),
    []
  );

  return {
    state,
    actions: {
      startInterview,
      endInterview,
      addMessage,
      setProcessing,
      setFeedback,
      nextQuestion,
      nextPhase,
      updateElapsed,
    },
  };
};
