import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiBell, FiLogOut } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { RiHome2Line, RiChat3Line, RiCompassLine } from "react-icons/ri";
import { TbMessagePlus } from "react-icons/tb";
import { io } from "socket.io-client";
import axios from "axios";
import logo from "../assets/helpHive_logo.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [socket, setSocket] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Load user from localStorage safely
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // Update login status
    setIsLoggedIn(!!token);

    // Safely parse user data
    try {
      if (userData && userData !== "undefined" && userData !== "null") {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("❌ Error parsing user from localStorage:", err);
      setUser(null);
    }
  }, [location.pathname]); // re-check when route changes

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Fetch unread notifications count
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUnreadCount();
    }
  }, [isLoggedIn, user]);

  // Set up Socket.IO for real-time notifications
  useEffect(() => {
    if (isLoggedIn && user) {
      const newSocket = io(API_BASE);
      setSocket(newSocket);

      // Join user's room for notifications
      newSocket.emit('joinRoom', user._id || user.id);

      // Listen for new notifications
      newSocket.on('newNotification', (data) => {
        console.log('New notification received:', data);
        setUnreadNotifications(prev => prev + 1);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isLoggedIn, user, API_BASE]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifications(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const handleProfileNavigation = () => {
    closeMenu();
    if (user && (user._id || user.id)) {
      navigate(`/profile/${user._id || user.id}`);
    }
  };

  const renderUserProfile = () => (
    <Link
  to={`/profile/${user?._id || user?.id}`}
  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
>

      {user?.profilePic ? (
        <img
          src={user.profilePic}
          alt="Profile"
          className="w-6 h-6 rounded-full"
        />
      ) : (
        <FaUserCircle className="text-xl" />
      )}
      <span>{user?.username || "Guest"}</span>
    </Link>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <img src={logo} alt="HelpHive" className="w-8 h-8" />
          <span className="text-xl font-semibold text-gray-800">HelpHive</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
            <RiHome2Line /> Home
          </Link>
          <Link to="/explore" className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
            <RiCompassLine /> Explore
          </Link>
          <Link to="/post-help" className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
            <TbMessagePlus /> Post Help
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/chat" className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
                <RiChat3Line /> Chat
              </Link>
              <Link to="/notifications" className="relative text-gray-700 hover:text-blue-600">
                <FiBell className="text-xl" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
              {renderUserProfile()}
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-gray-700 hover:text-red-500 text-xl"
              >
                <FiLogOut />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-2xl text-gray-700">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link to="/" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Home
          </Link>
          <Link to="/explore" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Explore
          </Link>
          <Link to="/post-help" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Post Help
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/chat" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
                Chat
              </Link>
              <Link to="/notifications" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
                Notifications
              </Link>
              <Link
  to={`/profile/${user?._id || user?.id}`}
  onClick={closeMenu}
  className="block text-gray-700 hover:text-blue-600"
>
  Profile
</Link>

              <button
                onClick={() => { closeMenu(); handleLogout(); }}
                className="text-red-500 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="block text-white bg-blue-600 rounded px-3 py-1 hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
