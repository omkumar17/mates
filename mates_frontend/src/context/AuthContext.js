"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {useRouter} from "next/navigation"
import { disconnectSocket } from "@/socket/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
   const router = useRouter();

  // Restore user on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Invalid user in localStorage", err);
        localStorage.removeItem("user");
      }
    }

    setAuthLoading(false);
  }, []);

  // Login
  const login = (userData, token) => {
    const userWithProfile = {
      ...userData,
      profileCompleted: userData.profileCompleted ?? false,
    };
    localStorage.setItem("user", JSON.stringify(userWithProfile));
    localStorage.setItem("token", token);

    setUser(userWithProfile);
    setAuthLoading(false);
  };

  // Update user after profile edit
  const updateUser = (userData) => {
    const userWithProfile = {
      ...userData,
      profileCompleted: userData.profileCompleted ?? true,
    };
    setUser(userWithProfile);
    localStorage.setItem("user", JSON.stringify(userWithProfile));
  };

  // Logout
  const logout = () => {

    disconnectSocket();
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setAuthLoading(false);
    
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
