import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../Hooks/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          {/* Animated loader */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto">
              <Loader2 className="w-20 h-20 text-indigo-600 animate-spin" />
            </div>
            {/* Pulsing circle background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-indigo-100 rounded-full opacity-20 animate-ping"></div>
          </div>

          {/* Text */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Authenticating
          </h2>
          <p className="text-gray-500">
            Please wait while we verify your credentials...
          </p>

          {/* Skeleton elements for page preview */}
          <div className="mt-12 space-y-3 max-w-md mx-auto">
            <div className="h-3 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded-full animate-pulse w-5/6 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded-full animate-pulse w-4/6 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
