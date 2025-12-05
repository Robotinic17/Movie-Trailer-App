import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./FavHeader.css";

export const FavHeader = ({ activeTab, setActiveTab }) => {
  // RECEIVE PROPS
  const navItems = ["My List", "Watch History", "Recommendations"];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.3, duration: 0.8, ease: "easeOut" },
    }),
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (item) => {
    setActiveTab(item);
    setIsMenuOpen(false);
  };

  return (
    <div className="fav-header">
      <motion.div
        id="top"
        className="logo"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        My Favourites
      </motion.div>

      <div className="nav">
        <ul>
          {navItems.map((item, i) => (
            <motion.li
              key={item}
              custom={i}
              variants={navVariants}
              initial="hidden"
              animate="visible"
              onClick={() => setActiveTab(item)}
              className={activeTab === item ? "active" : ""}
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Hamburger Menu Button - Only visible at 500px */}
      <motion.div
        className="fav-menu-btn"
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
            className="fav-mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMenuOpen(false)}
          >
            {/* Mobile Menu Content */}
            <motion.div
              className="fav-mobile-menu-content"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Navigation Links */}
              <ul className="fav-mobile-nav-links">
                {navItems.map((item, i) => (
                  <li
                    key={item}
                    className={activeTab === item ? "active" : ""}
                    onClick={() => handleNavClick(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
