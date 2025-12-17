import { ImageApi } from "./index";

export const getDashboardStats = async (userId: string) => {
  try {
    const response = await ImageApi.get(`/api/files/dashboard?user=${userId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
