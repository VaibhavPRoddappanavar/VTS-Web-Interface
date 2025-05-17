'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
  });
};

const Map = ({ locations, className = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Fix Leaflet icon issue
    fixLeafletIcon();
    
    // Create map instance if it doesn't exist
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        maxZoom: 22  // Increase maximum zoom level (default is 19)
      }).setView([0, 0], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22,  // Increase maximum zoom level here too
      }).addTo(map);
      
      // Add zoom control with custom position
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
      
      mapInstanceRef.current = map;
    }
    
    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and polyline when locations change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    
    if (locations.length === 0) return;
    
    // Create new markers and collect coordinates for polyline
    const coordinates = [];
    
    // Sort locations by time (oldest first for the polyline)
    const sortedLocations = [...locations].sort((a, b) => 
      new Date(a.data.time).getTime() - new Date(b.data.time).getTime()
    );
    
    sortedLocations.forEach(location => {
      const { latitude: rawLatitude, longitude: rawLongitude, time } = location.data;
      
      // Ensure latitude and longitude are numbers
      const latitude = typeof rawLatitude === 'number' ? rawLatitude : Number(rawLatitude);
      const longitude = typeof rawLongitude === 'number' ? rawLongitude : Number(rawLongitude);
      
      const position = [latitude, longitude];
      
      // Add to coordinates for polyline
      coordinates.push(position);
      
      // Create marker
      const marker = L.marker(position)
        .addTo(map)
        .bindPopup(`
          <strong>Location ID:</strong> ${location.id}<br>
          <strong>Latitude:</strong> ${!isNaN(latitude) ? latitude.toFixed(6) : 'N/A'}<br>
          <strong>Longitude:</strong> ${!isNaN(longitude) ? longitude.toFixed(6) : 'N/A'}<br>
          <strong>Time:</strong> ${time}
        `);
      
      markersRef.current.push(marker);
    });
    
    // Create polyline showing the path
    if (coordinates.length > 1) {
      polylineRef.current = L.polyline(coordinates, { color: 'blue', weight: 3 }).addTo(map);
    }
    
    // Focus the map on the latest location
    const latestLocation = locations[0]?.data;
    if (latestLocation) {
      // Ensure latitude and longitude are numbers
      const lat = typeof latestLocation.latitude === 'number' ? latestLocation.latitude : Number(latestLocation.latitude);
      const lng = typeof latestLocation.longitude === 'number' ? latestLocation.longitude : Number(latestLocation.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 19);  // Increase default zoom from 15 to 19
      }
    } else if (coordinates.length > 0) {
      // Fallback to fit all points if there's no "latest" location
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations]);

  return (
    <div className={`h-full w-full ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};

export default Map;
