import { AuthApi } from "./index";
import { useAuthStore } from "../store/authStore";

export const PostLogin = async (email: string, password: string) => {
  try {
    const response = await AuthApi.post("/api/auth/login", {
      email,
      password,
    });
    
    // response.data.data에서 가져오기 (한 단계 더 들어가야 함)
    const { accessToken, email: userEmail } = response.data.data;
    
    // Store에 저장
    useAuthStore.getState().login(accessToken, userEmail);

    return response.data.data;  // 이것도 수정
  } catch (error) {
    console.error(error);
    throw error;
  }
};


export const GetRefreshToken = async () => {
  try {
    const response = await AuthApi.get("/api/auth/refresh");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
