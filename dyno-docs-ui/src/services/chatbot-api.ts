import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/Chatbot";

export const createChatbot = async (data:any, token: string) => {
    try {
        const response = await axios.post(API_URL+"/create-bot", data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const createChatbotCommands = async (data:any, token: string) => {
    try {
        const response = await axios.post(API_URL+"/commands", data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {        
        throw error;
    }
}

export const updateChatbotCommands = async (data:any, botId: string, token: string) => {
    try {
        const response = await axios.put(API_URL+"/commands/"+botId, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {        
        throw error;
    }
}


export const deleteChatbotCommand = async (commandId: string, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/commands/${commandId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getChatbotCommands = async (botId: string, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/commands/${botId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getChatbotName = async (botId: string, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/bot-name/${botId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}