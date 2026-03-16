import axios from "axios";
import { useAuthStore } from "../store/authStore";
// import { useAuthStore } from "../store/authStore";

export const AuthApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // 세션 쿠키를 사용해 인증을 유지하는 구조일때 자동 첨부
});

export const MosaicApi = axios.create({
  baseURL: import.meta.env.VITE_MOSAIC_API_URL,
  withCredentials: true, // 세션 쿠키를 사용해 인증을 유지하는 구조일때 자동 첨부
});

export const ImageApi = axios.create({
  baseURL: import.meta.env.VITE_IMAGE_API_URL,
  withCredentials: true, // 세션 쿠키를 사용해 인증을 유지하는 구조일때 자동 첨부
});

AuthApi.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;      
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

AuthApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // access token 만료 시 재발급
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // refresh token 으로 access token 재발급
        const response = await AuthApi.get("/api/auth/refresh");

        const newAccessToken = response.data.accessToken;
        const email = response.data.email;

        // 내부 상태 업데이트
        useAuthStore.getState().login(newAccessToken, email as string);

        // Authorization 헤더 업데이트
        AuthApi.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // 실패했던 요청 재시도
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return AuthApi(originalRequest);
      } catch (error) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

ImageApi.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;      
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);