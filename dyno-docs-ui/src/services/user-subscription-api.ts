import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/user-subscriptions";

export const updateSubscription = async (data: any, token: string) => {
    try {
        const response = await axios.put(API_URL, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}