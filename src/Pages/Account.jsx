import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Account.css";
import BG from "../assets/BG.jpeg";
import avater from "../assets/avatar.png";
import { auth, storage } from "../firebase/config";
import {
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "../context/WatchlistContext";
import { useFavorites } from "../context/FavoritesContext";
import { MovieDetails } from "../components/MovieDetails";

export const Account = () => {
  // ✅ MOVIE DETAILS STATES
  const [isMovieDetailsActive, setIsMovieDetailsActive] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  // ✅ ADULT CONTENT PREFERENCES STATE
  const [userPreferences, setUserPreferences] = useState({
    adultContent: false,
    autoplayTrailers: true,
  });

  // EXISTING ACCOUNT STATE VARIABLES
  const [activeModal, setActiveModal] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    totalWatched: 0,
    totalWatchTime: 0,
    favoriteGenre: "Action",
  });

  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState("light");
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const { watchlist, clearWatchlist } = useWatchlist();
  const { favorites, clearFavorites } = useFavorites();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [pendingAdultContent, setPendingAdultContent] = useState(false);

  const updateAdultContentPreference = (allowAdult) => {
    const newPreferences = {
      ...userPreferences,
      adultContent: allowAdult,
    };
    setUserPreferences(newPreferences);
    if (user) {
      localStorage.setItem(
        `userPreferences_${user.uid}`,
        JSON.stringify(newPreferences)
      );
    }
    showToast(allowAdult ? "Adult content enabled" : "Adult content disabled");
  };

  const handleAdultContentToggle = (allowAdult) => {
    if (allowAdult && !userPreferences.adultContent) {
      setPendingAdultContent(true);
      setShowAgeVerification(true);
    } else {
      updateAdultContentPreference(false);
    }
  };

  const removeDuplicateMovies = (movies) => {
    const seen = new Set();
    return movies.filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });
  };

  const themes = [
    { id: "light", name: "Light Mode", type: "mode", accent: "#fff" },
    { id: "dark", name: "Dark Mode", type: "mode", accent: "#000" },
    { id: "blue", name: "Ocean Blue", type: "color", accent: "#3b82f6" },
    { id: "green", name: "Forest Green", type: "color", accent: "#10b981" },
    { id: "purple", name: "Royal Purple", type: "color", accent: "#8b5cf6" },
    { id: "orange", name: "Sunset Orange", type: "color", accent: "#f59e0b" },
    { id: "pink", name: "Blush Pink", type: "color", accent: "#ec4899" },
    { id: "red", name: "Crimson Red", type: "color", accent: "#ef4444" },
  ];

  // ✅ Upload to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw error;
    }
  };

  const getProfilePhoto = () => {
    if (!user) return BG;
    if (user?.photoURL) return user.photoURL;
    return BG;
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleMovieClick = (movieId) => {
    setSelectedMovieId(movieId);
    setIsMovieDetailsActive(true);
  };

  const handleBackFromMovieDetails = () => {
    setIsMovieDetailsActive(false);
    setSelectedMovieId(null);
  };

  const recentMovies = watchlist.slice(-4).reverse();

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
    const savedTheme = localStorage.getItem("movieApp-theme") || "light";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
    fetchTrendingMovies();
    const savedPreferences = localStorage.getItem(
      `userPreferences_${currentUser?.uid}`
    );
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const fetchTrendingMovies = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }`
      );
      const data = await response.json();
      const uniqueMovies = removeDuplicateMovies(data.results.slice(0, 4));
      setTrendingMovies(uniqueMovies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const applyTheme = (themeId) => {
    setCurrentTheme(themeId);
    themes.forEach((theme) => {
      document.body.classList.remove(`theme-${theme.id}`);
    });
    document.body.classList.add(`theme-${themeId}`);
    localStorage.setItem("movieApp-theme", themeId);
  };

  useEffect(() => {
    if (watchlist && favorites) {
      calculateUserStats();
    }
  }, [watchlist, favorites]);

  const calculateUserStats = () => {
    const allItems = [...watchlist, ...favorites].filter(
      (movie, index, self) =>
        index === self.findIndex((m) => m.movieId === movie.movieId)
    );
    const totalWatched = allItems.length;
    const totalWatchTime = Math.round(totalWatched * 2);
    setUserStats({ totalWatched, totalWatchTime, favoriteGenre: "Action" });
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const reauthenticateUser = async (password) => {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const handleDangerAction = (action) => {
    setConfirmAction(action);
  };

  const confirmDangerAction = async () => {
    try {
      switch (confirmAction) {
        case "deleteData":
          await deleteAllUserData();
          break;
        case "deactivate":
          await deactivateAccount();
          break;
        case "deleteAccount":
          await deleteUserAccount();
          break;
      }
      setConfirmAction(null);
      setConfirmInput("");
      setCurrentPassword("");
    } catch (error) {
      console.error("Danger action failed:", error);
      showToast(`Error: ${error.message}`);
    }
  };

  const deleteAllUserData = async () => {
    try {
      if (clearWatchlist) await clearWatchlist();
      if (clearFavorites) await clearFavorites();
      localStorage.removeItem("userProfilePhoto");
      showToast("All your data has been cleared! 🗑️");
      setUserStats({
        totalWatched: 0,
        totalWatchTime: 0,
        favoriteGenre: "None",
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      showToast("Error clearing data");
    }
  };

  const deactivateAccount = async () => {
    await signOut(auth);
    showToast("Account deactivated. You can log back in anytime! 👋");
    navigate("/login");
  };

  const deleteUserAccount = async () => {
    await reauthenticateUser(currentPassword);
    await user.delete();
    showToast("Account permanently deleted. Goodbye! 👋");
    navigate("/login");
  };

  const getJoinDate = () => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).getFullYear().toString();
    }
    return "2025";
  };

  const getDisplayName = () => {
    return user?.displayName || user?.email?.split("@")[0] || "Guest User";
  };

  const getEmail = () => {
    return user?.email || "guest@example.com";
  };

  // ✅ MODAL COMPONENT (FIXED)
  const renderModal = () => {
    if (!activeModal) return null;

    const handleClose = () => {
      setActiveModal(null);
      setNewUsername("");
      setNewEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfilePhoto(null);
      setLoadingAction(false);
    };

    const handleSave = async () => {
      setLoadingAction(true);
      try {
        switch (activeModal) {
          case "username":
            if (!newUsername.trim())
              throw new Error("Username cannot be empty");
            await updateProfile(auth.currentUser, { displayName: newUsername });
            setUser({ ...user, displayName: newUsername });
            showToast("Username updated successfully! 🎉");
            break;

          case "email":
            if (!newEmail.trim()) throw new Error("Email cannot be empty");
            if (!currentPassword)
              throw new Error("Please enter your current password");
            await reauthenticateUser(currentPassword);
            await updateEmail(auth.currentUser, newEmail);
            setUser({ ...user, email: newEmail });
            showToast("Email updated successfully! 📧");
            break;

          case "password":
            if (!newPassword || !confirmPassword)
              throw new Error("Please fill in all password fields");
            if (newPassword !== confirmPassword)
              throw new Error("Passwords don't match");
            if (!currentPassword)
              throw new Error("Please enter your current password");
            await reauthenticateUser(currentPassword);
            await updatePassword(auth.currentUser, newPassword);
            showToast("Password updated successfully! 🔐");
            break;

          case "photo":
            if (profilePhoto) {
              showToast("Uploading photo...");
              const cloudinaryUrl = await uploadToCloudinary(profilePhoto);
              await updateProfile(auth.currentUser, {
                photoURL: cloudinaryUrl,
              });
              setUser({ ...user, photoURL: cloudinaryUrl });
              showToast("Profile photo updated! 📸");
            }
            break;
        }
        handleClose();
      } catch (error) {
        console.error("Update error:", error);
        showToast(`Error: ${error.message}`);
      } finally {
        setLoadingAction(false);
      }
    };

    const canSave = () => {
      switch (activeModal) {
        case "username":
          return newUsername.trim().length > 0;
        case "email":
          return newEmail.trim().length > 0 && currentPassword.length > 0;
        case "password":
          return (
            newPassword.length > 0 &&
            confirmPassword.length > 0 &&
            currentPassword.length > 0 &&
            newPassword === confirmPassword
          );
        case "photo":
          return profilePhoto !== null;
        default:
          return false;
      }
    };

    return (
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>
              {activeModal === "username" && "Change Username"}
              {activeModal === "email" && "Change Email"}
              {activeModal === "password" && "Change Password"}
              {activeModal === "photo" && "Change Profile Photo"}
            </h3>
            <button className="modal-close" onClick={handleClose}>
              ×
            </button>
          </div>

          <div className="modal-body">
            {activeModal === "username" && (
              <div className="input-group">
                <label>New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                />
              </div>
            )}

            {activeModal === "email" && (
              <>
                <div className="input-group">
                  <label>New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                  />
                </div>
                <div className="input-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password for security"
                  />
                </div>
              </>
            )}

            {activeModal === "password" && (
              <>
                <div className="input-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="input-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}

            {activeModal === "photo" && (
              <div className="input-group">
                <label>Upload Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files[0])}
                />
                {profilePhoto && (
                  <div className="photo-preview">
                    <img
                      src={URL.createObjectURL(profilePhoto)}
                      alt="Preview"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={loadingAction || !canSave()}
            >
              {loadingAction ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Confirmation Modal for Danger Zone
  const renderConfirmationModal = () => {
    if (!confirmAction) return null;

    const getModalConfig = () => {
      switch (confirmAction) {
        case "deleteData":
          return {
            title: "Delete All Data",
            message:
              "This will permanently remove your watch history, favorites, and preferences. This action cannot be undone!",
            confirmText: "DELETE ALL DATA",
            inputLabel: "Type 'DELETE MY DATA' to confirm",
            confirmMatch: "DELETE MY DATA",
            buttonClass: "delete-data",
          };
        case "deactivate":
          return {
            title: "Deactivate Account",
            message:
              "Your account will be temporarily disabled. You can reactivate by logging back in anytime.",
            confirmText: "DEACTIVATE ACCOUNT",
            inputLabel: "Type 'DEACTIVATE' to confirm",
            confirmMatch: "DEACTIVATE",
            buttonClass: "deactivate",
          };
        case "deleteAccount":
          return {
            title: "Delete Account",
            message:
              "This will permanently delete your account and all data. This action cannot be undone!",
            confirmText: "DELETE ACCOUNT FOREVER",
            inputLabel: "Type 'DELETE FOREVER' to confirm",
            confirmMatch: "DELETE FOREVER",
            buttonClass: "delete-account",
          };
        default:
          return {};
      }
    };

    const config = getModalConfig();
    const canConfirm = confirmInput === config.confirmMatch;

    return (
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setConfirmAction(null)}
      >
        <motion.div
          className="modal-content danger-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header danger-header">
            <h3>⚠️ {config.title}</h3>
            <button
              className="modal-close"
              onClick={() => setConfirmAction(null)}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="danger-warning">
              <div className="warning-icon">🚨</div>
              <p>{config.message}</p>
            </div>

            <div className="input-group">
              <label>{config.inputLabel}</label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={config.confirmMatch}
                className={!canConfirm && confirmInput ? "input-error" : ""}
              />
            </div>

            {confirmAction === "deleteAccount" && (
              <div className="input-group">
                <label>Current Password (Required for security)</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setConfirmAction(null);
                setConfirmInput("");
                setCurrentPassword("");
              }}
            >
              Cancel
            </button>
            <button
              className={`btn-save ${config.buttonClass}`}
              onClick={confirmDangerAction}
              disabled={
                !canConfirm ||
                (confirmAction === "deleteAccount" && !currentPassword)
              }
            >
              {config.confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Age Verification Modal
  const renderAgeVerificationModal = () => {
    if (!showAgeVerification) return null;

    const handleConfirm = (isAdult) => {
      if (isAdult) {
        updateAdultContentPreference(true);
        showToast("Adult content enabled for 18+ users");
      } else {
        showToast("Adult content is restricted to users 18+");
      }
      setShowAgeVerification(false);
      setPendingAdultContent(false);
    };

    return (
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setShowAgeVerification(false)}
      >
        <motion.div
          className="modal-content age-verification-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header age-verification-header">
            <h3>🔞 Age Verification Required</h3>
            <button
              className="modal-close"
              onClick={() => setShowAgeVerification(false)}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="age-warning">
              <div className="warning-icon">⚠️</div>
              <h4>Adult Content Restriction</h4>
              <p>
                This setting enables content that may not be suitable for
                viewers under 18 years old, including explicit language, mature
                themes, and adult situations.
              </p>
              <div className="age-requirements">
                <p>
                  <strong>By enabling this feature, you confirm that:</strong>
                </p>
                <ul>
                  <li>• You are 18 years of age or older</li>
                  <li>• You wish to view adult-oriented content</li>
                  <li>
                    • You understand this content may not be suitable for all
                    audiences
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="modal-actions age-verification-actions">
            <button
              className="btn-cancel age-reject"
              onClick={() => handleConfirm(false)}
            >
              I'm Under 18
            </button>
            <button
              className="btn-save age-confirm"
              onClick={() => handleConfirm(true)}
            >
              I'm 18 or Older
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <motion.div className="acct-header">
        <motion.p className="logo">My Account</motion.p>
        <motion.div
          className="log-out-btn"
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ cursor: "pointer" }}
        >
          Sign Out <i className="fa-solid fa-right-from-bracket"></i>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isMovieDetailsActive ? (
          <MovieDetails
            onBack={handleBackFromMovieDetails}
            movieId={selectedMovieId}
          />
        ) : (
          <motion.div className="acct-content">
            {toast.show && (
              <motion.div
                className="toast"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                {toast.message}
              </motion.div>
            )}

            <section className="main-sec-2">
              <div className="account-billboard">
                <div className="account-info">
                  <img
                    src={getProfilePhoto()}
                    alt="profile"
                    className="account-avatar"
                  />
                  <div className="account-det">
                    <h2 className="account-name">{getDisplayName()}</h2>
                    <p className="account-email">{getEmail()}</p>
                    <p className="account-joined">
                      Member since: {getJoinDate()}
                    </p>
                  </div>
                </div>
                <div className="acct-img">
                  <img src={avater} alt="User avatar" />
                </div>
              </div>

              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa-solid fa-film"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{loading ? "..." : userStats.totalWatched}</h3>
                    <p>Movies & Shows Saved</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa-solid fa-clock"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{loading ? "..." : userStats.totalWatchTime}h</h3>
                    <p>Estimated Watch Time</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa-solid fa-heart"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{loading ? "..." : userStats.favoriteGenre}</h3>
                    <p>Favorite Genre</p>
                  </div>
                </div>
              </div>

              <div className="preferences-panel">
                <h2>Preferences</h2>
                <div className="preference-group">
                  <h3>Theme</h3>
                  <div className="theme-options">
                    {themes.map((theme) => (
                      <motion.div
                        key={theme.id}
                        className={`theme-option ${
                          currentTheme === theme.id ? "active" : ""
                        }`}
                        onClick={() => applyTheme(theme.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          cursor: "pointer",
                          border:
                            currentTheme === theme.id
                              ? `2px solid ${theme.accent}`
                              : "2px solid transparent",
                        }}
                      >
                        <div
                          className="theme-color-preview"
                          style={{ backgroundColor: theme.accent }}
                        />
                        {theme.name}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="preference-group">
                  <h3>Autoplay</h3>
                  <label className="switch-option">
                    <input type="checkbox" defaultChecked readOnly />
                    <span>Autoplay trailers</span>
                  </label>
                </div>

                <div className="preference-group">
                  <h3>Content Preferences</h3>
                  <label className="switch-option">
                    <input
                      type="checkbox"
                      checked={userPreferences?.adultContent || false}
                      onChange={(e) =>
                        handleAdultContentToggle(e.target.checked)
                      }
                    />
                    <span>Allow Adult Content (18+)</span>
                  </label>
                  <p className="preference-description">
                    When enabled, search results may include adult content
                  </p>
                </div>
              </div>

              <div className="recently-watched">
                <div className="watchlist-title-bar">
                  <h2>Recently Saved</h2>
                  {watchlist.length > 0 && (
                    <span
                      className="items-count"
                      style={{
                        cursor: "pointer",
                        color: "var(--accent-solid)",
                      }}
                      onClick={() => navigate("/watchlist")}
                    >
                      {watchlist.length} items
                    </span>
                  )}
                </div>

                {recentMovies.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎬</div>
                    <h3>No Movies Saved Yet</h3>
                    <p>Start adding movies to your watchlist</p>
                    <button
                      className="security-btn"
                      onClick={() => navigate("/")}
                      style={{ marginTop: "1rem" }}
                    >
                      Browse Movies
                    </button>
                  </div>
                ) : (
                  <div className="watched-grid">
                    {recentMovies.map((movie, index) => (
                      <motion.div
                        key={`recent_${movie.movieId}_${index}`}
                        className="watched-item"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMovieClick(movie.movieId)}
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={
                            movie.poster_path
                              ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                              : "/placeholder-poster.jpg"
                          }
                          alt={movie.title}
                        />
                        <div className="watched-info">
                          <h4>{movie.title}</h4>
                          <p>
                            {index === 0
                              ? "Recently added"
                              : index === 1
                              ? "Added recently"
                              : index === 2
                              ? "Added earlier"
                              : "Previously added"}
                          </p>
                          {movie.vote_average && (
                            <div className="movie-rating">
                              ⭐ {movie.vote_average.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hot-takes">
                <div className="watchlist-title-bar">
                  <h2>Hot Takes For You 🔥</h2>
                  <span className="items-count">Trending This Week</span>
                </div>

                {loadingTrending ? (
                  <div className="loading-state">
                    Loading trending movies...
                  </div>
                ) : trendingMovies.length > 0 ? (
                  <div className="watched-grid">
                    {trendingMovies.map((movie, index) => (
                      <motion.div
                        key={`trending_${movie.id}_${index}`}
                        className="watched-item"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMovieClick(movie.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={
                            movie.poster_path
                              ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                              : "/placeholder-poster.jpg"
                          }
                          alt={movie.title}
                        />
                        <div className="watched-info">
                          <h4>{movie.title}</h4>
                          <p>Trending now</p>
                          <div className="movie-rating">
                            ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📡</div>
                    <h3>No Trending Data</h3>
                    <p>Check your Network connection</p>
                  </div>
                )}
              </div>

              <div className="security-settings" id="security">
                <div className="security-header">
                  <h2>Account Security</h2>
                  <div className="security-icon">🔒</div>
                </div>

                <div className="security-options">
                  <div className="security-item">
                    <div className="security-info">
                      <h4>Profile Photo</h4>
                      <p>Update your profile picture</p>
                    </div>
                    <button
                      className="security-btn"
                      onClick={() => setActiveModal("photo")}
                    >
                      Change
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h4>Change Username</h4>
                      <p>Update your display name</p>
                    </div>
                    <button
                      className="security-btn"
                      onClick={() => setActiveModal("username")}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h4>Change Email</h4>
                      <p>Update your email address</p>
                    </div>
                    <button
                      className="security-btn"
                      onClick={() => setActiveModal("email")}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="security-info">
                      <h4>Change Password</h4>
                      <p>Update your password</p>
                    </div>
                    <button
                      className="security-btn"
                      onClick={() => setActiveModal("password")}
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>

              <div className="danger-zone">
                <div className="danger-header">
                  <h2>Danger Zone</h2>
                  <div className="danger-icon">⚠️</div>
                </div>

                <div className="danger-actions">
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete All Data</h4>
                      <p>
                        Permanently remove your watch history, favorites, and
                        preferences
                      </p>
                    </div>
                    <button
                      className="danger-btn delete-data"
                      onClick={() => handleDangerAction("deleteData")}
                    >
                      Delete Data
                    </button>
                  </div>

                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Deactivate Account</h4>
                      <p>
                        Temporarily disable your account. You can reactivate
                        anytime
                      </p>
                    </div>
                    <button
                      className="danger-btn deactivate"
                      onClick={() => handleDangerAction("deactivate")}
                    >
                      Deactivate
                    </button>
                  </div>

                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Delete Account</h4>
                      <p>
                        Permanently delete your account and all data. This
                        action cannot be undone
                      </p>
                    </div>
                    <button
                      className="danger-btn delete-account"
                      onClick={() => handleDangerAction("deleteAccount")}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {renderAgeVerificationModal()}
            {renderModal()}
            {renderConfirmationModal()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
