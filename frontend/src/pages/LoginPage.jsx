import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './RegisterPage.css'; // Reusing the same styling for consistency

const LoginPage = ({ onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      
      // 1. Save user to local storage so they stay logged in
      localStorage.setItem('user', JSON.stringify(res.data));
      
      // 2. Tell App.jsx who logged in
      onLoginSuccess(res.data);
      
      // 3. Navigate to appropriate dashboard
      if (res.data.role === 'ADMIN') {
        onNavigate('admin-dash');
      } else {
        onNavigate('citizen-dash');
      }
    } catch (err) {
      alert("Invalid Email or Password");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Welcome Back</h2>
        <p>Login to your account</p>

        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email Address" 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
          <button type="submit" className="reg-btn">Login</button>
        </form>

        <button className="link-btn" onClick={() => onNavigate('register')}>
          New here? Create an account
        </button>
      </div>
    </div>
  );
};

export default LoginPage;