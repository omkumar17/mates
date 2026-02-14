"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // ✅ global loading

  // ------------------------
  // Restore user on refresh
  // ------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setAuthLoading(false);
  }, []);

  // ------------------------
  // Login
  // ------------------------
  const login = (userData, token) => {
    setAuthLoading(true);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);

    // small delay ensures smooth navigation
    setTimeout(() => {
      setAuthLoading(false);
    }, 300);
  };

  // ------------------------
  // Logout
  // ------------------------
  const logout = () => {
    setAuthLoading(true);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);

    setTimeout(() => {
      setAuthLoading(false);
    }, 200);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
