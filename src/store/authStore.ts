import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  email: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
}

interface LastUploadedAtState {
  lastUploadedAt: Date | null;
  setLastUploadedAt: (lastUploadedAt: Date) => void;
}

// export const useAuthStore = create<AuthState>((set) => ({
//   email: null,
//   token: null,
//   login: (token, email) => set({ token, email }),
//   logout: () => set({ token: null, email: null }),
// }));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      token: null,
      login: (token, email) => set({ token, email }),
      logout: () => set({ token: null, email: null }),
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useLastUploadedAtStore = create<LastUploadedAtState>((set) => ({
  lastUploadedAt: null,
  setLastUploadedAt: (lastUploadedAt: Date) => set({ lastUploadedAt }),
}));
