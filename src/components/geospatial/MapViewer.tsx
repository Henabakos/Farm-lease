import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { LandBoundary } from '@/src/services/geospatial';

interface MapViewerProps {
  boundaries: LandBoundary[];
  selectedBoundary?: LandBoundary | null;
  onBoundarySelect?: (boundary: LandBoundary) => void;
  centerLat?: number;
  centerLng?: number;
  zoomLevel?: number;
  readonly?: boolean;
}

const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export function MapViewer({
  boundaries = [],
  selectedBoundary,
  onBoundarySelect,
  centerLat = 20,
  centerLng = 0,
  zoomLevel = 5,
  readonly = false
}: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.Layer }>({});
  const [zoom, setZoom] = useState(zoomLevel);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current).setView([centerLat, centerLng], zoom);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add zoom controls
      mapRef.current.zoomControl.setPosition('topright');

      // Track zoom changes
      mapRef.current.on('zoomend', () => {
        setZoom(mapRef.current?.getZoom() || zoomLevel);
      });
    }

    return () => {
      // Don't destroy map on unmount
    };
  }, []);

  // Update boundaries on map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing layers
    Object.values(layersRef.current).forEach(layer => mapRef.current?.removeLayer(layer));
    layersRef.current = {};

    // Add boundaries
    boundaries.forEach((boundary, index) => {
      const color = colors[index % colors.length];
      const isSelected = selectedBoundary?.id === boundary.id;

      if (boundary.coordinates && boundary.coordinates.length > 0) {
        const coords = boundary.coordinates.map(c => [c.lat, c.lng] as [number, number]);

        // Draw polygon
        const polygon = L.polygon(coords, {
          color: color,
          weight: isSelected ? 3 : 2,
          opacity: isSelected ? 1 : 0.7,
          fillOpacity: isSelected ? 0.4 : 0.2,
          dashArray: isSelected ? '' : '5, 5'
        }).addTo(mapRef.current);

        layersRef.current[boundary.id] = polygon;

        // Add click handler
        polygon.on('click', () => {
          onBoundarySelect?.(boundary);
        });

        // Add popup
        const popupContent = `
          <div class="p-2">
            <p class="font-semibold text-sm">${boundary.name}</p>
            <p class="text-xs text-gray-600">${boundary.area_hectares.toFixed(2)} ha</p>
            <p class="text-xs text-gray-600">${boundary.area_sqm.toFixed(0)} m²</p>
          </div>
        `;
        polygon.bindPopup(popupContent);
      }
    });

    // Auto-fit bounds if boundaries exist
    if (boundaries.length > 0) {
      const group = new L.FeatureGroup(Object.values(layersRef.current));
      try {
        mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
      } catch (e) {
        // Bounds might be invalid for single point
      }
    }
  }, [boundaries, selectedBoundary, onBoundarySelect]);

  const handleExport = () => {
    const data = {
      boundaries: boundaries.map(b => ({
        name: b.name,
        area_hectares: b.area_hectares,
        coordinates: b.coordinates,
        accuracy: b.accuracy_rating
      }))
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'boundaries.geojson');
    link.click();
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors border border-border"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors border border-border"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5 text-foreground" />
        </button>
        {boundaries.length > 0 && (
          <button
            onClick={handleExport}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors border border-border"
            title="Export as GeoJSON"
          >
            <Download className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Info panel */}
      {selectedBoundary && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10 border border-border">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{selectedBoundary.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Area: {selectedBoundary.area_hectares.toFixed(2)} ha ({selectedBoundary.area_sqm.toFixed(0)} m²)
              </p>
              <p className="text-xs text-muted-foreground">
                Accuracy: {selectedBoundary.accuracy_rating}/5
              </p>
              {selectedBoundary.verified_at && (
                <p className="text-xs text-green-600 font-medium mt-1">✓ Verified</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {boundaries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="bg-white rounded-lg p-6 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No boundaries to display</p>
          </div>
        </div>
      )}
    </div>
  );
}
