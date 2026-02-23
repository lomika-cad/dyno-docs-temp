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