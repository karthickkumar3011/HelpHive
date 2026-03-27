import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Redirects /profile → /profile/:currentUserId (Profile expects :id in the URL).
 */
const ProfileRedirect = () => {
  const { user, token } = useAuth();
  const id = user?._id || user?.id;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!id) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-gray-600 px-4">
        <p>Could not load your profile link.</p>
        <p className="text-sm">Try logging out and signing in again.</p>
      </div>
    );
  }

  return <Navigate to={`/profile/${id}`} replace />;
};

export default ProfileRedirect;
