import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { Navbar } from "./components/Navbar";
import { Home } from "./Pages/Home";
import { Favorites } from "./Pages/Favourites";
import { Account } from "./Pages/Account";
import { Login } from "./components/Login";
import { Signup } from "./components/signUp";
import { WatchlistProvider } from "./context/WatchlistContext";
import { FavoritesProvider } from "./context/FavoritesContext";

function App() {
  const [activeCategory, setActiveCategory] = useState("Movies");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState("blue");

  // Theme options
  const themes = [
    { id: "blue", name: "Ocean Blue", bg: "blue-bg.jpg", accent: "#3b82f6" },
    {
      id: "green",
      name: "Forest Green",
      bg: "green-bg.jpg",
      accent: "#10b981",
    },
    {
      id: "purple",
      name: "Royal Purple",
      bg: "purple-bg.jpg",
      accent: "#8b5cf6",
    },
    {
      id: "orange",
      name: "Sunset Orange",
      bg: "orange-bg.jpg",
      accent: "#f59e0b",
    },
    { id: "pink", name: "Blush Pink", bg: "pink-bg.jpg", accent: "#ec4899" },
    { id: "red", name: "Crimson Red", bg: "red-bg.jpg", accent: "#ef4444" },
    { id: "light", name: "Light Mode", bg: "light-bg.jpg", accent: "#007AFF" },
  ];

  // Apply theme function
  const applyTheme = (themeId) => {
    setCurrentTheme(themeId);
    themes.forEach((theme) => {
      document.body.classList.remove(`theme-${theme.id}`);
    });
    document.body.classList.add(`theme-${themeId}`);
    localStorage.setItem("movieApp-theme", themeId);
  };

  // Clear user-specific data when user logs out
  const clearUserData = () => {
    // Clear all localStorage items that could be user-specific
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes("userProfilePhoto") || key.includes("movieApp-theme")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  // Check if user is logged in and load saved theme
  useEffect(() => {
    const handleAuthStateChange = (user) => {
      setUser(user);
      setLoading(false);

      if (!user) {
        // Clear data when user logs out
        clearUserData();
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    //  TAB SYNCHRONIZATION: Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "firebase:authUser") {
        // Force re-check of auth state when another tab changes user
        onAuthStateChanged(auth, (currentUser) => {
          if (currentUser?.uid !== user?.uid) {
            setUser(currentUser);
          }
        });
      }
    };

    // TAB SYNCHRONIZATION: Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check if auth state changed
        onAuthStateChanged(auth, (currentUser) => {
          if (currentUser?.uid !== user?.uid) {
            setUser(currentUser);
          }
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Load saved theme
    const savedTheme = localStorage.getItem("movieApp-theme") || "blue";
    setCurrentTheme(savedTheme);
    setTimeout(() => applyTheme(savedTheme), 100);

    // Cleanup all listeners
    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]); // Added user dependency to track changes

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading MovieVerse...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <WatchlistProvider>
        <FavoritesProvider>
          <div className="app">
            {/* Only show navbar if user is logged in */}
            {user && <Navbar />}

            <main className="content">
              <Routes>
                {/* Auth Routes - only accessible when NOT logged in */}
                <Route
                  path="/login"
                  element={!user ? <Login /> : <Navigate to="/" />}
                />
                <Route
                  path="/signup"
                  element={!user ? <Signup /> : <Navigate to="/" />}
                />

                {/* Protected Routes - only accessible when logged in */}
                <Route
                  path="/"
                  element={
                    user ? (
                      <Home
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        user={user}
                      />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route
                  path="/favorites"
                  element={user ? <Favorites /> : <Navigate to="/login" />}
                />

                <Route
                  path="/account"
                  element={user ? <Account /> : <Navigate to="/login" />}
                />

                {/* Redirect any unknown routes */}
                <Route
                  path="*"
                  element={<Navigate to={user ? "/" : "/login"} />}
                />
              </Routes>
            </main>
          </div>
        </FavoritesProvider>
      </WatchlistProvider>
    </BrowserRouter>
  );
}

export default App;
