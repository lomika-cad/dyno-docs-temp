import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/partnerships";

export const createPartnership = async (formData: FormData, token: string) => {
    try {
        const response = await axios.post(API_URL, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const getPartnerships = async (token: string) => {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const getPartnershipByDistrict = async (tenantId: string, district: string, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/${tenantId}/${district}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const deletePartnership = async (partnershipId: string, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/${partnershipId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const updatePartnership = async (partnershipId: string, data: any, token: string) => {
    try {
        const response = await axios.put(`${API_URL}/${partnershipId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
}