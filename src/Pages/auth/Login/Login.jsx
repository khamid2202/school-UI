import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../../Library/Authenticate";
import { useAuth } from "../../../Hooks/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { onLoginSuccess } = useAuth();
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
      onSuccess: async () => {
        console.log("Login successful");
        // Fetch user data via AuthContext (stores in context, not localStorage)
        const success = await onLoginSuccess();
        if (success) {
          setLoading(false);
          // If user was redirected to login, go back to the original page
          const fromPath = location.state?.from?.pathname || "/home";
          navigate(fromPath);
        } else {
          setError("Failed to fetch user data. Please try again.");
          setLoading(false);
        }
      },

      onFail: (message) => {
        console.log("Login failed:", message);
        setError(message || "Login failed. Please try again.");
        setLoading(false);
      },
    });
  };

  return (
    <div className="min-h-screen justify-center bg-white text-gray-900 flex flex-col lg:flex-row">
      {/* Left hero with logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
        <div className="flex flex-col items-center gap-6 px-8">
          <div className="w-80 h-80 rounded-full bg-white flex items-center justify-center">
            <img
              src="/images/2.png"
              alt="Logo"
              className="w-full object-contain"
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* Right column with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8  text-center flex flex-col">
            <h1 className="text-4xl lg:text-[58px] font-bold text-slate-900">
              Welcome back!
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_10px_40px_rgba(15,23,42,0.05)] p-6 space-y-5">
            {location.state?.from && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
                You were redirected because the page you tried to access
                requires authentication.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-700"
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
                      passwordRef.current?.focus();
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
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
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm font-medium">{error}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 text-white font-semibold py-2.5 shadow-sm hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
