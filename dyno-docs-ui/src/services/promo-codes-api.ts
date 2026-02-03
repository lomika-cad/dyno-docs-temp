import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/promo-codes";

// ====================================
// Types
// ====================================

export interface PromoCode {
    id: string;
    code: string;
    description?: string;
    discountPercentage: number;
    discountAmount?: number;
    validFrom: string;
    validTo: string;
    maxUsageCount?: number;
    currentUsageCount: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreatePromoCodePayload {
    code: string;
    description?: string;
    discountPercentage: number;
    discountAmount?: number;
    validFrom: string;
    validTo: string;
    maxUsageCount?: number;
    isActive: boolean;
}

export interface UpdatePromoCodePayload extends CreatePromoCodePayload {
    id: string;
}

export interface ValidatePromoCodePayload {
    code: string;
    purchaseAmount?: number;
}

export interface ValidatePromoCodeResult {
    isValid: boolean;
    message?: string;
    discountPercentage?: number;
    discountAmount?: number;
    calculatedDiscount?: number;
    promoCodeId?: string;
}

// ====================================
// API Functions
// ====================================

export const getPromoCodes = async (token?: string): Promise<{ data: PromoCode[] }> => {
    try {
        const response = await axios.get(API_URL, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const getActivePromoCodes = async (): Promise<{ data: PromoCode[] }> => {
    try {
        const response = await axios.get(`${API_URL}/active`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const getPromoCodeById = async (id: string, token?: string): Promise<{ data: PromoCode }> => {
    try {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const createPromoCode = async (data: CreatePromoCodePayload, token?: string): Promise<{ data: { succeeded: boolean; message: string } }> => {
    try {
        const response = await axios.post(API_URL, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const updatePromoCode = async (id: string, data: UpdatePromoCodePayload, token?: string): Promise<{ data: { succeeded: boolean; message: string } }> => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const deletePromoCode = async (promoCodeId: string, token?: string): Promise<{ data: { succeeded: boolean; message: string } }> => {
    try {
        const response = await axios.delete(`${API_URL}/${promoCodeId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const validatePromoCode = async (data: ValidatePromoCodePayload): Promise<{ data: ValidatePromoCodeResult }> => {
    try {
        const response = await axios.post(`${API_URL}/validate`, data);
        return response;
    } catch (error) {
        throw error;
    }
};

export const applyPromoCode = async (promoCodeId: string, token?: string): Promise<{ data: { succeeded: boolean; message: string } }> => {
    try {
        const response = await axios.post(`${API_URL}/${promoCodeId}/apply`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response;
    } catch (error) {
        throw error;
    }
};
