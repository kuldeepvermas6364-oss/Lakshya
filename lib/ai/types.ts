export type AIAction =
  | "explain"
  | "hint"
  | "solve"
  | "practice"
  | "quiz"
  | "summary"
  | "revision"
  | "mistake_analysis"
  | "study_plan"
  | "performance_analysis"
  | "question_generation"
  | "doubt_help";

export type AIContext = {
  className?: string;
  examTarget?: string;
  language?: "english" | "hindi" | "hinglish";
  subject?: string;
  chapter?: string;
};

export type AIRequest = {
  message: string;
  action?: AIAction;
  context?: AIContext;
};

export type AIErrorCode =
  | "BAD_REQUEST"
  | "RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "AI_RESPONSE_INVALID"
  | "INTERNAL_ERROR";
