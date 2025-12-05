import { motion } from "framer-motion";
import "./WatchHistory.css";

export const WatchHistory = () => {
  return (
    <motion.div
      className="watch-history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="empty-state">
        <div className="empty-icon">⏰</div>
        <h3>No watch history yet</h3>
        <p>Movies and shows you watch will appear here</p>
      </div>
    </motion.div>
  );
};
