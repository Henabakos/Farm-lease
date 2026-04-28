# Geospatial Management Features

Complete mapping and land boundary management system for the Farm Lease Platform.

## Overview

The geospatial management system provides comprehensive tools for:
- **Interactive Maps**: Leaflet-based maps with OSM (OpenStreetMap) tiles
- **Land Boundary Drawing**: Draw polygons and rectangles directly on the map
- **Automatic Metrics**: Calculate area (hectares/sqm) automatically
- **Survey Management**: Upload and verify survey files
- **Audit Logging**: Track all boundary and survey changes
- **Role-Based Access**: Owner, tenant, and admin controls

## Database Schema

### Tables Created

#### `land_boundaries`
Stores farm boundary polygons with coordinates and metrics.

```sql
Columns:
- id (UUID): Primary key
- cluster_id (UUID): Reference to farm_clusters
- created_by (UUID): User who created the boundary
- name (VARCHAR): Boundary name (e.g., "North Plot", "Field A")
- description (TEXT): Additional details
- geometry (JSONB): GeoJSON representation
- coordinates (JSONB): Array of {lat, lng} points
- area_sqm (DECIMAL): Square meters
- area_hectares (DECIMAL): Hectares
- perimeter_m (DECIMAL): Perimeter in meters
- accuracy_rating (INT): 1-5 rating
- survey_date (TIMESTAMP): Survey date
- source (VARCHAR): origin (manual_drawing, gps_survey, satellite, imported)
- is_active (BOOLEAN): Active status
- verified_at (TIMESTAMP): Verification timestamp
- verified_by (UUID): Verifying admin user
- created_at, updated_at (TIMESTAMP): Audit timestamps
```

#### `land_surveys`
Tracks survey file uploads and processing.

```sql
Columns:
- id (UUID): Primary key
- boundary_id (UUID): Reference to land_boundaries
- uploaded_by (UUID): Uploading user
- survey_type (VARCHAR): gps, drone, satellite, manual, cad
- file_url (VARCHAR): URL to survey file
- file_name, file_size (VARCHAR/INT): File metadata
- extracted_coordinates (JSONB): Parsed coordinates
- extracted_metrics (JSONB): Parsed area/perimeter
- accuracy_meters (DECIMAL): Survey accuracy
- confidence_score (DECIMAL): 0.0-1.0
- quality_rating (INT): 1-5
- status (VARCHAR): pending, processing, completed, failed
- is_verified (BOOLEAN): Admin verification status
- verified_at, verified_by (TIMESTAMP/UUID): Verification details
- created_at, updated_at (TIMESTAMP): Timestamps
```

#### `geospatial_audit_logs`
Complete audit trail of boundary and survey changes.

```sql
Columns:
- id (UUID): Primary key
- boundary_id (UUID): Reference to land_boundaries
- user_id (UUID): User who made the change
- action (VARCHAR): created, updated, verified, deleted
- change_details (JSONB): What changed
- old_geometry, new_geometry (JSONB): Before/after GeoJSON
- ip_address, user_agent (VARCHAR/TEXT): Request metadata
- created_at (TIMESTAMP): Change timestamp
```

### Cluster Enhancements

New columns added to `farm_clusters` table:
- `center_latitude`, `center_longitude`: Map center point
- `zoom_level`: Default zoom level
- `total_area_sqm`, `total_area_hectares`: Aggregated area
- `primary_boundary_id`: Main boundary reference
- `last_survey_date`: When survey was last added
- `has_verified_survey`: Boolean flag for verified surveys

## API Endpoints

All endpoints require authentication and are prefixed with `/api/geospatial`.

### Boundaries

#### GET `/boundaries/cluster/:clusterId`
Get all boundaries for a cluster.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cluster_id": "uuid",
      "name": "North Plot",
      "area_hectares": 5.25,
      "area_sqm": 52500,
      "coordinates": [
        { "lat": 20.5, "lng": 0.5 },
        { "lat": 20.6, "lng": 0.5 },
        { "lat": 20.6, "lng": 0.6 }
      ],
      "accuracy_rating": 4,
      "verified_at": "2026-04-28T10:00:00Z",
      "created_at": "2026-04-28T09:00:00Z"
    }
  ],
  "count": 1
}
```

#### GET `/boundaries/:boundaryId`
Get detailed boundary information with surveys and audit logs.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "North Plot",
    "area_hectares": 5.25,
    "surveys": [...],
    "auditLogs": [...]
  }
}
```

