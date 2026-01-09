import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/places";

export const downloadSampleExcel = async (token: string) => {
    try {
        const response = await axios.get(API_URL + "/download-template", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: "blob",
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const uploadAgencyData = async (formData: FormData, token: string ) => {
    try {
        const response = await axios.post(API_URL + "/upload-excel", formData, {
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

export const getUploadDataSet = async (token: string) => {
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

export const deleteData = async (placeId: string, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/${placeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const createPlace = async (formData: FormData, token: string) => {
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

export const updatePlace = async (placeId: string, data: any, token: string) => {
    try {
        const response = await axios.put(`${API_URL}/${placeId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
}
