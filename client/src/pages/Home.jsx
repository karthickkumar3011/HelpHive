// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import PostCard from "../components/PostCard";
import TagsBar from "../components/TagsBar";
import Suggestions from "../components/Suggestions";
import { useAuth } from "../context/AuthContext";
import { Frown } from "lucide-react";
import { MdVolunteerActivism } from "react-icons/md"; // Attractive helping icon

const Home = () => {
  const [posts, setPosts] = useState([]);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen pt-4 px-4 md:px-8">
      {/* Welcome Banner */}
      <div className="mb-6 bg-yellow-100 text-yellow-900 p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Welcome to HelpHive{" "}
          <MdVolunteerActivism
            size={28}
            className="text-yellow-600 transition-transform duration-300 hover:scale-110"
          />
        </h1>
        <p className="text-sm mt-1">
          Connecting helpers and seekers, one post at a time.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Feed */}
        <div className="md:col-span-8 space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                refreshPosts={fetchPosts}
                currentUser={user}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 flex items-center justify-center gap-1">
              No posts available right now <Frown size={16} />
            </p>
          )}
        </div>

        {/* Right: Tags & Suggestions */}
        <div className="md:col-span-4 space-y-4">
          <TagsBar />
          <Suggestions />
        </div>
      </div>
    </div>
  );
};

export default Home;
