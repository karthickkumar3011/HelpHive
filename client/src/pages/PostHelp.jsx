// src/pages/PostHelp.jsx
import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useLocation, Link } from "react-router-dom";
import { TAG_SUGGESTION_LEXICON } from "../constants/tags";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const KEYWORD_HINTS = [
  { keys: ["plumb", "pipe", "leak", "toilet", "sink"], tag: "plumbing" },
  { keys: ["wire", "electric", "outlet", "light", "power"], tag: "electrical" },
  { keys: ["garden", "lawn", "plant", "yard"], tag: "gardening" },
  { keys: ["urgent", "emergency", "asap", "immediate"], tag: "urgenthelp" },
  { keys: ["lost", "missing", "stolen"], tag: "lostitem" },
  { keys: ["found", "discovered"], tag: "found" },
  { keys: ["medical", "health", "hospital", "injury", "sick"], tag: "medical" },
  { keys: ["money", "rent", "bill", "financial", "fund"], tag: "financial" },
  { keys: ["donat", "charity", "give"], tag: "donation" },
  { keys: ["advice", "help me", "how to", "guidance"], tag: "guidance" },
  { keys: ["pet", "dog", "cat", "animal"], tag: "pet-care" },
  { keys: ["baby", "child", "kid", "tutor", "homework"], tag: "tutoring" },
  { keys: ["move", "moving", "truck"], tag: "moving-help" },
  { keys: ["car", "auto", "vehicle", "tire"], tag: "auto-repair" },
];

const PostHelp = () => {
  const location = useLocation();
  const hiveId = new URLSearchParams(location.search).get("hiveId");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    locationAddress: "",
    latitude: "",
    longitude: "",
    tags: "",
  });

  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const desc = formData.description.trim().toLowerCase();
      if (desc.length < 8) {
        setSuggestions([]);
        return;
      }

      const currentTags = formData.tags
        .toLowerCase()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const fromLexicon = TAG_SUGGESTION_LEXICON.filter(
        (tag) =>
          !currentTags.includes(tag) &&
          (desc.includes(tag) ||
            tag.split("-").some((part) => part.length > 2 && desc.includes(part)))
      );

      const fromHints = KEYWORD_HINTS
        .filter(
          ({ keys, tag }) =>
            !currentTags.includes(tag) &&
            keys.some((k) => desc.includes(k))
        )
        .map((h) => h.tag);

      const merged = [...new Set([...fromHints, ...fromLexicon])].slice(0, 8);
      setSuggestions(merged);
    }, 320);

    return () => clearTimeout(timeoutId);
  }, [formData.description, formData.tags]);

  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'tags') {
      // Clear suggestions when tags change manually
      setSuggestions([]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
      alert('Please select valid image or video files (JPEG, PNG, GIF, WebP, MP4, WebM)');
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
      alert('Please drop valid image or video files (JPEG, PNG, GIF, WebP, MP4, WebM)');
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Remove file
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-fetch location using browser
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      return alert("Geolocation not supported by your browser");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            latitude,
            longitude,
            locationAddress:
              data.display_name ||
              `${data.address.city || ""}, ${data.address.state || ""}, ${
                data.address.country || ""
              }`,
          }));
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          alert("Failed to fetch address from coordinates.");
        }
      },
      (err) => {
        console.error("Location error:", err);
        alert("Unable to fetch location. Enter manually.");
      }
    );
  };

  // Upload files and create post
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to post.");
        setIsUploading(false);
        return;
      }

      // Upload files first if any
      let mediaUrls = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await axios.post(`${API_BASE}/api/posts/upload`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [Date.now()]: percentCompleted
            }));
          }
        });

        mediaUrls = uploadResponse.data.files;
      }

      // Create post with uploaded files
        const payload = {
        title: formData.title,
        description: formData.description,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.longitude) || 0,
            parseFloat(formData.latitude) || 0,
          ],
          address: formData.locationAddress,
        },
        tags: formData.tags
          ? formData.tags.split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          : [],
        media: mediaUrls,
        helpers: [],
        status: "Open",
          ...(hiveId ? { hiveIds: [hiveId] } : {}),
      };

      const res = await axios.post(`${API_BASE}/api/posts/create-with-files`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Post created:", res.data);
      alert("Help post submitted successfully!");

  // Reset form
  setFormData({
    title: "",
    description: "",
    locationAddress: "",
    latitude: "",
    longitude: "",
    tags: "",
  });
  setSuggestions([]);
  setFiles([]);  
  setUploadProgress({});

    } catch (error) {
      console.error("Posting help failed:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Something went wrong!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Post Help Request</h2>
      <p className="text-center text-sm text-gray-500 mb-6">
        Tags are suggested from your description — tap to add.
      </p>

      {hiveId && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm flex flex-wrap items-center justify-between gap-2">
          <span>
            Posting into a <strong>Hive</strong> — it will be linked to this community.
          </span>
          <Link
            to={`/hives/${hiveId}`}
            className="font-semibold text-amber-800 underline hover:text-amber-950"
          >
            Back to hive
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
          <input
            type="text"
            name="title"
            placeholder="Enter a title for your help request"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            name="description"
            placeholder="Describe your issue in detail..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              name="locationAddress"
              placeholder="Enter your location"
              value={formData.locationAddress}
              onChange={handleChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={handleFetchLocation}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              📍 My Location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
              step="any"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleChange}
              step="any"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags / Categories</label>
          <input
            type="text"
            name="tags"
            placeholder="e.g., plumbing, electrical, gardening (comma separated)"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {/* Tag Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Suggested tags</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const newTags = formData.tags
                        ? `${formData.tags}, ${tag}`
                        : tag;
                      setFormData({ ...formData, tags: newTags });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-800 text-sm rounded-full hover:bg-indigo-100 transition-colors border border-indigo-200 font-medium"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
          
          {/* Drag and Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4"
            onClick={() => document.getElementById('file-input').click()}
          >
            <div className="text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">Drag & drop files here or click to browse</p>
              <p className="text-xs text-gray-400">Supports images and videos (max 50MB each)</p>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {file.type.startsWith('image/') ? (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-2xl">🖼️</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-2xl">🎬</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress Indicators */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(uploadProgress).map(([url, progress]) => (
                <div key={url} className="flex items-center space-x-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{progress}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Submit Help Request'}
        </button>
      </form>
    </div>
  );
};

export default PostHelp;