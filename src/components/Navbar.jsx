import "./Navbar.css";
import { Link, useLocation } from "react-router-dom";

export const Navbar = () => {
  const location = useLocation();

  return (
    <div className="Pages-cont">
      <nav>
        <ul>
          <li
            data-tooltip="Home"
            className={location.pathname === "/" ? "active" : ""}
          >
            <Link to="/">
              <i className="fas fa-home"></i>
            </Link>
          </li>

          <li
            data-tooltip="Favorites"
            className={location.pathname === "/favorites" ? "active" : ""}
          >
            <Link to="/favorites">
              <i className="fas fa-heart"></i>
            </Link>
          </li>

          <li
            data-tooltip="Profile"
            className={location.pathname === "/account" ? "active" : ""}
          >
            <Link to="/account">
              <i className="fas fa-user"></i>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};
