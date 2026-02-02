import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/identity";

export const login = async (email: string, password: string) => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}