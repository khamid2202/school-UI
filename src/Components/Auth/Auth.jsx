import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authToken } from "../../Library/Authenticate";

function Auth() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    authToken({
      onSuccess: () => {
        navigate("/home");
      },
      onFail: () => {
        navigate("/login");
      },
      onConnectionError: () => {
        setError("No connection to server");
      },
    });
    setLoading(false);
  }, [navigate]);

  if (loading) return <div>Authenticating...</div>;
  if (error) return <div>{error}</div>;

  return null;
}

export default Auth;
