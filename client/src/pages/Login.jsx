// src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, form);
      const { token, user } = res.data;

      // Save token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/'); // redirect to home page
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back 👋</h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Email or Username */}
        <input
          type="text"
          name="identifier"
          value={form.identifier}
          onChange={handleChange}
          placeholder="Email or Username"
          required
          className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-500"
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="w-full mb-6 px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-500"
        />

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
        >
          Login
        </button>

        {/* Register link */}
        <p className="text-sm text-center text-gray-500 mt-4">
          Don’t have an account?{' '}
          <a href="/register" className="text-green-600 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
