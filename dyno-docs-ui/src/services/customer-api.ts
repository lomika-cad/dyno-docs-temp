import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/customers";

export const createCustomer = async (customerData: any, token: string) => {
    try {
        const response = await axios.post(API_URL, customerData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getCustomers = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateCustomer = async (customerData: any, token: string) => {
    try {
        const response = await axios.put(`${API_URL}`, customerData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const deleteCustomer = async (customerId: string, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}