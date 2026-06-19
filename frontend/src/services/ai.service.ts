import axios from "axios";
import { API_V1 } from "../helpers/config";

const API_BASE = API_V1;

export interface IChatMessage {
  role: "user" | "model";
  parts: string;
}

export const chatWithAI = async (
  message: string,
  history: IChatMessage[] = []
) => {
  try {
    const response = await axios.post(
      `${API_BASE}/ai_model/chat`,
      {
        message,
        history,
      },
      {
        withCredentials: true,
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("AI chat request failed:", error);
    throw new Error("Failed to communicate with AI service.");
  }
};

export const chatWithAIFree = async (
  message: string,
  history: IChatMessage[] = []
) => {
  try {
    const response = await axios.post(
      `${API_BASE}/ai_model/chat-free`,
      {
        message,
        history,
      },
      {
        withCredentials: true,
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Free AI chat request failed:", error);
    throw new Error("Failed to communicate with AI service.");
  }
};