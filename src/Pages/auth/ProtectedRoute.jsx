import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authToken } from "../../Library/Authenticate";
import { Loader2 } from "lucide-react";

// Cache authentication state to prevent re-checking on every route
let authCache = {
  checked: false,
  isAuthenticated: false,
  timestamp: 0,
};

const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      // Check if we have a valid cached auth state
      const now = Date.now();
      if (
        authCache.checked &&
        authCache.isAuthenticated &&
        now - authCache.timestamp < AUTH_CACHE_DURATION
      ) {
        // Use cached result for smooth navigation
        if (!mounted) return;
        setAuthed(true);
        setFadeOut(true);
        setTimeout(() => {
          if (mounted) setChecking(false);
        }, 150); // Minimal delay for smooth transition
        return;
      }

      // Perform actual auth check
      authToken({
        onSuccess: () => {
          if (!mounted) return;
          authCache = {
            checked: true,
            isAuthenticated: true,
            timestamp: Date.now(),
          };
          setAuthed(true);
          setFadeOut(true);
          setTimeout(() => {
            if (mounted) setChecking(false);
          }, 300);
        },
        onFail: () => {
          if (!mounted) return;
          authCache = {
            checked: true,
            isAuthenticated: false,
            timestamp: Date.now(),
          };
          setAuthed(false);
          setChecking(false);
        },
      });
    };

    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center transition-opacity duration-300 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
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

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
