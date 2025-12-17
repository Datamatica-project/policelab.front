import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore.ts";
import { GetRefreshToken } from "./api/authApi.ts";

export default function App() {
  // useEffect(() => {
  //   const initializeAuth = async () => {
  //     try {
  //       const response = await GetRefreshToken();
  //       const newToken = response.data.accessToken as string;
  //       useAuthStore.getState().login(newToken);
  //     } catch (error) {
  //       useAuthStore.getState().logout();
  //     } finally {
  //     }
  //   };
  //   initializeAuth();
  // }, []);
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
