import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FileCountState {
  newFileCount: number;
  newSharedFileCount: number;
  notifications: Notification[];
  incrementFileCount: (count: number) => void;
  incrementSharedFileCount: (count: number) => void;
  resetFileCount: () => void;
  resetSharedFileCount: () => void;
  addNotification: (fileCount: number) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  getUnreadCount: () => number;
}

interface Notification {
  id: string;
  message: string;
  fileCount: number;
  timestamp: Date;
  read: boolean;
  type?: "upload" | "shared"; // 알림 타입 추가
}

export const useFileCountStore = create<FileCountState>()(
  persist(
    (set, get) => ({
      newFileCount: 0,
      newSharedFileCount: 0,
      notifications: [],

      incrementFileCount: (count: number) =>
        set((state) => {
          // 알림 추가
          const notification: Notification = {
            id: Date.now().toString(),
            message: `파일 ${count}개가 추가되었습니다`,
            fileCount: count,
            timestamp: new Date(),
            read: false,
          };

          return {
            newFileCount: state.newFileCount + count,
            notifications: [notification, ...state.notifications],
          };
        }),

      incrementSharedFileCount: (count: number) =>
        set((state) => {
          const notification: Notification = {
            id: Date.now().toString(),
            message: `공유 파일 ${count}개가 추가되었습니다`,
            fileCount: count,
            timestamp: new Date(),
            read: false,
            type: "shared", // 타입 지정
          };

          return {
            newSharedFileCount: state.newSharedFileCount + count,
            notifications: [notification, ...state.notifications],
          };
        }),

      resetFileCount: () => set({ newFileCount: 0 }),

      resetSharedFileCount: () => set({ newSharedFileCount: 0 }),

      addNotification: (
        fileCount: number,
        type: "upload" | "shared" = "upload"
      ) =>
        set((state) => {
          const message =
            type === "shared"
              ? `공유 파일 ${fileCount}개가 추가되었습니다`
              : `파일 ${fileCount}개가 추가되었습니다`;

          const notification: Notification = {
            id: Date.now().toString(),
            message,
            fileCount: fileCount,
            timestamp: new Date(),
            read: false,
            type,
          };
          return {
            notifications: [notification, ...state.notifications],
          };
        }),

      markNotificationAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
        })),

      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notif) => ({
            ...notif,
            read: true,
          })),
        })),

      getUnreadCount: () => {
        const state = get();
        return state.notifications.filter((notif) => !notif.read).length;
      },
    }),
    {
      name: "file-count-storage",
    }
  )
);
