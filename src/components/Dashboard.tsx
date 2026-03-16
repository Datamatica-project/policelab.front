import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  BarChart3,
  Upload,
  FolderOpen,
  Users,
  Settings,
  Shield,
  FileImage,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import { DashboardStats } from "../components/dashboard-stats";
import { FileUpload } from "../components/file-upload";
import { FileGallery } from "../components/file-gallery";
import { Toaster } from "../components/ui/sonner";
import { useAuthStore, useLastUploadedAtStore } from "../store/authStore";
import { getFileList } from "@/api/uploadApi";
import { useFileCountStore } from "@/store/fileCountStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { format } from "date-fns";
import SharedGallery from "./Shared-gallery";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, email } = useAuthStore();
  const { lastUploadedAt } = useLastUploadedAtStore();

  const {
    newFileCount,
    newSharedFileCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount,
  } = useFileCountStore();

  const unreadCount = getUnreadCount();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false);

    // 파일 관리 탭일 때만 뱃지 개수 초기화
    if (tabId === "files") {
      useFileCountStore.getState().resetFileCount();
    }

    // 공유 관리 탭일 때 뱃지 개수 초기화
    if (tabId === "shared") {
      useFileCountStore.getState().resetSharedFileCount();
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      icon: BarChart3,
      label: "대시보드",
      badge: null,
    },
    {
      id: "upload",
      icon: Upload,
      label: "파일 업로드",
      badge: null,
    },
    {
      id: "files",
      icon: FolderOpen,
      label: "파일 관리",
      badge: newFileCount > 0 ? String(newFileCount) : null,
    },
    {
      id: "shared",
      icon: Users,
      label: "공유 관리",
      badge: newSharedFileCount > 0 ? String(newSharedFileCount) : null, // 뱃지 추가
    },
    {
      id: "settings",
      icon: Settings,
      label: "설정",
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 토스트 알림 */}
      <Toaster />

      {/* 헤더 */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-blue-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <div className="flex items-center space-x-3">
              <img src="/policeLogo.webp" alt="logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl">교통사고 현장데이터 공유시스템</h1>
                <p className="text-blue-200 text-sm">
                  Traffic Accident Scene Data Sharing System
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-800"
            >
              <Bell className="h-5 w-5" />
            </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-800 relative"
                >
                  <Bell className="h-5 w-5" />
                  {/* 읽지 않은 알림 배지 */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 max-h-96 overflow-y-auto"
              >
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>알림</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllNotificationsAsRead();
                      }}
                    >
                      모두 읽음
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-gray-500">
                    알림이 없습니다
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        markNotificationAsRead(notification.id);
                        // 파일 관리 페이지로 이동 (선택사항)
                        if (notification.type === "shared") {
                          setActiveTab("shared");
                        } else {
                          setActiveTab("files");
                        }
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-sm ${
                            !notification.read
                              ? "font-semibold text-blue-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.message}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 ml-2" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {format(
                          new Date(notification.timestamp),
                          "yyyy-MM-dd HH:mm"
                        )}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="text-right">
              <p>{email?.split("@")[0]}</p>
              <p className="text-blue-200 text-sm">{email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-blue-900 border-blue-300 "
              onClick={() => logout()}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* 사이드바 */}
        <aside
          className={`
            bg-white shadow-lg transition-all duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
            lg:sticky lg:top-0 lg:self-start lg:h-screen 
            fixed inset-y-0 left-0 z-50
            w-64 pt-4 h-screen
          `}
        >
          <nav className="px-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                        ${
                          activeTab === item.id
                            ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                        }
                      `}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              {/* 대시보드 */}
              <TabsContent value="dashboard" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-blue-900 text-3xl">대시보드</h2>
                    <p className="text-blue-600">
                      파일 업로드 및 공유 현황을 확인하세요
                    </p>
                  </div>
                  <div className="text-right text-blue-600">
                    <p>마지막 업데이트</p>
                    <p>
                      {lastUploadedAt
                        ? format(new Date(lastUploadedAt), "yyyy년 MM월 dd일 HH:mm")
                        : "-"}
                    </p>
                  </div>
                </div>
                <DashboardStats />
              </TabsContent>

              {/* 파일 업로드 */}
              <TabsContent value="upload" className="space-y-6">
                <div>
                  <h2 className="text-blue-900 text-3xl">파일 업로드</h2>
                  <p className="text-blue-600">
                    현장 사진, 증거 자료 등을 업로드하세요
                  </p>
                </div>
                <FileUpload />
              </TabsContent>

              {/* 파일 관리 */}
              <TabsContent value="files" className="space-y-6">
                <div>
                  <h2 className="text-blue-900 text-3xl">파일 관리</h2>
                  <p className="text-blue-600">
                    업로드된 파일을 검색하고 관리하세요
                  </p>
                </div>
                <FileGallery />
              </TabsContent>

              {/* 공유 관리 */}
              <TabsContent value="shared" className="space-y-6">
                <div>
                  <h2 className="text-blue-900 text-3xl">공유 관리</h2>
                  <p className="text-blue-600">
                    파일 공유 현황 및 권한을 관리하세요
                  </p>
                </div>
                <SharedGallery />
              </TabsContent>

              {/* 설정 */}
              <TabsContent value="settings" className="space-y-6">
                <div>
                  <h2 className="text-blue-900 text-3xl">설정</h2>
                  <p className="text-blue-600">시스템 설정 및 계정 관리</p>
                </div>
                <Card className="border-blue-200">
                  <CardContent className="text-center py-12">
                    <Settings className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                    <h3 className="text-blue-900 mb-2">시스템 설정</h3>
                    <p className="text-blue-600 mb-4">
                      Supabase 연결 후 사용자 권한 및 시스템 설정이 가능합니다.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
