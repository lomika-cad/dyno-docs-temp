import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/Agent";

export const getAvailableChats = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/available-chats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
