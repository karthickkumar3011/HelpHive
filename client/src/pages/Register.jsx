// client/src/pages/Register.jsx
import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    bio: "",
    address: "",   // readable location
    latitude: "",
    longitude: "",
    skills: "",
    profession: "",
  });

  const [message, setMessage] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Auto-fetch location
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      return alert("Geolocation is not supported by your browser");
    }
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding using OpenStreetMap Nominatim API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          setFormData((prev) => ({
            ...prev,
            latitude,
            longitude,
            address:
              data.display_name ||
              `${data.address.city || ""}, ${data.address.state || ""}, ${data.address.country || ""}`,
          }));
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          alert("Failed to fetch address from coordinates.");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error fetching location:", error);
        alert("Unable to fetch location. Please enter manually.");
        setLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        bio: formData.bio,
        profession: formData.profession,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.longitude) || 0,
            parseFloat(formData.latitude) || 0,
          ],
          address: formData.address,
        },
      };

      const res = await axios.post(`${API_BASE}/api/auth/register`, payload);
      setMessage(res.data.message || "User registered successfully!");

      if (res.data.token && res.data.user) {
        const u = res.data.user;
        login({ ...u, _id: u._id || u.id }, res.data.token);
        navigate("/");
        return;
      }

      setFormData({
        username: "",
        name: "",
        email: "",
        password: "",
        bio: "",
        address: "",
        latitude: "",
        longitude: "",
        skills: "",
        profession: "",
      });
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Something went wrong during registration"
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-lg space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Register</h2>

        {/* Username */}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />

        {/* Full Name */}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 chars)"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />

        {/* Bio */}
        <textarea
          name="bio"
          placeholder="Short Bio"
          value={formData.bio}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        {/* Address */}
        <input
          type="text"
          name="address"
          placeholder="City / Address"
          value={formData.address}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        {/* Latitude */}
        <input
          type="number"
          name="latitude"
          placeholder="Latitude"
          value={formData.latitude}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        {/* Longitude */}
        <input
          type="number"
          name="longitude"
          placeholder="Longitude"
          value={formData.longitude}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        {/* Fetch Location Button */}
        <button
          type="button"
          onClick={handleFetchLocation}
          disabled={loadingLocation}
          className="w-full bg-green-500 text-white rounded p-2 hover:bg-green-600"
        >
          {loadingLocation ? "Fetching Location..." : "Fetch My Location"}
        </button>

        {/* Skills */}
        <input
          type="text"
          name="skills"
          placeholder="Skills (comma separated)"
          value={formData.skills}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        {/* Profession */}
        <input
          type="text"
          name="profession"
          placeholder="Profession"
          value={formData.profession}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white rounded p-2 hover:bg-blue-600"
        >
          Register
        </button>

        {message && (
          <p
            className={`text-center text-sm ${
              message.toLowerCase().includes("success") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
