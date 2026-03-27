import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  MessageCircle,
  Edit,
  Share,
  MapPin,
  Calendar,
  Award,
  Users,
  MessageSquare,
  Heart,
  Bookmark,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ACTIVITY_STYLE = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  gray: { bg: "bg-gray-100", text: "text-gray-600" },
  red: { bg: "bg-red-100", text: "text-red-600" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [helpingPosts, setHelpingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  const isOwnProfile =
    currentUser && String(currentUser._id || currentUser.id) === String(id);

  const followers = Array.isArray(user?.followers) ? user.followers : [];
  const following = Array.isArray(user?.following) ? user.following : [];
  const pinnedPosts = Array.isArray(user?.pinnedPosts) ? user.pinnedPosts : [];

  const reputationScore =
    posts.length * 10 + helpingPosts.length * 5 + comments.length * 2;

  const activities = [
    {
      id: "joined",
      title: "Joined HelpHive",
      timestamp: new Date(user?.createdAt || Date.now()),
      icon: Calendar,
      color: "blue",
    },
    ...(posts.length > 0
      ? [
          {
            id: "first-post",
            title: "Created a post",
            timestamp: new Date(posts[0]?.createdAt || Date.now()),
            icon: MessageSquare,
            color: "green",
          },
        ]
      : []),
    ...(helpingPosts.length > 0
      ? [
          {
            id: "helping",
            title: "Helped someone",
            timestamp: new Date(helpingPosts[0]?.createdAt || Date.now()),
            icon: Heart,
            color: "purple",
          },
        ]
      : []),
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setPostsError("");

        const userRes = await axios.get(`${API_BASE}/api/users/${id}`);
        setUser(userRes.data);

        if (Array.isArray(userRes.data.helpingPosts)) {
          setHelpingPosts(userRes.data.helpingPosts);
        } else {
          setHelpingPosts([]);
        }

        setComments([]);

        try {
          const postsRes = await axios.get(`${API_BASE}/api/posts/user/${id}`);
          setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        } catch (postErr) {
          console.error("Error fetching user posts:", postErr);
          setPosts([]);
          setPostsError(
            postErr.response?.data?.message ||
              "Could not load posts. Try again later."
          );
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleMessage = () => {
    if (!currentUser) return alert("Please login to message");
    navigate(`/chat?userId=${id}`);
  };

  const handleEditProfile = () => {
    // Navigate to edit profile page (assuming it exists)
    navigate("/edit-profile");
  };

  const handleShareProfile = () => {
    navigator.share?.({
      title: `${user?.name}'s Profile`,
      url: window.location.href,
    }) || navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const mediaUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    return `${API_BASE}/uploads/${file}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.avatar ? (
                <img
                  src={mediaUrl(user.avatar)}
                  alt={user.name}
                  className="w-28 h-28 rounded-full ring-4 ring-blue-50"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-4 ring-blue-50">
                  <span className="text-3xl font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-xl text-gray-600">@{user.username}</p>
                  {user.bio && (
                    <p className="text-gray-700 mt-2 max-w-lg">{user.bio}</p>
                  )}
                  {user.profession && (
                    <p className="text-sm text-gray-500 mt-1">{user.profession}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isOwnProfile ? (
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
                    >
                      <Edit size={18} />
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleMessage}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold transition"
                      >
                        <MessageCircle size={18} />
                        Message
                      </button>
                      <button
                        onClick={() => navigate("/hives")}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-lg font-semibold transition"
                      >
                        <Users size={18} />
                        Join Hive
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleShareProfile}
                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-3 rounded-lg font-semibold transition"
                  >
                    <Share size={18} />
                    Share
                  </button>
                </div>
              </div>

              {/* Location & Join Date */}
              <div className="flex items-center gap-6 mt-5 text-sm text-gray-500">
                {user.location?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    {user.location.address}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {user.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">{posts.length}</div>
            <div className="text-base text-gray-600 mt-1">Posts</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{helpingPosts.length}</div>
            <div className="text-base text-gray-600 mt-1">Helping</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{comments.length}</div>
            <div className="text-base text-gray-600 mt-1">Comments</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <div className="text-base text-gray-600 mt-1">Hives</div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Activity Timeline
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Joined HelpHive</p>
                <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {posts.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created first post</p>
                  <p className="text-xs text-gray-500">{new Date(posts[0].createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {helpingPosts.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Started helping others</p>
                  <p className="text-xs text-gray-500">Recently active</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Last active</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reputation & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Reputation Score */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award size={18} />
              Reputation Score
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{reputationScore}</div>
              <div className="text-sm text-gray-600">Community Points</div>
              <div className="mt-3 flex justify-center gap-4 text-xs text-gray-500">
                <span>{posts.length} posts</span>
                <span>{helpingPosts.length} helping</span>
                <span>{comments.length} comments</span>
              </div>
            </div>
          </div>

        {/* Followers/Following */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={18} />
            Network
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{followers.length}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{following.length}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
          {/* Followers List */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Followers</h4>
            <div className="flex flex-wrap gap-2">
              {followers.map((follower) => (
                <div key={follower.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <img src={follower.avatar} alt={follower.name} className="w-6 h-6 rounded-full" />
                  <span className="text-sm text-gray-700">{follower.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Following List */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Following</h4>
            <div className="flex flex-wrap gap-2">
              {following.map((follow) => (
                <div key={follow.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <img src={follow.avatar} alt={follow.name} className="w-6 h-6 rounded-full" />
                  <span className="text-sm text-gray-700">{follow.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      (ACTIVITY_STYLE[activity.color] || ACTIVITY_STYLE.gray).bg,
                    ].join(" ")}
                  >
                    <activity.icon
                      size={16}
                      className={(ACTIVITY_STYLE[activity.color] || ACTIVITY_STYLE.gray).text}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award size={18} />
            Achievements
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg">
              <Award size={16} />
              <span className="text-sm font-medium">Early Contributor</span>
            </div>
            {helpingPosts.length > 0 && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                <Heart size={16} />
                <span className="text-sm font-medium">Top Helper</span>
              </div>
            )}
            {posts.length > 5 && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                <Users size={16} />
                <span className="text-sm font-medium">Active Poster</span>
              </div>
            )}
            {posts.length >= 10 && (
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg">
                <MessageSquare size={16} />
                <span className="text-sm font-medium">Community Builder</span>
              </div>
            )}
            {reputationScore >= 100 && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                <Award size={16} />
                <span className="text-sm font-medium">Century Club</span>
              </div>
            )}
            {pinnedPosts.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg">
                <Bookmark size={16} />
                <span className="text-sm font-medium">Featured Contributor</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {isOwnProfile && (
              <>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition"
                >
                  <Edit size={16} />
                  Settings
                </button>
                <button
                  onClick={() => navigate('/customize-profile')}
                  className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-lg font-medium transition"
                >
                  <Award size={16} />
                  Customize Profile
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium transition"
            >
              <MessageCircle size={16} />
              Quick Chat
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100">
            <div className="flex">
              {[
                { id: "posts", label: "Posts", icon: MessageSquare },
                { id: "helping", label: "Helping", icon: Heart },
                { id: "comments", label: "Comments", icon: MessageCircle },
                { id: "pinned", label: "Pinned", icon: Bookmark },
                { id: "saved", label: "Saved", icon: Bookmark },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "posts" && (
              <div>
                {postsError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {postsError}
                  </div>
                )}
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition">
                        <h3 className="font-semibold text-gray-900 mb-2">{post.title || "Untitled"}</h3>
                        <p className="text-gray-700 mb-3 line-clamp-3">{post.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          {post.status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.status === "Open" ? "bg-gray-100 text-gray-800" :
                              post.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                              "bg-green-100 text-green-800"
                            }`}>
                              {post.status}
                            </span>
                          )}
                          {(post.tags || []).length > 0 && (
                            <span className="text-xs text-blue-600">
                              {(post.tags || []).slice(0, 4).map((t) => `#${t}`).join(" ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !postsError && (
                    <p className="text-gray-500 text-center py-8">No posts yet</p>
                  )
                )}
              </div>
            )}

            {activeTab === "helping" && (
              <div>
                {helpingPosts.length > 0 ? (
                  <div className="space-y-4">
                    {helpingPosts.map((post) => (
                      <div key={post._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition">
                        <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-gray-700 mb-3">{post.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Helping
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Not helping on any posts yet</p>
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition">
                        <p className="text-gray-700 mb-2">{comment.content}</p>
                        <div className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No comments yet</p>
                )}
              </div>
            )}

            {activeTab === "pinned" && (
              <div>
                {pinnedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {pinnedPosts.map((post) => (
                      <div key={post._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition relative">
                        <div className="absolute top-4 right-4">
                          <Bookmark size={16} className="text-yellow-500 fill-current" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 pr-8">{post.title}</h3>
                        <p className="text-gray-700 mb-3">{post.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pinned
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No pinned posts yet</p>
                )}
              </div>
            )}

            {activeTab === "saved" && (
              <div>
                <p className="text-gray-500 text-center py-8">Saved items feature coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;