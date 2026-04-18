import { useState } from "react";
import axios from "axios";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import { clearStoredAuth, setStoredAuth } from "../utils/auth";
import "./Login.css";

const hasClerk = Boolean(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    document.querySelectorAll(".blob").forEach((blob) => {
      blob.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      clearStoredAuth();
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      setStoredAuth({ token: res.data.token, user: res.data.user });
      toast.success(`Welcome back, ${res.data.user.name}!`);
      if (!res.data.user.isEmailVerified) {
        toast("Your email is not verified yet. You can verify it from your profile.");
      }
      navigate("/chat");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleStart = () => {
    clearStoredAuth();
  };

  return (
    <div className="login-page" onMouseMove={handleMouseMove}>
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>

      <div className="bg-icon icon1">🩺</div>
      <div className="bg-icon icon2">🧬</div>
      <div className="bg-icon icon3">🌿</div>
      <div className="bg-icon icon4">💊</div>
      <div className="bg-icon icon5">❤️</div>

      <div className="content-wrapper">
        <h1 className="logo">MedGPT</h1>

        <div className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">Secure Patient Portal</p>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">
              Continue with your MedGPT account to access your saved consultations.
            </p>
          </div>

          <div className="auth-grid">
            <div className="auth-panel">
              <h3 className="panel-title">Login with Email</h3>

              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input-group password-group">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button className="primary-btn" onClick={handleLogin} disabled={loading}>
                {loading ? <div className="spinner"></div> : "Sign In"}
              </button>

              <p className="switch-link" onClick={() => navigate("/signup")}>
                Need an account? Create one
              </p>

              <p className="switch-link" onClick={() => navigate("/forgot-password")}>
                Forgot your password?
              </p>
            </div>

            {hasClerk && (
              <>
                <div className="auth-divider">
                  <span>OR</span>
                </div>

                <div className="auth-panel social-panel">
                  <h3 className="panel-title">Continue with Google</h3>
                  <p className="panel-copy">
                    Use your Google account to sign in instantly without entering your password again.
                  </p>

                  <SignedOut>
                    <SignInButton
                      mode="modal"
                      forceRedirectUrl="/chat"
                      oauthFlow="popup"
                      strategy="oauth_google"
                    >
                      <button className="google-btn" onClick={handleGoogleStart}>
                        <FcGoogle className="google-icon" />
                        Continue with Google
                      </button>
                    </SignInButton>
                  </SignedOut>

                  <SignedIn>
                    <div className="auth-state">
                      <UserButton afterSignOutUrl="/" />
                      <p>Your Google account is ready.</p>
                    </div>
                  </SignedIn>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
