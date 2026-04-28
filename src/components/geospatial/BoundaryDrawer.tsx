import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import LeafletDraw from 'leaflet-draw';
import { MapPin, Trash2, Save } from 'lucide-react';
import { calculatePolygonArea, formatArea } from '@/src/services/geospatial';

interface BoundaryDrawerProps {
  onSave: (name: string, coordinates: Array<{ lat: number; lng: number }>) => void;
  onCancel: () => void;
  initialCoordinates?: Array<{ lat: number; lng: number }>;
  centerLat?: number;
  centerLng?: number;
}

export function BoundaryDrawer({
  onSave,
  onCancel,
  initialCoordinates,
  centerLat = 20,
  centerLng = 0
}: BoundaryDrawerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnLayersRef = useRef<L.FeatureGroup | null>(null);
  const [name, setName] = useState('');
  const [area, setArea] = useState(0);
  const [coordinates, setCoordinates] = useState<Array<{ lat: number; lng: number }>>([]);
  const [loading, setLoading] = useState(false);

  // Initialize map with drawing capabilities
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current).setView([centerLat, centerLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Create feature group for drawings
    drawnLayersRef.current = new L.FeatureGroup();
    mapRef.current.addLayer(drawnLayersRef.current);

    // Add Leaflet Draw control
    const drawControl = new LeafletDraw({
      position: 'topleft',
      draw: {
        polygon: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.7,
            fill: true,
            fillOpacity: 0.3
          }
        },
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnLayersRef.current,
        remove: true
      }
    });

    mapRef.current.addControl(drawControl);

    // Handle draw events
    mapRef.current.on('draw:created', handleDrawCreated);
    mapRef.current.on('draw:edited', handleDrawEdited);
    mapRef.current.on('draw:deleted', handleDrawDeleted);

    // Load initial coordinates if provided
    if (initialCoordinates && initialCoordinates.length > 0) {
      const coords = initialCoordinates.map(c => [c.lat, c.lng] as [number, number]);
      const polygon = L.polygon(coords, {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.3
      });
      drawnLayersRef.current?.addLayer(polygon);
      setCoordinates(initialCoordinates);
      
      // Calculate area
      const sqm = calculatePolygonArea(initialCoordinates);
      setArea(sqm);

      // Auto-fit bounds
      const group = new L.FeatureGroup([polygon]);
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleDrawCreated = (e: any) => {
    const layer = e.layer;
    drawnLayersRef.current?.addLayer(layer);
    extractCoordinates();
  };

  const handleDrawEdited = (e: any) => {
    extractCoordinates();
  };

  const handleDrawDeleted = (e: any) => {
    extractCoordinates();
  };

  const extractCoordinates = () => {
    if (!drawnLayersRef.current) return;

    const coords: Array<{ lat: number; lng: number }> = [];

    drawnLayersRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0];
        latlngs.forEach((latlng: L.LatLng) => {
          coords.push({ lat: latlng.lat, lng: latlng.lng });
        });
      } else if (layer instanceof L.Rectangle) {
        const bounds = layer.getBounds();
        const ne = bounds.getNorthEast();
        const nw = bounds.getNorthWest();
        const sw = bounds.getSouthWest();
        const se = bounds.getSouthEast();
        coords.push(
          { lat: ne.lat, lng: ne.lng },
          { lat: nw.lat, lng: nw.lng },
          { lat: sw.lat, lng: sw.lng },
          { lat: se.lat, lng: se.lng }
        );
      }
    });

    setCoordinates(coords);

    // Calculate area
    if (coords.length >= 3) {
      const sqm = calculatePolygonArea(coords);
      setArea(sqm);
    } else {
      setArea(0);
    }
  };

  const handleClear = () => {
    drawnLayersRef.current?.clearLayers();
    setCoordinates([]);
    setArea(0);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a boundary name');
      return;
    }

    if (coordinates.length < 3) {
      alert('Please draw at least 3 points to create a boundary');
      return;
    }

    setLoading(true);
    try {
      await onSave(name, coordinates);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Draw Farm Boundary
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Click on the map to add points, then close the shape to create a boundary
        </p>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Stats overlay */}
        {area > 0 && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-border z-10">
            <p className="text-sm font-semibold text-foreground">
              Area: {formatArea(area, 'hectares')}
            </p>
            <p className="text-xs text-muted-foreground">
              {(area / 10000).toFixed(2)} hectares
            </p>
          </div>
        )}
      </div>

      {/* Form section */}
      <div className="border-t border-border p-4 bg-card space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Boundary Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., North Plot, Field A"
            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
        </div>

        {area > 0 && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{formatArea(area, 'hectares')}</span>
              <span className="text-muted-foreground ml-2">
                ({coordinates.length} points)
              </span>
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleClear}
            disabled={coordinates.length === 0 || loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={coordinates.length < 3 || !name.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Boundary'}
          </button>
        </div>
      </div>
    </div>
  );
}
