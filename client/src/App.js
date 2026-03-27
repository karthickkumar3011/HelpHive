// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Explore from './pages/Explore';
import PostHelp from './pages/PostHelp';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Notifications from './pages/Notifications';
import PrivateRoute from './components/PrivateRoute';
import ProfileRedirect from './components/ProfileRedirect';
import Hives from './pages/Hives';
import HiveDetails from './pages/HiveDetails';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:receiverId" element={<Chat />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/home" element={<Home />} />



        {/* 🔐 Protected Routes */}
        <Route
          path="/post-help"
          element={
            <PrivateRoute>
              <PostHelp />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfileRedirect />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />

        {/* 🔐 Hives (communities) */}
        <Route
          path="/hives"
          element={
            <PrivateRoute>
              <Hives />
            </PrivateRoute>
          }
        />
        <Route
          path="/hives/:hiveId"
          element={
            <PrivateRoute>
              <HiveDetails />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
