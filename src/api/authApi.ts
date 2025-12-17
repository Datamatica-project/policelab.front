import { AuthApi } from "./index";

export const PostLogin = async (email: string, password: string) => {
  try {
    const response = await AuthApi.post("/api/v1/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const GetRefreshToken = async () => {
  try {
    const response = await AuthApi.get("/api/v1/auth/refresh");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
