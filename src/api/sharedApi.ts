import { useAuthStore } from "@/store/authStore";
import { ImageApi } from "./index";
import { AuthApi } from "./index";

export const postSharedFiles = async (
  usernames: string[],
  sharedBy: string,
  fileId: string
) => {
  const formData = {
    usernames,
    sharedBy,
  };
  

  const response = await ImageApi.post(`/api/files/${fileId}/share`, formData);
  return response.data;
};

export const getSharedFiles = async (email: string) => {
  const response = await ImageApi.get(
    `/api/files/accessible?user=${email}&page=0&size=9`
  );
  return response.data;
};

export const getUserList = async () => {
  const response = await AuthApi.get(`/api/auth/users`);
  return response.data;
};

export const cancelShare = async (fileId: string, email: string) => {
  const formData = {
    usernames: [email],
  };

  try {
    const response = await ImageApi.delete(`/api/files/${fileId}/share`, {
      data: formData,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
