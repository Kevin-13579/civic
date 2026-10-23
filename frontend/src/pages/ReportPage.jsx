import React, { useState } from 'react';
import axios from 'axios';
import { DEPARTMENTS, COIMBATORE_LOCALITIES } from '../constants';
import { getCityFromBrowser } from '../utils/locationHelper';
import { API_BASE_URL } from '../config/api';
import './ReportPage.css';

const ReportPage = ({ user, onNavigate, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: user ? user.email : '', 
    description: '',
    department: '',
    location: user?.location || 'Eachanari, Coimbatore'
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectLocality = (localityName) => {
    if (!localityName) return;
    const formatted = localityName.includes('Coimbatore') ? localityName : `${localityName}, Coimbatore`;
    setFormData(prev => ({ ...prev, location: formatted }));
  };

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const city = await getCityFromBrowser();
      setFormData(prev => ({ ...prev, location: city }));
    } catch (err) {
      setFormData(prev => ({ ...prev, location: 'Eachanari, Coimbatore' }));
    } finally {
      setDetecting(false);
    }
  };

  // Call Gemini for AI-suggested description
  const handleAISuggest = async () => {
    if (!image) return alert("Please upload a photo of the civic issue first!");
    
    setAiLoading(true);
    const data = new FormData();
    data.append('image', image);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/complaints/describe`, data);
      setFormData(prev => ({ ...prev, description: res.data }));
    } catch (err) {
      alert(err.response?.data || "AI could not describe this image. Please enter a manual description.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.location.trim()) {
      return alert("Please select or detect your specific location (e.g. Eachanari, Gandhipuram)!");
    }
    if (!image) {
      return alert("Please upload an image of the pothole, garbage, or civic issue!");
    }
    
    setLoading(true);
    const data = new FormData();
    data.append('email', formData.email);
    data.append('description', formData.description);
    data.append('department', formData.department);
    data.append('location', formData.location);
    data.append('image', image);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/complaints/submit`, data);
      alert(res.data);
      if (onSuccess) onSuccess(); 
      else if (onNavigate) onNavigate('landing');
    } catch (err) {
      alert(err.response?.data || "Submission failed. Please check the uploaded photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <div className="report-card">
        <h3>Report a Civic Problem</h3>
        <p className="report-subtitle">Potholes, garbage dumping, broken streetlights & road hazards</p>

        <form onSubmit={handleSubmit}>
          <input 
            type="email" name="email" placeholder="Your Email Address" 
            value={formData.email} onChange={handleChange} 
            required readOnly={!!user} 
          />

          <select name="department" value={formData.department} onChange={handleChange} required>
            <option value="">Select Civic Department</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Enhanced Location Selector with Eachanari & Gandhipuram specificity */}
          <div className="location-section">
            <label className="section-label">Incident Location (Specific Locality):</label>
            
            <div className="location-input-group">
              <input 
                type="text" 
                name="location" 
                placeholder="e.g. Eachanari, Gandhipuram, Peelamedu..." 
                value={formData.location} 
                onChange={handleChange}
                list="coimbatore-localities-list"
                required 
              />
              <button 
                type="button" 
                onClick={handleDetect} 
                className="detect-btn"
                title="Detect GPS locality"
                disabled={detecting}
              >
                {detecting ? "Locating..." : "📍 Detect GPS"}
              </button>
            </div>

            <datalist id="coimbatore-localities-list">
              {COIMBATORE_LOCALITIES.map(loc => (
                <option key={loc} value={`${loc}, Coimbatore`} />
              ))}
            </datalist>

            {/* Quick-Pick Location Chips */}
            <div className="locality-chips-container">
              <span className="chips-label">Quick select:</span>
              <div className="chips-list">
                {["Eachanari", "Gandhipuram", "Peelamedu", "RS Puram", "Ukkadam", "Saravanampatti", "Singanallur", "Kuniyamuthur"].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    className={`loc-chip ${formData.location.includes(loc) ? 'active' : ''}`}
                    onClick={() => handleSelectLocality(loc)}
                  >
                    📍 {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="description-group">
            <textarea 
              name="description" 
              placeholder="Describe the issue (e.g. Large pothole near temple causing traffic hazard, or garbage overflowing on pavement)" 
              value={formData.description}
              onChange={handleChange} 
              required 
            />
            <button 
              type="button" 
              onClick={handleAISuggest} 
              className="ai-suggest-btn"
              disabled={aiLoading || !image}
            >
              {aiLoading ? "Analyzing with AI..." : "✨ AI Suggest Description"}
            </button>
          </div>

          <div className="file-upload">
            <label>Upload Photo of Issue (Pothole, Waste, Damage):</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImage(e.target.files[0])} 
              required 
            />
            <span className="upload-hint">AI verifies genuine civic issues and rejects photos containing people's faces for privacy.</span>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "AI is Verifying & Uploading..." : "Submit Complaint to Authority"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportPage;