import { useNeonAuth } from "@/contexts/neon-auth-context";

export function useAuth() {
  const { user, isLoading, isAuthenticated, login, signup, logout } = useNeonAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
  };
}