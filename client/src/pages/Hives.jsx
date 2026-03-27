import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Hives = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hives, setHives] = useState([]);
  const [trendingHives, setTrendingHives] = useState([]);
  const [myHiveIds, setMyHiveIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchHives = async () => {
    const res = await axios.get(
      `${API_BASE}/api/hives${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`
    );
    setHives(res.data || []);
  };

  const fetchTrending = async () => {
    const res = await axios.get(`${API_BASE}/api/hives/trending?limit=8`);
    setTrendingHives(res.data || []);
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
        await Promise.all([fetchHives(), fetchTrending(), fetchMyHives()]);
      } catch (e) {
        console.error("Failed to load hives:", e);
        setError("Failed to load hives. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
    // Intentionally exclude token/user: token is loaded once from localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const joinHive = async (hiveId) => {
    if (!token) return;
    await axios.post(
      `${API_BASE}/api/hives/${hiveId}/join`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMyHiveIds((prev) => new Set(prev).add(String(hiveId)));
  };

  const leaveHive = async (hiveId) => {
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

  const createHive = async () => {
    if (!token) return;
    if (!createName.trim()) return alert("Hive name is required");

    setCreating(true);
    try {
      await axios.post(
        `${API_BASE}/api/hives`,
        { name: createName.trim(), description: createDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCreateName("");
      setCreateDescription("");

      await Promise.all([fetchHives(), fetchTrending(), fetchMyHives()]);
    } catch (e) {
      console.error("Create hive error:", e);
      alert(e.response?.data?.message || "Failed to create hive");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            Loading hives...
          </div>
        </div>
      </div>
    );
  }

  const userIdStr = user?._id || user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Hives</h1>
          <p className="text-lg text-gray-600">
            Join communities based on your interests.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        {trendingHives.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 mb-6 border border-amber-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span aria-hidden>🔥</span> Trending Hives
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Ranked by members and recent hive posts.
            </p>
            <div className="flex flex-wrap gap-3">
              {trendingHives.map((h) => (
                <button
                  key={h._id}
                  type="button"
                  onClick={() => navigate(`/hives/${h._id}`)}
                  className="text-left rounded-xl bg-white/90 border border-amber-200 px-4 py-3 shadow-sm hover:shadow-md transition min-w-[160px]"
                >
                  <div className="font-semibold text-gray-900 capitalize">{h.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    👥 {h.memberCount ?? 0} · 📝 {h.postCount ?? 0} posts
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                <Users className="text-blue-600" size={22} />
              </div>
              <input
                type="text"
                value={search}
                placeholder="Search hives..."
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/post-help")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold"
              >
                Post Help
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create a Hive</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={createName}
              placeholder="Hive name (e.g., Plumbing)"
              onChange={(e) => setCreateName(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
            <input
              type="text"
              value={createDescription}
              placeholder="Optional description"
              onChange={(e) => setCreateDescription(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
            <button
              onClick={createHive}
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl px-4 py-3 font-semibold"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
          {!user && (
            <p className="mt-3 text-sm text-gray-500">
              Log in to create/join hives.
            </p>
          )}
        </div>

        {hives.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <div className="text-6xl mb-3">🧩</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hives found</h3>
            <p>Try searching again or create a new hive.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hives.map((hive) => {
              const isMember =
                myHiveIds.has(String(hive._id)) ||
                (userIdStr && String(hive.createdBy) === String(userIdStr));
              return (
                <div
                  key={hive._id}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transform transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {hive.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {hive.description || "No description yet."}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium whitespace-nowrap">
                      👥 {hive.memberCount ?? 0} members
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => navigate(`/hives/${hive._id}`)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold transition"
                    >
                      View
                    </button>

                    {isMember ? (
                      <button
                        type="button"
                        onClick={() => leaveHive(hive._id)}
                        className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => joinHive(hive._id)}
                        disabled={!token}
                        className="bg-green-600 hover:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hives;

