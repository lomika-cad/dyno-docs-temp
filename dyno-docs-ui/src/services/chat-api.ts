import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/Chat";

export const getMessages = async (chatId: string) => {
    try {
        const response = await axios.get(`${API_URL}/messages/${chatId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const registerClient = async (data: any) => {
    try {
        const response = await axios.post(`${API_URL}/register-client`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const checkClient = async (email: string) => {
    try {
        const response = await axios.post(`${API_URL}/check-client?email=${encodeURIComponent(email)}`);
        return response.data;
    } catch (error) {       
        throw error;
    }
}

export const sendMessage = async (data: any) => {
    try {
        const response = await axios.post(`${API_URL}/send-message`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getChatUsers = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}