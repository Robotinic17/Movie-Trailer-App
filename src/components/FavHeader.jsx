import { motion } from "framer-motion";
import "./FavHeader.css";

export const FavHeader = ({ activeTab, setActiveTab }) => {
  // RECEIVE PROPS
  const navItems = ["My List", "Watch History", "Recommendations"];

  const navVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.3, duration: 0.8, ease: "easeOut" },
    }),
  };

  return (
    <div className="fav-header">
      <motion.div
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
              onClick={() => setActiveTab(item)} // USE setActiveTab PROP
              className={activeTab === item ? "active" : ""} // USE activeTab PROP
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};
