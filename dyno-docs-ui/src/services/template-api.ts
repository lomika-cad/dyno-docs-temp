import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/templates";

export const getTemplates = async (token:any) => {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const assignTemplate = async (data: any, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/assign-to-user`, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getUserTemplates = async (userId: string, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/user-templates/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const unassignTemplate = async (data: any, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/unassign-from-user`, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateDesign = async (designData: any, token: string) => {
    try {
        const response = await axios.put(`${API_URL}/update-design`, designData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}