#### POST `/boundaries`
Create a new boundary from drawing.

**Request:**
```json
{
  "cluster_id": "uuid",
  "name": "North Plot",
  "description": "Optional description",
  "coordinates": [
    { "lat": 20.5, "lng": 0.5 },
    { "lat": 20.6, "lng": 0.5 },
    { "lat": 20.6, "lng": 0.6 }
  ],
  "accuracy_rating": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Boundary created successfully",
  "data": { ... }
}
```

#### PUT `/boundaries/:boundaryId`
Update boundary details and/or redraw.

**Request:**
```json
{
  "name": "Updated Name",
  "accuracy_rating": 5,
  "coordinates": [...]
}
```

#### POST `/boundaries/:boundaryId/verify`
Verify a boundary (admin only).

**Request:**
```json
{
  "verified_notes": "Verified against satellite imagery"
}
```

#### DELETE `/boundaries/:boundaryId`
Soft delete a boundary (marks as deleted, doesn't remove).

### Surveys

#### POST `/surveys/upload`
Upload survey file for a boundary.

**Request:**
```json
{
  "boundary_id": "uuid",
  "survey_type": "gps",
  "file_url": "https://...",
  "file_name": "survey_2026.pdf",
  "file_size": 2048,
  "accuracy_meters": 1.5,
  "confidence_score": 0.95,
  "quality_rating": 5
}
```

#### GET `/surveys/:surveyId`
Get survey details.

#### POST `/surveys/:surveyId/verify`
Verify a survey (admin only).

### Statistics

#### GET `/statistics/cluster/:clusterId`
Get cluster-wide geospatial statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "cluster_id": "uuid",
    "cluster_name": "Riverside Farm",
    "total_boundaries": 5,
    "total_area_hectares": 25.50,
    "avg_accuracy": 4.2,
    "verified_count": 4,
    "last_boundary_added": "2026-04-28T10:00:00Z"
  }
}
```

## Frontend Components

### MapViewer
Interactive map display component for viewing land boundaries.

```tsx
import { MapViewer } from '@/src/components/geospatial';

<MapViewer
  boundaries={boundaries}
  selectedBoundary={selectedBoundary}
  onBoundarySelect={(boundary) => setSelected(boundary)}
  centerLat={20}
  centerLng={0}
  zoomLevel={12}
  readonly={false}
/>
```

**Features:**
- Display multiple boundaries with different colors
- Click to select and view details
- Zoom in/out controls
- Export as GeoJSON
- Popup with boundary metrics
- Auto-fit bounds to boundaries

### BoundaryDrawer
Map interface for drawing new boundaries.

```tsx
import { BoundaryDrawer } from '@/src/components/geospatial';

<BoundaryDrawer
  onSave={(name, coordinates) => handleSave(name, coordinates)}
  onCancel={() => setShowDrawer(false)}
  centerLat={20}
  centerLng={0}
/>
```

**Features:**
- Draw polygons and rectangles
- Edit/delete drawn shapes
- Real-time area calculation
- Coordinate extraction
- Input for boundary name
- Save/cancel actions

### GeospatialClusterDetail
Complete geospatial management interface for a cluster.

```tsx
import { GeospatialClusterDetail } from '@/src/components/geospatial';

<GeospatialClusterDetail cluster={cluster} />
```

**Features:**
- Tabbed interface (Map, Draw, Surveys, Stats)
- Full boundary management
- Survey upload handling
- Statistics dashboard
- Real-time updates

## Services & Hooks

### `useGeospatial` Hook

Data management hook for geospatial operations.

```tsx
const {
  boundaries,
  selectedBoundary,
  surveys,
  statistics,
  loading,
  error,
  loadBoundaries,
  loadBoundaryDetails,
  createBoundary,
  updateBoundary,
  deleteBoundary,
  verifyBoundary,
  uploadSurvey,
  loadStatistics
} = useGeospatial(clusterId);
```

### `geospatialService`

API service functions for geospatial operations.

```typescript
// Get boundaries
const boundaries = await geospatialService.getBoundariesForCluster(clusterId);

// Create boundary
const boundary = await geospatialService.createBoundary(
  clusterId,
  'North Plot',
  coordinates,
  'Description',
  4 // accuracy
);

// Calculate area
const sqm = geospatialService.calculatePolygonArea(coordinates);
const hectares = geospatialService.sqmToHectares(sqm);
const formatted = geospatialService.formatArea(sqm, 'hectares');

// Verify boundary
await geospatialService.verifyBoundary(boundaryId, 'Notes');

