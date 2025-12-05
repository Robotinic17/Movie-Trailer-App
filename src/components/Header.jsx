import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import BG from "../assets/BG.jpeg";
import { motion, AnimatePresence } from "framer-motion";
import "./Header.css";

export const Header = ({
  activeCategory,
  setActiveCategory,
  user,
  isSearchActive,
  setIsSearchActive,
  searchQuery,
  setSearchQuery,
}) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside (only if menu is not open)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && !e.target.closest(".user-profile")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setIsMenuOpen(false);
  };

  const categories = ["Movies", "TV Series", "Animation", "Mystery", "K-Drama"];

  const getUserName = () => {
    return user?.displayName || user?.email?.split("@")[0] || "User";
  };

  const getProfilePhoto = () => {
    if (!user) return BG;
    const userKey = `userProfilePhoto_${user.uid}`;
    const localPhoto = localStorage.getItem(userKey);
    if (localPhoto) return localPhoto;
    if (user?.photoURL) {
      localStorage.setItem(userKey, user.photoURL);
      return user.photoURL;
    }
    return BG;
  };

  return (
    <motion.header
      className={`header ${scrolled ? "scrolled" : ""}`}
      layout
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Search Bar */}
      <motion.div
        className="search-bar"
        animate={{
          scale: isSearchActive ? 1.05 : 1,
          marginRight: isSearchActive ? "auto" : "0",
        }}
        transition={{ duration: 0.3 }}
      >
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder={`Search ${activeCategory.toLowerCase()}...`}
          onFocus={() => setIsSearchActive(true)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </motion.div>

      {/* Desktop Navigation - Hidden on mobile */}
      {!isSearchActive && (
        <ul className="nav-links">
          {categories.map((item) => (
            <li
              key={item}
              className={item === activeCategory ? "active" : ""}
              onClick={() => setActiveCategory(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* User Section */}
      {!isSearchActive && (
        <div className="user-section">
          {user ? (
            <>
              <div className="user-profile" onClick={() => setOpen(!open)}>
                <img
                  src={getProfilePhoto()}
                  alt="User"
                  onError={(e) => {
                    e.target.src = BG;
                  }}
                />
                <span>{getUserName()}</span>
                <i
                  className={`fa-solid fa-chevron-${open ? "up" : "down"}`}
                ></i>
              </div>

              {open && (
                <ul className="dropdown-menu">
                  <li onClick={() => navigate("/account")}>
                    <i className="fa-solid fa-user"></i> Profile
                  </li>
                  <li
                    onClick={() => {
                      navigate("/account#security");
                      setOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-gear"></i> Settings
                  </li>
                  <li onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i> Log Out
                  </li>
                </ul>
              )}
            </>
          ) : (
            <div className="auth-buttons">
              <button className="login-btn" onClick={handleLogin}>
                Log In
              </button>
              <button className="signup-btn" onClick={handleSignup}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hamburger Menu Button - Only visible on mobile */}
      <motion.div
        className="menu-btn"
        onClick={toggleMenu}
        whileTap={{ scale: 0.95 }}
      >
        <motion.i
          className={`fa-solid ${isMenuOpen ? "fa-xmark" : "fa-bars"}`}
          animate={{
            rotate: isMenuOpen ? 180 : 0,
            scale: isMenuOpen ? 1.2 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMenuOpen(false)}
          >
            {/* Mobile Menu Content */}
            <motion.div
              className="mobile-menu-content"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Navigation Links */}
              <ul className="mobile-nav-links">
                {categories.map((item) => (
                  <li
                    key={item}
                    className={item === activeCategory ? "active" : ""}
                    onClick={() => handleCategoryClick(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>

              {/* Mobile User Info */}
              {user ? (
                <div className="mobile-user-info">
                  <img
                    src={getProfilePhoto()}
                    alt="User"
                    onError={(e) => {
                      e.target.src = BG;
                    }}
                  />
                  <span>{getUserName()}</span>
                </div>
              ) : (
                <div className="mobile-auth">
                  <button onClick={handleLogin}>Log In</button>
                  <button onClick={handleSignup}>Sign Up</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
