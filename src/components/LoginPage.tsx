import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { PostLogin } from "../api/authApi";

export default function LoginPage() {
  const [email, setEmail] = useState("soeonggon.do@gmail.com");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 로그인 로직
      if (!email || !password) {
        setError("이메일과 비밀번호를 입력해주세요.");
        setIsLoading(false);
        return;
      }

      const response = await PostLogin(email, password);
      if (response.resultCode === "SUCCESS") {
        login(
          response.data.accessToken as string,
          response.data.email as string
        );
        navigate("/");
      } else {
        setError(response.resultMessage);
      }
    } catch (err) {
      setError("로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-900 p-4 rounded-full shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">
            교통사고 현장데이터 공유시스템
          </h1>
          <p className="text-blue-600 text-sm">
            Traffic Accident Scene Data Sharing System
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-6 text-center">
            로그인
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 입력 */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-blue-900"
              >
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-blue-900 placeholder:text-blue-300
                           transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-blue-900"
              >
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-12 py-2.5 border border-blue-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-blue-900 placeholder:text-blue-300
                           transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center 
                           text-blue-400 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-900 text-white rounded-lg 
                       font-medium hover:bg-blue-800 active:bg-blue-950
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-md hover:shadow-lg
                       flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>로그인 중...</span>
                </>
              ) : (
                <span>로그인</span>
              )}
            </button>
          </form>

          {/* 추가 옵션 (선택사항) */}
          <div className="mt-6 pt-6 border-t border-blue-100">
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-blue-300 rounded 
                           focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-blue-700">로그인 상태 유지</span>
              </label>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                비밀번호 찾기
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 정보 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-blue-600">
            보안을 위해 접속 후 반드시 로그아웃해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
