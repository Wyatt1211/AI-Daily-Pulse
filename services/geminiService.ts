import { GoogleGenAI } from "@google/genai";
import { NewsArticle } from '../types';

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for retry logic
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const message = error.message || error.toString();

      // Identify retryable errors: Network errors (Failed to fetch) or Server errors (5xx)
      const isNetworkError = message.includes("Failed to fetch") || message.includes("NetworkError");
      const isServerError = message.includes("500") || message.includes("503") || message.includes("502") || message.includes("Overloaded");

      if (!isNetworkError && !isServerError) {
        throw error; // Don't retry client errors (4xx) like Invalid Key or Permission Denied
      }

      if (i < retries - 1) {
        const delay = baseDelay * Math.pow(2, i); // 1s, 2s, 4s...
        console.warn(`Gemini API Attempt ${i + 1} failed. Retrying in ${delay}ms...`, message);
        await wait(delay);
      }
    }
  }

  throw lastError;
}

export const fetchAiNews = async (
  date: string,
  topics: string[],
  sources: string[],
  existingTitles: string[]
): Promise<NewsArticle[]> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your deployment settings.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Construct a powerful prompt
  const topicsStr = topics.join(", ");
  const sourcesStr = sources.join(", ");
  const exclusionContext = existingTitles.length > 0 
    ? `EXCLUSION LIST (Do not show these stories again): ${JSON.stringify(existingTitles.slice(0, 50))}.` 
    : "";

  const prompt = `
    You are an expert AI News Editor and Aggregator.
    Current Date: ${date}.
    
    YOUR MISSION:
    1.  **SEARCH**: Use Google Search to find the most significant Artificial Intelligence news from ${date} (or the last 24h).
    2.  **AGGREGATE**: Look for stories that are being discussed across MULTIPLE sources. 
        *   Example: If "OpenAI releases Model X" is on TechCrunch, Reddit, and X.com, combine these into ONE news item.
    3.  **FILTER**: 
        *   STRICTLY EXCLUDE: Tutorials, "How to install", Top 10 lists, personal opinions/rants, and generic marketing fluff.
        *   FOCUS ON: Product Launches, Research Papers, Open Source Releases, Policy Changes, Major Industry Moves.
        *   ${exclusionContext}
    4.  **RANK**: specific score (0-100). 
        *   High Score (>80): Covered by major tech media AND discussed heavily on social (Reddit/X).
        *   Medium Score (50-79): Significant but niche (e.g., a specific paper or smaller library update).

    SEARCH SCOPE:
    *   Topics: ${topicsStr}
    *   Preferred Sources: ${sourcesStr} (Prioritize finding matches from these domains, but include other reputable sources if the story is big).

    OUTPUT FORMAT:
    Return a strictly valid JSON array.
    
    IMPORTANT: You must include the SPECIFIC URLs you found for EACH item in the 'sources' array. 
    Do NOT just list generic homepages. List the specific article URL.
    
    JSON Structure:
    [
      {
        "title": "Concise Chinese Title",
        "summary": "Professional Chinese summary (2-3 sentences). Mention specific metrics or names.",
        "score": 85,
        "tags": ["LLM", "Google"],
        "reason": "Briefly explain in Chinese why this is significant (e.g. 'SOTA performance on benchmark').",
        "sources": [
           { "title": "TechCrunch", "uri": "https://techcrunch.com/..." },
           { "title": "Reddit Discussion", "uri": "https://reddit.com/..." }
        ]
      }
    ]
  `;

  try {
    // Wrap the API call in retry logic
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Lower temperature for more factual extraction
      },
    }));

    const text = response.text;
    
    if (!text) {
      throw new Error("No text content returned from the model.");
    }

    // Extract JSON from the response
    let jsonString = text.trim();
    const match = jsonString.match(/```json([\s\S]*?)```/);
    if (match) {
      jsonString = match[1];
    } else {
         const matchMarkdown = jsonString.match(/```([\s\S]*?)```/);
         if(matchMarkdown) {
             jsonString = matchMarkdown[1];
         }
    }

    let parsedData: any[] = [];
    try {
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON from Gemini response", jsonString);
      throw new Error("AI response was not valid JSON. Please try again.");
    }

    // Map parsed data to our NewsArticle model
    const articles: NewsArticle[] = parsedData.map((item: any) => {
      
      let itemSources = item.sources;
      if (!Array.isArray(itemSources)) {
        itemSources = [];
      }

      const cleanSources = itemSources
        .filter((s: any) => s && s.uri && typeof s.uri === 'string')
        .map((s: any) => ({
          title: s.title || new URL(s.uri).hostname,
          uri: s.uri
        }));

      return {
        id: generateId(),
        title: item.title || "Untitled News",
        summary: item.summary || "No summary provided.",
        score: typeof item.score === 'number' ? item.score : 50,
        date: date,
        sources: cleanSources,
        tags: Array.isArray(item.tags) ? item.tags : [],
        reason: item.reason || ""
      };
    });

    return articles.sort((a, b) => b.score - a.score);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error.message || error.toString();
    
    // Improved Error Handling for Network Issues
    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
      throw new Error(
        "Network Error: Could not connect to Google Gemini API.\n" +
        "This is often caused by unstable internet or network restrictions (e.g., firewall/VPN issues).\n" +
        "Please checks your connection and try again."
      );
    }

    // Billing/Permission issues
    if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("entitlements")) {
      throw new Error(
        "Access Denied (403): Your API Key is valid, but the project likely lacks a linked Billing Account. " +
        "Google Search Grounding features require a billing-enabled project."
      );
    }
    
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("400")) {
      throw new Error("Invalid API Key. Please check your Vercel/Environment settings.");
    }

    throw new Error(`Gemini API Failed: ${errorMessage}`);
  }
};