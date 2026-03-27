import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Explore = () => {
  const [tab, setTab] = useState('posts');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (tab === 'users' && searchTerm.trim() !== '') {
        setLoading(true);
        axios.get(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchTerm)}`)
          .then(res => {
            setUsers(res.data);
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching users:', err);
            setLoading(false);
          });
      } else if (tab === 'users') {
        setUsers([]);
      }
    }, 300);

    setSearchTimeout(timeout);
  }, [tab, API_BASE]);

  // Fetch posts
  useEffect(() => {
    if (tab === 'posts') {
      setLoading(true);
      axios.get(`${API_BASE}/api/posts`)
        .then(res => {
          setPosts(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching posts:', err);
          setLoading(false);
        });
    }
  }, [tab, API_BASE]);

  // Handle search input change
  useEffect(() => {
    debouncedSearch(search);
  }, [search, debouncedSearch]);

  const filteredPosts = posts.filter((post) => {
    const title = (post.title || "").toLowerCase();
    const matchSearch = title.includes((search || "").toLowerCase());
    const matchCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const mediaUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    return `${API_BASE}/uploads/${file}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore HelpHive</h1>
          <p className="text-lg text-gray-600">Discover help requests and connect with amazing people</p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            className={`px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              tab === 'posts'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
            }`}
            onClick={() => setTab('posts')}
          >
            🔍 Search Posts
          </button>
          <button
            className={`px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              tab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
            }`}
            onClick={() => setTab('users')}
          >
            👥 Search Users
          </button>
        </div>

        {/* Search Bar and Category Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                <FaSearch className="text-blue-600 text-xl" />
              </div>
              <input
                type="text"
                placeholder={`Search ${tab === 'posts' ? 'help requests' : 'users'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border-0 bg-transparent text-lg placeholder-gray-400 focus:outline-none focus:ring-0"
              />
            </div>

            {tab === 'posts' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Tech">Tech</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Electrical">Electrical</option>
              </select>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        )}

        {/* Posts Grid */}
        {tab === 'posts' && !loading && (
          <>
            {filteredPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {post.createdBy?.avatar ? (
                          <img
                            src={mediaUrl(post.createdBy.avatar)}
                            alt={post.createdBy.username}
                            className="w-10 h-10 rounded-full ring-2 ring-blue-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-blue-100">
                            <span className="text-sm font-bold text-white">
                              {post.createdBy?.username?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{post.createdBy?.username || 'Unknown'}</h4>
                          <p className="text-xs text-gray-500">Posted {new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                      {post.title || "Help request"}
                    </h3>
                    <p className="text-gray-700 mb-4 line-clamp-3">{post.description}</p>

                    {post.location?.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span>{post.location.address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" />
                          {post.upvotes || 0}
                        </span>
                        <span>{post.comments?.length || 0} comments</span>
                      </div>
                      <button
                        type="button"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        onClick={() => navigate(`/?post=${post._id}`)}
                      >
                        Open in feed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600">Try adjusting your search or category filter</p>
              </div>
            )}
          </>
        )}

        {/* Users Grid */}
        {tab === 'users' && !loading && (
          <>
            {users.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {user.avatar ? (
                        <img
                          src={mediaUrl(user.avatar)}
                          alt={user.name}
                          className="w-16 h-16 rounded-full ring-4 ring-purple-100 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center ring-4 ring-purple-100 shadow-md">
                          <span className="text-xl font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                        <p className="text-gray-600">@{user.username}</p>
                        {user.profession && (
                          <p className="text-sm text-purple-600 font-medium">{user.profession}</p>
                        )}
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-gray-700 mb-4 line-clamp-2">{user.bio}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {user.location?.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span>{user.location.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCalendarAlt className="text-gray-400" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {user.skills && user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {user.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 3 && (
                          <span className="text-xs text-gray-500">+{user.skills.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <Link to={`/profile/${user._id}`}>
                      <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        View Profile
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {search.trim() ? `No users found for "${search}"` : 'Start searching for users'}
                </h3>
                <p className="text-gray-600">
                  {search.trim() ? 'Try a different search term' : 'Type in the search box above to find people'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
