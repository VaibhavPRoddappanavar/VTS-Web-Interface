'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotatedmarker';

// Fix Leaflet icon issues in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
  });
};

const AnimatedMap = ({ 
  locations, 
  className = '',
  isAnimating,
  setIsAnimating,
  animationProgress,
  setAnimationProgress,
  animationSpeed,
  setAnimationSpeed,
  showControls = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Fix Leaflet icon issue
    fixLeafletIcon();
    
    // Create map instance if it doesn't exist
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        maxZoom: 22
      }).setView([0, 0], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22,
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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
    
    // Clear vehicle marker
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
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
      
      // Create marker (smaller and semi-transparent for waypoints)
      const marker = L.circleMarker(position, {
        radius: 3,
        fillColor: '#3388ff',
        fillOpacity: 0.6,
        color: '#3388ff',
        weight: 1
      })
        .addTo(map)
        .bindPopup(`
          <strong>Time:</strong> ${new Date(time).toLocaleString()}<br>
          <strong>Latitude:</strong> ${!isNaN(latitude) ? latitude.toFixed(6) : 'N/A'}<br>
          <strong>Longitude:</strong> ${!isNaN(longitude) ? longitude.toFixed(6) : 'N/A'}
        `);
      
      markersRef.current.push(marker);
    });
    
    // Create polyline showing the path
    if (coordinates.length > 1) {
      polylineRef.current = L.polyline(coordinates, { 
        color: '#3388ff', 
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 5',
        lineCap: 'round'
      }).addTo(map);
      
      // Create vehicle icon
      const vehicleIcon = L.divIcon({
        html: `<div style="font-size: 24px;">🚗</div>`,
        className: 'vehicle-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      // Add vehicle marker at the start position
      if (coordinates.length > 0) {
        vehicleMarkerRef.current = L.marker(coordinates[0], {
          icon: vehicleIcon
          // Removed rotation properties to keep car straight
        }).addTo(map);
      }
    }
    
    // Fit all points on the map
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Reset animation state
    setIsAnimating(false);
    setAnimationProgress(0);
    
  }, [locations]);

  // Watch for animation state changes from parent
  useEffect(() => {
    if (isAnimating) {
      animateVehicle();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [isAnimating, animationSpeed]);

  // Animation function
  const animateVehicle = () => {
    if (!polylineRef.current || !vehicleMarkerRef.current || !mapInstanceRef.current) return;
    
    setIsAnimating(true);
    
    const polyline = polylineRef.current;
    const vehicleMarker = vehicleMarkerRef.current;
    const map = mapInstanceRef.current;
    
    // Get polyline points
    const latlngs = polyline.getLatLngs();
    if (latlngs.length < 2) return;
    
    let startTime = null;
    const duration = 10000 / animationSpeed; // 10 seconds divided by speed multiplier
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress * 100);
      
      if (progress < 1) {
        // Calculate position along the polyline
        const pointIndex = Math.floor(progress * (latlngs.length - 1));
        const remainingProgress = (progress * (latlngs.length - 1)) % 1;
        
        let position;
        
        if (pointIndex < latlngs.length - 1) {
          // Interpolate between two points
          const start = latlngs[pointIndex];
          const end = latlngs[pointIndex + 1];
          
          position = [
            start.lat + (end.lat - start.lat) * remainingProgress,
            start.lng + (end.lng - start.lng) * remainingProgress
          ];
        } else {
          position = [latlngs[latlngs.length - 1].lat, latlngs[latlngs.length - 1].lng];
        }
        
        // Update vehicle position (no rotation)
        vehicleMarker.setLatLng(position);
        
        // Center map on vehicle with slight offset for better visibility
        map.panTo(position, { animate: true, duration: 0.1 });
        
        // Continue animation
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsAnimating(false);
        setAnimationProgress(100);
      }
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Removed calculateAngle function as we're no longer rotating the vehicle
  
  // Reset vehicle position when animation progress is reset to 0
  useEffect(() => {
    if (animationProgress === 0 && !isAnimating) {
      const polyline = polylineRef.current;
      const vehicleMarker = vehicleMarkerRef.current;
      
      if (polyline && vehicleMarker) {
        const latlngs = polyline.getLatLngs();
        if (latlngs.length > 0) {
          vehicleMarker.setLatLng(latlngs[0]);
        }
      }
    }
  }, [animationProgress, isAnimating]);

  return (
    <div className={`h-full w-full relative ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Map controls are now in the ride info panel */}
    </div>
  );
};

export default AnimatedMap;
