import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authToken } from "../../Library/Authenticate";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    authToken({
      onSuccess: () => {
        if (!mounted) return;
        setAuthed(true);
        setChecking(false);
      },
      onFail: () => {
        if (!mounted) return;
        setAuthed(false);
        setChecking(false);
      },
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium">Authenticating...</div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
