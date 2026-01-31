import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/templates";

export const getTemplates = async () => {
    try {
        const response = await axios.get(API_URL);
        return response;
    } catch (error) {
        throw error;
    }
}