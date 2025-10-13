import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../Library/Authenticate";
import { fetchUserData } from "../../../Library/Authenticate";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (usernameRef.current) usernameRef.current.focus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Please enter username and password");
      setLoading(false);

      if (!username) usernameRef.current.focus();
      if (!password) passwordRef.current.focus();
      return;
    }

    login({
      username: username.trim().toLowerCase(),
      password,
      onSuccess: () => {
        console.log("Login successful");
        // Fetch user data after successful login and only navigate after it's stored
        fetchUserData({
          onSuccess: (data) => {
            console.log("Fetched user data:", data);
            try {
              localStorage.setItem("user", JSON.stringify(data));
            } catch (e) {
              console.warn("Failed to store user data in localStorage:", e);
            }
            setLoading(false);
            navigate("/home");
          },
          onFail: (message) => {
            console.log("Failed to fetch user data:", message);
            setError(message || "Failed to fetch user data. Please try again.");
            setLoading(false);
          },
        });
      },

      onFail: (message) => {
        console.log("Login failed:", message);
        setError(message || "Login failed. Please try again.");
        setLoading(false);
      },
    });
  };

  //after logging in get the user from the backend and store it in local storage

  return (
    <div className="md:flex md:flex-row">
      <div className="md:w-1/2  md:block">
        <div className="md:flex hidden  md:items-center md:justify-center md:min-h-screen">
          <img
            src="../../../public/images/login_page.jpeg"
            className="md:h-full  md:w-full md:object-cover"
          />
        </div>
      </div>
      <div className="flex items-center md:w-1/2 justify-center min-h-screen bg-[#eff6ff]">
        <div className="w-[85%] max-w-md bg-white p-1 rounded-2xl shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center p-8 mb-6">
            <img
              src="../../../public/images/2.png"
              alt="Logo"
              className="w-32 h-28" // 👈 smaller logo
              draggable="false"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5 p-5">
            <div className="px-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[#324158] mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                ref={usernameRef}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    passwordRef.current.focus();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Enter your username"
              />
            </div>

            <div className="px-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#324158] mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                ref={passwordRef}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Enter your password"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="px-4">
              <button
                type="submit"
                className="w-full bg-[#2563eb] pl-5 text-white font-semibold py-2.5 rounded-2xl hover:bg-[#3b82f6] transition"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
