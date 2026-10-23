import React, { useState } from 'react';
import axios from 'axios';
import { DEPARTMENTS, COIMBATORE_LOCALITIES } from '../constants';
import { getCityFromBrowser } from '../utils/locationHelper';
import { API_BASE_URL } from '../config/api';
import './RegisterPage.css';

const RegisterPage = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: 'CITIZEN', department: 'General', location: ''
  });
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleSelectLocality = (locality) => {
    const formatted = locality.includes('Coimbatore') ? locality : `${locality}, Coimbatore`;
    setFormData(prev => ({ ...prev, location: formatted }));
  };

  const handleDetectCity = async () => {
    setLoadingLoc(true);
    try {
      const city = await getCityFromBrowser();
      setFormData(prev => ({ ...prev, location: city }));
    } catch (err) {
      alert("Could not auto-detect: " + err + "\nPlease pick your locality from the quick list.");
    } finally {
      setLoadingLoc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.location.trim()) {
      return alert("Please select or enter your locality (e.g. Eachanari, Gandhipuram)!");
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      alert("Account Created Successfully! Moving to Login...");
      onNavigate('login');
    } catch (err) {
      alert("Registration failed: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join CivicFix to report issues in your neighborhood</p>

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Full Name" 
            required 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />
          
          <div className="register-loc-container">
            <div className="loc-row">
              <input 
                type="text" 
                placeholder="Locality (e.g. Eachanari, Gandhipuram)" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})}
                list="reg-localities-list"
                required 
              />
              <button type="button" onClick={handleDetectCity} className="detect-btn">
                {loadingLoc ? "..." : "📍 Detect"}
              </button>
            </div>

            <datalist id="reg-localities-list">
              {COIMBATORE_LOCALITIES.map(loc => (
                <option key={loc} value={`${loc}, Coimbatore`} />
              ))}
            </datalist>

            <div className="quick-localities">
              <span>Quick pick: </span>
              {["Eachanari", "Gandhipuram", "Peelamedu", "RS Puram", "Saravanampatti"].map(loc => (
                <button 
                  type="button" 
                  key={loc}
                  className={`quick-loc-btn ${formData.location.includes(loc) ? 'active' : ''}`}
                  onClick={() => handleSelectLocality(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <select 
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="CITIZEN">Citizen (Report Issues)</option>
            <option value="ADMIN">Authority / Ward Admin (Resolve Issues)</option>
          </select>

          {formData.role === 'ADMIN' && (
            <select 
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
              required
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          <button type="submit" className="main-btn">Register</button>
        </form>
        <p onClick={() => onNavigate('login')} className="toggle-link">Already have an account? Login</p>
      </div>
    </div>
  );
};

export default RegisterPage;