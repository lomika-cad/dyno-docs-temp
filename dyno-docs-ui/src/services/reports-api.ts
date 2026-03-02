import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/reports";

export const generateReport = async (reportData: any, token: string) => {
    try {
        const response = await axios.post(`${API_URL}`, reportData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateReport = async (reportData: any, token: string) => {
    try {
        const response = await axios.put(`${API_URL}`, reportData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getReports = async (tenantId: string, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/${tenantId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}