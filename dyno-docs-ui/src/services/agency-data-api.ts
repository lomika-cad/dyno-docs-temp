import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/operations/places/";

export const downloadSampleExcel = async (token: string) => {
    try {
        const response = await axios.get(API_URL + "download-template", {
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