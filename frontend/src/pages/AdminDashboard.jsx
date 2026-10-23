import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, AlertCircle, Info, X, LogOut, Loader2, Filter } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { getImageUrl } from '../utils/imageHelper';
import { COIMBATORE_LOCALITIES } from '../constants';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('NOT_REVIEWED');
  const [selectedLocality, setSelectedLocality] = useState(user?.location || 'All');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user, selectedLocality]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        department: user.department
      };
      if (selectedLocality && selectedLocality !== 'All') {
        params.city = selectedLocality;
      }

      const res = await axios.get(`${API_BASE_URL}/api/complaints/all`, { params });
      setComplaints(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const params = new URLSearchParams();
      params.append('status', newStatus);
      await axios.put(`${API_BASE_URL}/api/complaints/${id}/status`, params);
      alert("Status updated to: " + newStatus);
      fetchData();
      setSelectedIssue(null);
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="adminRoot">
      <nav className="topNav">
        <div className="navLeft">
          <h2 className="logo">CivicFix <span>Admin</span></h2>
          <div className="navTabs">
            {['NOT_REVIEWED', 'REVIEWED', 'RESOLVED'].map(tab => (
              <button 
                key={tab}
                className={`tabBtn ${filter === tab ? 'activeTab' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="profile-group">
          <div className="admin-info">
            <p className="admin-name">{user?.name || 'Department Admin'}</p>
            <p className="admin-dept">{user?.department} Dept • {user?.location || 'Coimbatore'}</p>
          </div>
          <div className="profile-circle">{user?.name?.charAt(0) || 'A'}</div>
          <button onClick={onLogout} className="logoutBtn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="dashboardMain">
        {/* Locality & Department Filter Bar */}
        <div className="adminFilterRow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', flexWrap: 'wrap', gap: '15px' }}>
          <div className="statsBar" style={{ margin: 0 }}>
            <div className="statCard">Total {user?.department} Issues: {complaints.length}</div>
            <div className="statCard blue">Viewing: {filter.replace('_', ' ')} ({complaints.filter(c => (c.status || 'NOT_REVIEWED') === filter).length})</div>
          </div>

          <div className="localityFilter" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={16} color="#64748b" />
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Filter Locality:</label>
            <select 
              value={selectedLocality} 
              onChange={(e) => setSelectedLocality(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 500 }}
            >
              <option value="All">All Localities</option>
              {COIMBATORE_LOCALITIES.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loaderContainer"><Loader2 className="spinner" /> Loading reports...</div>
        ) : (
          <div className="cardGrid">
            {complaints
              .filter(c => (c.status || 'NOT_REVIEWED') === filter)
              .map(item => (
                <div key={item.id} className="complaintCard">
                  <div className="cardLeft">
                    {item.imageUrl && (
                      <img 
                        src={getImageUrl(item.imageUrl)} 
                        alt="Issue" className="rectImg" 
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60';
                        }}
                      />
                    )}
                    <div className="cardIcons">
                      <span className="priorityTag"><AlertCircle size={12}/> AI Verified</span>
                      <span className="locTag"><MapPin size={12}/> {item.location}</span>
                    </div>
                  </div>
                  <div className="cardRight">
                    <p className="descriptionText">{item.description}</p>
                    <button className="viewBtn" onClick={() => setSelectedIssue(item)}>
                      <Info size={16}/> Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {selectedIssue && (
        <div className="modalOverlay" onClick={() => setSelectedIssue(null)}>
          <div className="detailsModal" onClick={e => e.stopPropagation()}>
            <button className="closeBtn" onClick={() => setSelectedIssue(null)}><X /></button>
            <div className="modalGrid">
              <div className="modalInfo">
                <h3>Complaint Details</h3>
                <hr />
                <div className="detailRow"><strong>Reported by:</strong> {selectedIssue.email}</div>
                <div className="detailRow"><strong>Specific Locality:</strong> {selectedIssue.location}</div>
                <div className="detailRow"><strong>Department:</strong> {selectedIssue.department}</div>
                <div className="detailRow"><strong>Issue Description:</strong> {selectedIssue.description}</div>
                
                <img 
                  src={getImageUrl(selectedIssue.imageUrl)}
                  className="modalImg" 
                  alt="Full view"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60';
                  }}
                />
                
                <div className="modalActions">
                   <select id="statusUpdate" className="statusSelect" defaultValue={selectedIssue.status || 'NOT_REVIEWED'}>
                      <option value="NOT_REVIEWED">Mark Not Reviewed</option>
                      <option value="REVIEWED">Mark Reviewed</option>
                      <option value="RESOLVED">Mark Resolved</option>
                   </select>
                   <button 
                    className="updateBtn"
                    onClick={() => updateStatus(selectedIssue.id, document.getElementById('statusUpdate').value)}
                   >
                     Confirm Change
                   </button>
                </div>
              </div>
              <div className="modalMap">
                <h3>Location Map</h3>
                <iframe
                  title="map"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: '12px' }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedIssue.location)}&z=15&output=embed`}
                  allowFullScreen
                ></iframe>
                <p className="coordText">Location: {selectedIssue.location}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;