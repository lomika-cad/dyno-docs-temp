import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/dashboard";

export const getStats = async (token: string, tenantId: string) => {
  try {
    const response = await axios.get(`${API_URL}/stats/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
