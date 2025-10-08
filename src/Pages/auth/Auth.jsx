import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authToken } from "../../Library/Authenticate";

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

  if (loading) return <div>Authenticating...</div>;
  if (error) return <div>{error}</div>;

  return null;
}

export default Auth;
