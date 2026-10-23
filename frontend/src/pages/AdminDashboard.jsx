import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, AlertCircle, Info, X, LogOut, Loader2, Filter, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { getImageUrl } from '../utils/imageHelper';
import { COIMBATORE_LOCALITIES } from '../constants';
import LocationMap from '../components/LocationMap';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('NOT_REVIEWED');
  const [selectedLocality, setSelectedLocality] = useState(user?.location || 'All');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'map'

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

  const filteredComplaints = complaints.filter(c => (c.status || 'NOT_REVIEWED') === filter);

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
            <div className="statCard blue">Viewing: {filter.replace('_', ' ')} ({filteredComplaints.length})</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {/* View Mode Toggle */}
            <div className="viewToggleGroup">
              <button 
                type="button" 
                className={`viewToggleBtn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid size={15} />
                <span>Cards</span>
              </button>
              <button 
                type="button" 
                className={`viewToggleBtn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
              >
                <MapIcon size={15} />
                <span>Map Overview</span>
              </button>
            </div>

            {/* Locality Selector */}
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
        </div>

        {loading ? (
          <div className="loaderContainer"><Loader2 className="spinner" /> Loading reports...</div>
        ) : viewMode === 'map' ? (
          /* ========================================================
             MAP OVERVIEW VIEW: Interactive map of selected locality
             ======================================================== */
          <div className="adminMapOverview">
            <LocationMap 
              location={selectedLocality !== 'All' ? selectedLocality : (filteredComplaints[0]?.location || 'Coimbatore')} 
              height={500}
              title={`Live Locality Map: ${selectedLocality !== 'All' ? selectedLocality : 'Coimbatore Region'}`}
            />
            
            <div className="mapOverviewSidebar">
              <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0f172a' }}>
                Reported Issues in {selectedLocality} ({filteredComplaints.length})
              </h4>
              {filteredComplaints.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No {filter.replace('_', ' ')} issues in this locality.</p>
              ) : (
                filteredComplaints.map(item => (
                  <div key={item.id} className="mapSidebarItem" onClick={() => setSelectedIssue(item)}>
                    <img 
                      src={getImageUrl(item.imageUrl)} 
                      alt="Issue" 
                      className="mapSidebarImg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                    <div className="mapSidebarContent">
                      <p className="mapSidebarDesc">{item.description}</p>
                      <div className="mapSidebarMeta">
                        <span className="mapSidebarLoc"><MapPin size={12} /> {item.location}</span>
                        <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Inspect →</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ========================================================
             CARDS VIEW: Grid of complaint cards
             ======================================================== */
          <div className="cardGrid">
            {filteredComplaints.map(item => (
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
                    <Info size={16}/> Details & Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ========================================================
         DETAIL MODAL WITH INTERACTIVE LOCATION MAP
         ======================================================== */}
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

              {/* Robust Interactive Location Map */}
              <div className="modalMap">
                <LocationMap 
                  location={selectedIssue.location} 
                  height={320} 
                  title={`Incident Map: ${selectedIssue.location}`} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;