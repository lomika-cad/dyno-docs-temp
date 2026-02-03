// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios from "axios";
import { getEnv } from "../env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_URL = getEnv().API_URL + "/operations/promo-codes";

// ====================================
// Types
// ====================================

export interface PromoCode {
    id: string;
    code: string;
    discountPercentage: number;
    status: 'available' | 'used';
    createdAt: string;
}

export interface CreatePromoCodePayload {
    code: string;
    discountPercentage: number;
    status: 'available' | 'used';
}

// ====================================
// Mock Data (Remove when API is ready)
// ====================================

const MOCK_PROMO_CODES: PromoCode[] = [
    { id: '1', code: '102345', discountPercentage: 10, status: 'available', createdAt: '2024-01-15' },
    { id: '2', code: '568910', discountPercentage: 8, status: 'available', createdAt: '2024-01-14' },
    { id: '3', code: '754321', discountPercentage: 11, status: 'used', createdAt: '2024-01-13' },
    { id: '4', code: '889900', discountPercentage: 25, status: 'available', createdAt: '2024-01-12' },
    { id: '5', code: '441122', discountPercentage: 9, status: 'used', createdAt: '2024-01-11' },
    { id: '6', code: '223344', discountPercentage: 15, status: 'available', createdAt: '2024-01-10' },
    { id: '7', code: '556677', discountPercentage: 20, status: 'available', createdAt: '2024-01-09' },
    { id: '8', code: '998877', discountPercentage: 5, status: 'used', createdAt: '2024-01-08' },
];

let mockData = [...MOCK_PROMO_CODES];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ====================================
// API Functions
// ====================================

export const getPromoCodes = async (_token: string): Promise<{ data: PromoCode[] }> => {
    // TODO: Uncomment when API is ready
    // try {
    //     const response = await axios.get(API_URL, {
    //         headers: {
    //             Authorization: `Bearer ${token}`,
    //         },
    //     });
    //     return response;
    // } catch (error) {
    //     throw error;
    // }

    // Mock implementation
    await delay(500);
    return { data: [...mockData] };
};

export const createPromoCode = async (data: CreatePromoCodePayload, _token: string): Promise<{ data: PromoCode }> => {
    // TODO: Uncomment when API is ready
    // try {
    //     const response = await axios.post(API_URL, data, {
    //         headers: {
    //             Authorization: `Bearer ${token}`,
    //         },
    //     });
    //     return response;
    // } catch (error) {
    //     throw error;
    // }

    // Mock implementation
    await delay(500);
    const newPromoCode: PromoCode = {
        id: String(Date.now()),
        code: data.code,
        discountPercentage: data.discountPercentage,
        status: data.status,
        createdAt: new Date().toISOString().split('T')[0],
    };
    mockData = [newPromoCode, ...mockData];
    return { data: newPromoCode };
};

export const deletePromoCode = async (promoCodeId: string, _token: string): Promise<{ data: { success: boolean } }> => {
    // TODO: Uncomment when API is ready
    // try {
    //     const response = await axios.delete(`${API_URL}/${promoCodeId}`, {
    //         headers: {
    //             Authorization: `Bearer ${token}`,
    //         },
    //     });
    //     return response;
    // } catch (error) {
    //     throw error;
    // }

    // Mock implementation
    await delay(500);
    mockData = mockData.filter(p => p.id !== promoCodeId);
    return { data: { success: true } };
};
