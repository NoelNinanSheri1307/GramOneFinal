import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginAsCsrDemo } from "../lib/demoSeed";
import { Handshake, ArrowRight } from "lucide-react";

export const CSRGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="skeleton" style={{ width: "120px", height: "40px" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "csr") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};