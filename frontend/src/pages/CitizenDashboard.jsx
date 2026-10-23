import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReportPage from './ReportPage';
import { API_BASE_URL } from '../config/api';
import { getImageUrl } from '../utils/imageHelper';
import './CitizenDashboard.css';

const CitizenDashboard = ({ user, onLogout }) => {
  const [reports, setReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    fetchUserReports();
  }, []);

  const fetchUserReports = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/complaints/all`);
      // Practical Filter: Only show issues reported by THIS user
      const myData = res.data.filter(item => item.email === user.email);
      setReports(myData);
    } catch (err) {
      console.error("Error fetching history", err);
    }
  };

  return (
    <div className="citizen-container">
      {/* 1. Header with Profile */}
      <header className="citizen-header">
        <div className="logo-group">
          <h2>CivicFix <span>Citizen</span></h2>
        </div>
        <div className="profile-group">
          <div className="user-info">
            <p className="user-name">{user?.name || 'Citizen'}</p>
            <p className="user-loc">📍 {user?.location || 'Coimbatore'}</p>
          </div>
          <div className="profile-icon">{user?.name?.charAt(0) || 'U'}</div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="citizen-main">
        <div className="dashboard-top">
          <h3>Your Civic Impact</h3>
          <button 
            className="action-btn" 
            onClick={() => setShowReportForm(!showReportForm)}
          >
            {showReportForm ? '← View Report History' : '+ Report New Issue (Pothole/Garbage)'}
          </button>
        </div>

        {showReportForm ? (
          <div className="fade-in">
            <ReportPage user={user} onSuccess={() => {
              setShowReportForm(false);
              fetchUserReports();
            }} />
          </div>
        ) : (
          <div className="history-list">
            <div className="stats-row">
              <div className="stat-box">Total Reported: {reports.length}</div>
              <div className="stat-box green">Resolved: {reports.filter(r => r.status === 'RESOLVED').length}</div>
            </div>

            {reports.length === 0 ? (
              <div className="empty-state">
                <p>No civic reports found yet. Help keep Eachanari, Gandhipuram & Coimbatore clean and safe by reporting your first issue!</p>
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="history-card">
                  <img 
                    src={getImageUrl(report.imageUrl)} 
                    alt="Issue" 
                    className="report-thumb"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="report-details">
                    <div className="report-header">
                      <span className="dept-tag">{report.department}</span>
                      <span className={`status-tag ${report.status || 'PENDING'}`}>
                        {report.status || 'NOT REVIEWED'}
                      </span>
                    </div>
                    <p className="report-desc">{report.description}</p>
                    <p className="report-loc">📍 {report.location}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenDashboard;