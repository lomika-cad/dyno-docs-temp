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