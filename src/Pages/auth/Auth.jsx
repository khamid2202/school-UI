import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authToken } from "../../Library/Authenticate";
import { Loader2 } from "lucide-react";

function Auth() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const authenticate = async () => {
      await authToken({
        onSuccess: () => {
          console.log("User is authenticated");
          navigate("/home");
        },
        onFail: () => {
          navigate("/login");
        },
      });
      setLoading(false);
    };

    authenticate();
  }, [navigate]);

  if (loading) {
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}

export default Auth;
