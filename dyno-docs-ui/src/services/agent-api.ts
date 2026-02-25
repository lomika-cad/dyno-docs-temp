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

export const readMessages = async (chatId: string, token: string) => {
  try {
    const response = await axios.put(
      `${API_URL}/read-messages/${chatId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkBotStatus = async (chatId: string, token: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/bot-status?chatUserId=${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUnreadChatCount = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/unread-chat-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
