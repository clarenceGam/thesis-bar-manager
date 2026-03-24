import { create } from 'zustand';
import { authApi } from '../api/authApi';

const useAuthStore = create((set, get) => ({
  user: null,
  permissions: [],
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  hasInitialized: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await authApi.login(email, password);

      // Handle wrapped response format: { success: true, data: { token, user } }
      const responseData = data.data || data;
      const token = responseData.token;
      const user = responseData.user;

      if (!token) {
        set({ error: 'No token received from server', isLoading: false });
        return { success: false, message: 'No token received from server' };
      }

      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });

      await get().fetchPermissions();
      set({ hasInitialized: true });
      return { success: true };
    } catch (err) {
      const errorCode = err.response?.data?.code;
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, message, code: errorCode };
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await authApi.getMe();
      const userData = data.data || data;
      set({ user: userData });
      return userData;
    } catch {
      get().logout();
      return null;
    }
  },

  fetchPermissions: async () => {
    try {
      const { data } = await authApi.getPermissions();
      const payload = data.data || data;
      const perms = payload.permissions || payload || [];
      set({ permissions: perms, isLoading: false, hasInitialized: true });
      return perms;
    } catch {
      set({ permissions: [], isLoading: false, hasInitialized: true });
      return [];
    }
  },

  initialize: async () => {
    const { hasInitialized, isLoading } = get();
    if (hasInitialized || isLoading) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      set({ isLoading: false, isAuthenticated: false, hasInitialized: true });
      return;
    }

    try {
      set({ isLoading: true });

      // Add timeout to prevent hanging if backend is down
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );

      const userPromise = authApi.getMe();
      const { data: userResponse } = await Promise.race([userPromise, timeoutPromise]);
      const user = userResponse.data || userResponse;

      const permPromise = authApi.getPermissions();
      const { data: permData } = await Promise.race([permPromise, timeoutPromise]);
      const payload = permData.data || permData;
      const perms = payload.permissions || payload || [];

      set({
        user,
        permissions: perms,
        isAuthenticated: true,
        isLoading: false,
        hasInitialized: true,
      });
    } catch {
      localStorage.removeItem('token');
      set({
        user: null,
        permissions: [],
        token: null,
        isAuthenticated: false,
        isLoading: false,
        hasInitialized: true,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedBarId');
    set({ user: null, permissions: [], token: null, isAuthenticated: false, isLoading: false, error: null });
  },

  hasPermission: (requiredPermissions) => {
    const { permissions, user } = get();
    if (user?.role === 'bar_owner') return true;
    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    if (!perms || perms.length === 0) return true;
    if (!permissions || permissions.length === 0) return false;
    return perms.some((p) => permissions.includes(p));
  },
}));

export default useAuthStore;
