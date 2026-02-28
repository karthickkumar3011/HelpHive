// src/components/PostCard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  MessageCircle
} from "lucide-react";

const PostCard = ({ post, refreshPosts, currentUser }) => {
  const navigate = useNavigate();

  const [isHelping, setIsHelping] = useState(false);
  const [helpers, setHelpers] = useState(post.helpers || []);
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(
    currentUser ? post.upvoters?.includes(currentUser._id) : false
  );
  const [commentText, setCommentText] = useState("");
  const [postStatus, setPostStatus] = useState(post.status || "Open");
  const [isLoading, setIsLoading] = useState(false);

  // Helper for media URL
  const mediaUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    if (file.startsWith("/uploads")) return `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${file}`;
    return `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${file}`;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  useEffect(() => {
    if (!currentUser) return;
    const userIsHelping = helpers.some(helper => 
      helper._id === currentUser._id || helper === currentUser._id
    );
    const userHasHelpingPost = currentUser.helpingPosts?.includes(post._id);
    setIsHelping(userIsHelping || userHasHelpingPost);
    setPostStatus(post.status || "Open");
  }, [helpers, currentUser, post._id, post.status]);

  const handleHelp = async () => {
    if (!currentUser) return alert("Please login to help");
    if (isLoading) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/${post._id}/help`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedPost = res.data.post || res.data;
      setHelpers(updatedPost.helpers || []);
      setPostStatus(updatedPost.status || "In Progress");
      setIsHelping(true);
      if (refreshPosts) refreshPosts();
      // Refresh user
      try {
        const userRes = await axios.get(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        localStorage.setItem("user", JSON.stringify(userRes.data));
        window.location.reload();
      } catch (userErr) {
        console.error("Failed to refresh user data:", userErr);
      }
    } catch (err) {
      console.error("Failed to help:", err);
      alert(err.response?.data?.message || "Failed to help on post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!currentUser) return alert("Please login to upvote");
    if (hasUpvoted || isLoading) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/${post._id}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUpvotes(res.data.post.upvotes);
      setHasUpvoted(true);
    } catch (err) {
      console.error("Failed to upvote:", err);
      alert(err.response?.data?.message || "Failed to upvote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) return alert("Please login to comment");
    if (!commentText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/${post._id}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText("");
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert(err.response?.data?.message || "Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const goToDiscuss = () => {
    if (!currentUser) return;
    navigate(`/chat/${post._id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open": return "bg-gray-200 text-gray-800";
      case "In Progress": return "bg-yellow-200 text-yellow-800";
      case "Ongoing": return "bg-green-200 text-green-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Open": return "Open";
      case "In Progress": return "In Progress";
      case "Ongoing": return "Ongoing";
      default: return "Open";
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-100/50  p-6 mb-6 border border-gray-100 hover:border-gray-200 transform transition-transform duration-300">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {post.createdBy?.avatar ? (
            <img
              src={post.createdBy.avatar}
              alt={post.createdBy.username}
              className="w-10 h-10 rounded-full ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-blue-100">
              <span className="text-sm font-bold text-white">{post.createdBy?.username?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 text-base">{post.createdBy?.username}</span>
            <span className="text-xs text-gray-500 font-medium">{getTimeAgo(post.createdAt)}</span>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(postStatus)} shadow-sm`}>
          {getStatusText(postStatus)}
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-3 text-gray-900 leading-tight">{post.title}</h2>
      <p className="text-gray-700 mb-4 leading-relaxed text-base">{post.description}</p>

      {/* Location & Category */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 font-medium">
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{post.category}</span>
        <span className="text-gray-400">•</span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {post.location?.address || "Unknown Location"}
        </span>
      </div>

      {/* Helpers */}
      {helpers.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 font-medium mb-1">Helpers:</p>
          <div className="flex flex-wrap gap-2">
            {helpers.map((helper, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                {helper.avatar ? (
                  <img src={helper.avatar} alt={helper.username} className="w-4 h-4 rounded-full"/>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-blue-300 flex items-center justify-center">
                    <span className="text-xs">{helper.username?.charAt(0)?.toUpperCase() || "H"}</span>
                  </div>
                )}
                <span className="text-xs">{helper.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="my-3 grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg overflow-hidden relative">
          {post.media.map((file, idx) => {
            const url = mediaUrl(file);
            const isVideo = url.endsWith(".mp4") || url.includes("/video/");
            return (
              <div key={idx} className={post.media.length > 1 ? "aspect-square relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300" : "rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"}>
                {isVideo ? (
                  <video src={url} controls className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300" />
                ) : (
                  <img
                    src={url}
                    alt={`Post media ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer rounded-lg hover:scale-105 transition-transform duration-300 hover:brightness-110"
                    onClick={() => window.open(url, "_blank")}
                  />
                )}
                {idx === 3 && post.media.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                    <span className="text-white text-3xl font-extrabold">+{post.media.length - 4}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 my-3">
          {post.tags.map((tag, idx) => (
            <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex gap-3">
          {!isHelping && currentUser && post.createdBy?._id !== currentUser._id && (
            <button
              onClick={handleHelp}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? "Helping..." : "Help"}
            </button>
          )}
          {isHelping && (
            <div className="flex gap-3">
              <span className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
                <CheckCircle size={16} />
                Helping
              </span>
              <button
                onClick={goToDiscuss}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <MessageCircle size={16} />
                Discuss
              </button>
            </div>
          )}
          <button
            onClick={handleUpvote}
            disabled={hasUpvoted || isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
              hasUpvoted
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-yellow-300 disabled:to-yellow-400"
            }`}
          >
            <ThumbsUp size={16} />
            {upvotes}
          </button>
          <button
            onClick={() => document.getElementById(`comment-${post._id}`)?.focus()}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <MessageSquare size={16} />
            ({post.comments?.length || 0})
          </button>
        </div>
      </div>

      {/* Comments Display */}
      {post.comments?.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare size={18} />
            Comments ({post.comments.length})
          </h4>
          <div className="space-y-3">
            {post.comments.map((comment, idx) => (
              <div key={idx} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-3">
                  {comment.user?.avatar ? (
                    <img src={comment.user.avatar} alt={comment.user.username} className="w-8 h-8 rounded-full ring-1 ring-gray-200"/>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ring-1 ring-gray-200">
                      <span className="text-xs font-bold text-white">{comment.user?.username?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{comment.user?.username}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500 font-medium">{getTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Input */}
      {currentUser && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex gap-3">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.username} className="w-8 h-8 rounded-full ring-1 ring-gray-200"/>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-1 ring-gray-200">
                <span className="text-xs font-bold text-white">{currentUser.username?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
            )}
            <div className="flex-1">
              <input
                id={`comment-${post._id}`}
                type="text"
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={isLoading || !commentText.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isLoading ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
