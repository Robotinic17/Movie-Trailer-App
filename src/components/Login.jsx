import { useState } from "react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate, Link } from "react-router-dom";
import "./Auth2.css";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Wait for the login to complete and get the user credential
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Wait a brief moment for Firebase auth state to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force a small delay to ensure auth state is updated throughout the app
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 200);
    } catch (error) {
      setError(getErrorMessage(error.code));
      setLoading(false);
    }
  };

  // Alternative approach - if the above doesn't work, try this version:
  /*
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Use a slightly longer timeout to ensure everything is loaded
      setTimeout(() => {
        navigate("/", { replace: true });
        // Force a hard reload if needed (use as last resort)
        // window.location.href = "/";
      }, 500);
      
    } catch (error) {
      setError(getErrorMessage(error.code));
      setLoading(false);
    }
  };
  */

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/user-not-found":
        return "No account found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later";
      default:
        return "Failed to login. Please try again";
    }
  };

  return (
    <motion.div
      className="auth-container-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ADDED: Full-screen loading overlay */}
      {loading && (
        <div className="auth-loading-overlay">
          <div className="spinner"></div>
          <p>Signing you in...</p>
        </div>
      )}

      <div className="auth-card">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="auth-title"
        >
          Welcome Back
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="auth-subtitle"
        >
          Sign in to your MovieVerse account
        </motion.p>

        <form onSubmit={handleLogin} className="auth-form">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="error-message"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="input-group"
          >
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="input-group password-input"
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                }`}
              ></i>
            </button>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`auth-btn ${loading ? "loading" : ""}`}
          >
            {loading ? <div className="btn-spinner"></div> : "Sign In"}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="auth-footer"
        >
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
