// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import TagsBar from "../components/TagsBar";
import Suggestions from "../components/Suggestions";
import { useAuth } from "../context/AuthContext";
import { Frown } from "lucide-react";
import { MdVolunteerActivism } from "react-icons/md"; // Attractive helping icon

const normalizeTag = (t) => String(t || "").trim().toLowerCase();

const Home = () => {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTag, setSelectedTag] = useState("All");
  const [mode, setMode] = useState("all"); // "all" | "nearby"

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const coords = user?.location?.coordinates;
  // GeoJSON order: [lng, lat]
  const hasCoords = Array.isArray(coords) && coords.length >= 2;
  const lat = hasCoords ? coords[1] : null;
  const lng = hasCoords ? coords[0] : null;

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "nearby") {
        if (!hasCoords) {
          setPosts([]);
          setError("Your location is not available. Enable location during registration.");
          return;
        }

        const res = await axios.get(
          `${API_BASE}/api/posts/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        const data = Array.isArray(res.data) ? res.data : [];
        const selected = normalizeTag(selectedTag);
        const filtered =
          selectedTag === "All"
            ? data
            : data.filter((p) =>
                (p.tags || []).some((t) => normalizeTag(t) === selected)
              );

        setPosts(filtered);
      } else {
        // mode === "all"
        const tagQuery =
          selectedTag && selectedTag !== "All"
            ? `?tag=${encodeURIComponent(selectedTag)}`
            : "";

        const res = await axios.get(`${API_BASE}/api/posts${tagQuery}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = Array.isArray(res.data) ? res.data : [];
        // Safety local filter in case server filtering differs.
        const selected = normalizeTag(selectedTag);
        const filtered =
          selectedTag === "All"
            ? data
            : data.filter((p) =>
                (p.tags || []).some((t) => normalizeTag(t) === selected)
              );

        setPosts(filtered);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedTag, hasCoords]);

  const postHighlightId = searchParams.get("post");

  useEffect(() => {
    if (!postHighlightId || loading || posts.length === 0) return;
    const el = document.getElementById(`post-card-${postHighlightId}`);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(t);
  }, [postHighlightId, posts, loading]);

  const refreshPosts = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                mode === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setMode("nearby")}
              disabled={!hasCoords}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                mode === "nearby"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              } ${!hasCoords ? "opacity-50 cursor-not-allowed" : ""}`}
              title={!hasCoords ? "Location not available" : "Show nearby posts"}
            >
              Nearby Posts
            </button>
            <button
              type="button"
              onClick={refreshPosts}
              disabled={loading || refreshing}
              className="px-4 py-2 rounded-lg font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                refreshPosts={refreshPosts}
                currentUser={user}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 flex items-center justify-center gap-1">
              {selectedTag !== "All" ? (
                <>
                  No posts found for{" "}
                  <span className="font-semibold text-gray-700">
                    #{selectedTag}
                  </span>{" "}
                  <Frown size={16} />
                </>
              ) : mode === "nearby" ? (
                <>
                  No nearby posts right now <Frown size={16} />
                </>
              ) : (
                <>
                  No posts available right now <Frown size={16} />
                </>
              )}
            </p>
          )}
        </div>

        {/* Right: Tags & Suggestions */}
        <div className="md:col-span-4 space-y-4">
          <TagsBar selectedTag={selectedTag} onSelectTag={setSelectedTag} />
          <Suggestions />
        </div>
      </div>
    </div>
  );
};

export default Home;