// Upload survey
await geospatialService.uploadSurvey(
  boundaryId,
  'gps',
  fileUrl,
  fileName,
  fileSize
);
```

## Row-Level Security (RLS)

Comprehensive RLS policies control access:

**Owners:**
- View and manage their cluster boundaries
- Create new boundaries
- Upload surveys
- Cannot verify (admin only)

**Tenants:**
- View boundaries for clusters they're interested in
- Cannot create/modify boundaries
- Cannot upload surveys

**Admins:**
- Full access to all boundaries
- Can verify boundaries and surveys
- Can view audit logs

## Usage Example

### Complete Workflow

```tsx
function ClusterGeospatialPage() {
  const { cluster } = useParams();
  const { 
    boundaries, 
    createBoundary, 
    loadBoundaries 
  } = useGeospatial(cluster);

  useEffect(() => {
    loadBoundaries(cluster);
  }, [cluster]);

  const handleDrawBoundary = async (name, coords) => {
    const boundary = await createBoundary(name, coords);
    if (boundary) {
      toast.success('Boundary created!');
      loadBoundaries(cluster);
    }
  };

  return (
    <GeospatialClusterDetail 
      cluster={cluster}
    />
  );
}
```

## Technical Details

### Mapping Technology Stack

- **Leaflet.js**: Lightweight, open-source mapping library
- **React-Leaflet**: React bindings for Leaflet
- **Leaflet-Draw**: Drawing plugin for polygons/rectangles
- **OpenStreetMap**: Free tile layer (no API key needed)

### Area Calculation

Uses the shoelace formula with haversine distance for great-circle calculations:

```typescript
function calculatePolygonArea(coordinates: BoundaryCoordinates[]): number {
  // Accurate to ~5% for farm-sized areas
  // Result in square meters
}
```

### Coordinate System

- **Latitude/Longitude**: WGS84 (EPSG:4326)
- **Ranges**: 
  - Latitude: -90 to +90
  - Longitude: -180 to +180
- **Format**: `{lat: number, lng: number}`

### GeoJSON Format

Boundaries stored as GeoJSON FeatureCollection:

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [0.5, 20.5],
        [0.5, 20.6],
        [0.6, 20.6]
      ]]
    },
    "properties": {
      "type": "land_boundary"
    }
  }]
}
```

## Performance Considerations

- Boundaries are indexed by cluster_id for fast queries
- GeoJSON stored as JSONB for efficient querying
- Audit logs automatically cleaned (configurable retention)
- Lazy loading of surveys and audit logs

## Future Enhancements

- **Satellite Imagery**: Integrate Google Maps/Mapbox satellite layer
- **GPS Integration**: Real-time GPS tracking for survey data
- **3D Terrain**: Elevation data visualization
- **Batch Upload**: Import multiple boundaries from CSV/GeoJSON
- **Predictive Analytics**: Yield estimates based on terrain
- **Integration with Government Land Records**: Official cadastral data

## Troubleshooting

### Map Not Loading
- Ensure OpenStreetMap tiles are accessible
- Check CORS settings
- Verify coordinates are within valid ranges

### Area Calculation Seems Wrong
- Minimum 3 points required
- Shoelace algorithm accurate to ~5% for farm sizes
- For higher precision, use GPS survey uploads

### Boundaries Not Saving
- Check cluster ownership
- Verify authentication token
- Ensure coordinate array has at least 3 points
- Check database connection

## Testing

### Manual Testing Workflow

1. Create cluster
2. Navigate to Land Management tab
3. Draw boundary with 4+ points
4. Enter boundary name
5. Verify area calculation
6. Save boundary
7. Select boundary in list
8. View statistics
9. Upload survey (if available)
10. Verify boundary (admin only)

### Sample Test Data

```json
{
  "cluster": "Test Farm",
  "boundaries": [
    {
      "name": "Field A",
      "coordinates": [
        { "lat": 20.5, "lng": 0.5 },
        { "lat": 20.6, "lng": 0.5 },
        { "lat": 20.6, "lng": 0.6 },
        { "lat": 20.5, "lng": 0.6 }
      ]
    }
  ]
}
```

## API Rate Limiting

- 100 requests/minute per user
- Bulk operations: 10 requests/minute

## Support

For issues or questions:
1. Check GEOSPATIAL_FEATURES.md (this file)
2. Review database schema (02_add_geospatial.sql)
3. Check API endpoints (server/routes/geospatial.js)
4. Review component implementations
