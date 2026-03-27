import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

const HiveDetails = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const { hiveId } = useParams();
  const { user } = useAuth();

  const currentUserNormalized = useMemo(() => {
    if (!user) return null;
    const normalized = { ...user };
    if (!normalized._id && normalized.id) normalized._id = normalized.id;
    return normalized;
  }, [user]);

  const [hive, setHive] = useState(null);
  const [posts, setPosts] = useState([]);
  const [myHiveIds, setMyHiveIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchHive = async () => {
    const res = await axios.get(`${API_BASE}/api/hives/${hiveId}`);
    setHive(res.data);
  };

  const fetchPosts = async () => {
    const res = await axios.get(`${API_BASE}/api/hives/${hiveId}/posts`);
    setPosts(res.data || []);
  };

  const fetchMyHives = async () => {
    if (!token) return;
    const res = await axios.get(`${API_BASE}/api/hives/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMyHiveIds(new Set((res.data || []).map((h) => String(h._id))));
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchHive(), fetchPosts(), fetchMyHives()]);
      } catch (e) {
        console.error("Failed to load hive details:", e);
        setError("Failed to load hive details. Please try refreshing.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiveId]);

  const uid = currentUserNormalized?._id || currentUserNormalized?.id;
  const isMember =
    myHiveIds.has(String(hiveId)) ||
    Boolean(
      hive?.createdBy &&
        uid &&
        String(hive.createdBy) === String(uid)
    );

  const joinHive = async () => {
    if (!token) return;
    await axios.post(
      `${API_BASE}/api/hives/${hiveId}/join`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMyHiveIds((prev) => new Set(prev).add(String(hiveId)));
  };

  const leaveHive = async () => {
    if (!token) return;
    await axios.post(
      `${API_BASE}/api/hives/${hiveId}/leave`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMyHiveIds((prev) => {
      const next = new Set(prev);
      next.delete(String(hiveId));
      return next;
    });
  };

  const refreshPosts = async () => {
    await fetchPosts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            Loading hive...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-4">{error}</h2>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Hive not found</h2>
            <p className="mb-6">The hive you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/hives')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold"
            >
              Back to Hives
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={refreshPosts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{hive.name}</h1>
              <p className="text-gray-600">{hive.description || "No description yet."}</p>
              <p className="text-sm text-gray-500 mt-2">
                👥 {hive.memberCount ?? 0} members
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/post-help?hiveId=${hiveId}`)}
                disabled={!isMember}
                className={`px-4 py-3 rounded-xl font-semibold ${
                  isMember
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-300 text-white cursor-not-allowed"
                }`}
              >
                Create Post
              </button>
              {isMember ? (
                <button
                  onClick={leaveHive}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold"
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={joinHive}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold"
                >
                  Join
                </button>
              )}
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow border border-gray-100">
            <div className="text-6xl mb-3">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No posts in this hive yet
            </h3>
            <p className="text-gray-600">
              Create a help request and tag it to start the community.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                refreshPosts={refreshPosts}
                currentUser={currentUserNormalized}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HiveDetails;

