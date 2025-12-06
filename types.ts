export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  score: number; // 0-100 importance score
  date: string;
  sources: Array<{ title: string; uri: string }>;
  tags: string[];
  reason: string; // Why is this important?
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // In a real app, never store passwords in local storage!
  createdAt: string;
}

export interface AppState {
  user: User | null;
  generatedNews: NewsArticle[];
  repository: NewsArticle[];
  isLoading: boolean;
  selectedDate: string;
  error: string | null;
}

export interface FilterSettings {
  activeTopics: string[];
  customSources: string[];
}

export const DEFAULT_TOPICS = [
  "LLM (Large Language Models)",
  "Generative Video/Image",
  "AI Hardware (GPUs/TPUs)",
  "Open Source Models",
  "AI Policy & Regulation",
  "Robotics"
];

export const DEFAULT_SOURCES = [
  "TechCrunch",
  "Hacker News",
  "X (Twitter)",
  "Reddit (r/LocalLLaMA, r/MachineLearning)",
  "XinZhiYuan (新智元)",
  "JiQiZhiXin (机器之心)",
  "Linux Do",
  "Hugging Face"
];
