import { api } from './api';

export interface BoundaryCoordinates {
  lat: number;
  lng: number;
}

export interface LandBoundary {
  id: string;
  cluster_id: string;
  created_by: string;
  name: string;
  description?: string;
  geometry: any;
  coordinates: BoundaryCoordinates[];
  area_sqm: number;
  area_hectares: number;
  perimeter_m?: number;
  accuracy_rating: number;
  survey_date: string;
  source: string;
  is_active: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LandSurvey {
  id: string;
  boundary_id: string;
  uploaded_by: string;
  survey_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  extracted_coordinates?: any;
  extracted_metrics?: any;
  accuracy_meters: number;
  confidence_score: number;
  quality_rating: number;
  status: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

export interface BoundaryStatistics {
  cluster_id: string;
  cluster_name: string;
  total_boundaries: number;
  total_area_hectares: number;
  avg_accuracy: number;
  verified_count: number;
  last_boundary_added: string;
}

// Get all boundaries for a cluster
export async function getBoundariesForCluster(clusterId: string) {
  const response = await api.get(`/geospatial/boundaries/cluster/${clusterId}`);
  return response.data.data;
}

// Get single boundary with details
export async function getBoundaryDetails(boundaryId: string) {
  const response = await api.get(`/geospatial/boundaries/${boundaryId}`);
  return response.data.data;
}

// Create new boundary from drawing
export async function createBoundary(
  clusterId: string,
  name: string,
  coordinates: BoundaryCoordinates[],
  description?: string,
  accuracyRating?: number
) {
  const response = await api.post('/geospatial/boundaries', {
    cluster_id: clusterId,
    name,
    description,
    coordinates,
    accuracy_rating: accuracyRating || 3,
    survey_date: new Date().toISOString(),
    geometry: createGeoJSONFromCoordinates(coordinates)
  });
  return response.data.data;
}

// Update boundary
export async function updateBoundary(
  boundaryId: string,
  updates: Partial<{
    name: string;
    description: string;
    coordinates: BoundaryCoordinates[];
    accuracy_rating: number;
  }>
) {
  const response = await api.put(`/geospatial/boundaries/${boundaryId}`, updates);
  return response.data.data;
}

// Verify boundary (admin only)
export async function verifyBoundary(boundaryId: string, notes?: string) {
  const response = await api.post(`/geospatial/boundaries/${boundaryId}/verify`, {
    verified_notes: notes
  });
  return response.data.data;
}

// Delete boundary (soft delete)
export async function deleteBoundary(boundaryId: string) {
  await api.delete(`/geospatial/boundaries/${boundaryId}`);
  return true;
}

// Upload survey file
export async function uploadSurvey(
  boundaryId: string,
  surveyType: string,
  fileUrl: string,
  fileName: string,
  fileSize: number,
  extractedCoordinates?: any,
  extractedMetrics?: any,
  accuracyMeters?: number,
  confidenceScore?: number,
  qualityRating?: number
) {
  const response = await api.post('/geospatial/surveys/upload', {
    boundary_id: boundaryId,
    survey_type: surveyType,
    file_url: fileUrl,
    file_name: fileName,
    file_size: fileSize,
    extracted_coordinates: extractedCoordinates,
    extracted_metrics: extractedMetrics,
    accuracy_meters: accuracyMeters || 0,
    confidence_score: confidenceScore || 0.8,
    quality_rating: qualityRating || 3
  });
  return response.data.data;
}

// Get survey details
export async function getSurveyDetails(surveyId: string) {
  const response = await api.get(`/geospatial/surveys/${surveyId}`);
  return response.data.data;
}

// Verify survey (admin only)
export async function verifySurvey(surveyId: string, notes?: string) {
  const response = await api.post(`/geospatial/surveys/${surveyId}/verify`, {
    verification_notes: notes
  });
  return response.data.data;
}

// Get cluster statistics
export async function getClusterStatistics(clusterId: string): Promise<BoundaryStatistics> {
  const response = await api.get(`/geospatial/statistics/cluster/${clusterId}`);
  return response.data.data;
}

// Calculate polygon area using shoelace formula
export function calculatePolygonArea(coordinates: BoundaryCoordinates[]): number {
  if (!coordinates || coordinates.length < 3) return 0;

  const R = 6371000; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const { lat: lat1, lng: lng1 } = coordinates[i];
    const { lat: lat2, lng: lng2 } = coordinates[(i + 1) % coordinates.length];

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    area += distance * distance;
  }

  return Math.abs(area / 2);
}

// Convert area from sqm to hectares
export function sqmToHectares(sqm: number): number {
  return sqm / 10000;
}

// Convert area from hectares to sqm
export function hectaresToSqm(hectares: number): number {
  return hectares * 10000;
}

// Format area display
export function formatArea(sqm: number, unit: 'sqm' | 'hectares' = 'hectares'): string {
  if (unit === 'hectares') {
    const hectares = sqmToHectares(sqm);
    return `${hectares.toFixed(2)} ha`;
  }
  return `${sqm.toFixed(0)} m²`;
}

// Helper function to create GeoJSON from coordinates
function createGeoJSONFromCoordinates(coordinates: BoundaryCoordinates[]): any {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates.map(({ lat, lng }) => [lng, lat])]
      },
      properties: {
        type: 'land_boundary'
      }
    }]
  };
}

// Validate coordinates
export function validateCoordinates(coordinates: BoundaryCoordinates[]): boolean {
  if (!Array.isArray(coordinates) || coordinates.length < 3) {
    return false;
  }

  return coordinates.every(coord => {
    const { lat, lng } = coord;
    return typeof lat === 'number' && typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180;
  });
}

export default {
  getBoundariesForCluster,
  getBoundaryDetails,
  createBoundary,
  updateBoundary,
  verifyBoundary,
  deleteBoundary,
  uploadSurvey,
  getSurveyDetails,
  verifySurvey,
  getClusterStatistics,
  calculatePolygonArea,
  sqmToHectares,
  hectaresToSqm,
  formatArea,
  validateCoordinates
};
