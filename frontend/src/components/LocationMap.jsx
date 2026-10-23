import React, { useState } from 'react';
import { MapPin, ExternalLink, Navigation, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { getCoordinatesForLocation, getOsmEmbedUrl, getGoogleMapsUrl, getGoogleDirectionsUrl } from '../utils/geoCoordinates';
import './LocationMap.css';

const LocationMap = ({ location, height = 300, title = "Incident Location Map" }) => {
  const [zoomLevel, setZoomLevel] = useState(0.012); // ~15 zoom
  const coords = getCoordinatesForLocation(location);
  const osmUrl = getOsmEmbedUrl(coords.lat, coords.lon, zoomLevel);
  const googleMapsUrl = getGoogleMapsUrl(location, coords.lat, coords.lon);
  const directionsUrl = getGoogleDirectionsUrl(location, coords.lat, coords.lon);

  const handleZoom = (direction) => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.max(0.004, prev * 0.6));
    } else {
      setZoomLevel(prev => Math.min(0.06, prev * 1.5));
    }
  };

  return (
    <div className="location-map-card">
      <div className="location-map-header">
        <div className="header-left">
          <MapPin size={18} className="map-icon" />
          <h4 className="map-title">{title}</h4>
        </div>
        <div className="coord-chip">
          <Compass size={13} />
          <span>{coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E</span>
        </div>
      </div>

      <div className="iframe-wrapper" style={{ height: `${height}px` }}>
        <iframe
          title={`Map of ${location || 'Coimbatore'}`}
          src={osmUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
        />
        
        {/* Floating Zoom Controls */}
        <div className="map-controls">
          <button 
            type="button" 
            className="ctrl-btn" 
            title="Zoom In" 
            onClick={() => handleZoom('in')}
          >
            <ZoomIn size={14} />
          </button>
          <button 
            type="button" 
            className="ctrl-btn" 
            title="Zoom Out" 
            onClick={() => handleZoom('out')}
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      <div className="location-map-footer">
        <div className="footer-locality">
          <strong>Locality:</strong> <span>{location || 'Coimbatore, Tamil Nadu'}</span>
        </div>
        <div className="map-actions">
          <a 
            href={directionsUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="map-action-btn directions-btn"
          >
            <Navigation size={13} />
            <span>Get Directions</span>
          </a>
          <a 
            href={googleMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="map-action-btn external-btn"
          >
            <ExternalLink size={13} />
            <span>Open Google Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
