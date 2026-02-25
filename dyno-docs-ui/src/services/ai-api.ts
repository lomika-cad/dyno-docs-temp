import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/ai";

export interface ChatMessage {
    role: string;
    content: string;
}

export interface SummarizeRequest {
    chat?: ChatMessage[] | string;
    transcript?: string;
}

export interface SummarizeResponse {
    summary: string;
}

export const summarizeChat = async (messages: ChatMessage[], token: string): Promise<SummarizeResponse> => {
    try {
        const response = await axios.post<SummarizeResponse>(
            `${API_URL}/summarize`,
            { chat: messages },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
