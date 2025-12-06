import { NewsArticle, FilterSettings, DEFAULT_TOPICS, DEFAULT_SOURCES, User } from '../types';

const USERS_KEY = 'ai_daily_pulse_users';
const CURRENT_USER_ID_KEY = 'ai_daily_pulse_current_user_id';

// Helper to get keys specific to a user
const getRepoKey = (userId: string) => `user_${userId}_repo`;
const getSettingsKey = (userId: string) => `user_${userId}_settings`;

// --- Authentication (Simulation) ---

export const getAllUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const registerUser = (username: string, password: string): User => {
  const users = getAllUsers();
  if (users.some(u => u.username === username)) {
    throw new Error("Username already exists");
  }

  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    passwordHash: btoa(password), // Simple encoding (NOT SECURE for production, demo only)
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const loginUser = (username: string, password: string): User => {
  const users = getAllUsers();
  const user = users.find(u => u.username === username && u.passwordHash === btoa(password));
  
  if (!user) {
    throw new Error("Invalid username or password");
  }
  
  // Remember login state
  localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_ID_KEY);
};

export const getCurrentSessionUser = (): User | null => {
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  if (!userId) return null;
  const users = getAllUsers();
  return users.find(u => u.id === userId) || null;
};

// --- Data Management (User Scoped) ---

export const getRepository = (userId: string): NewsArticle[] => {
  try {
    const data = localStorage.getItem(getRepoKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load repository", e);
    return [];
  }
};

export const saveToRepository = (userId: string, article: NewsArticle): NewsArticle[] => {
  const current = getRepository(userId);
  // Avoid exact duplicates by ID
  if (current.some(a => a.id === article.id)) return current;
  
  const updated = [article, ...current];
  localStorage.setItem(getRepoKey(userId), JSON.stringify(updated));
  return updated;
};

export const removeFromRepository = (userId: string, id: string): NewsArticle[] => {
  const current = getRepository(userId);
  const updated = current.filter(a => a.id !== id);
  localStorage.setItem(getRepoKey(userId), JSON.stringify(updated));
  return updated;
};

export const getSettings = (userId: string): FilterSettings => {
  try {
    const data = localStorage.getItem(getSettingsKey(userId));
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return {
    activeTopics: DEFAULT_TOPICS,
    customSources: DEFAULT_SOURCES
  };
};

export const saveSettings = (userId: string, settings: FilterSettings) => {
  localStorage.setItem(getSettingsKey(userId), JSON.stringify(settings));
};
