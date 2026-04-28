# Geospatial Management - Setup & Getting Started

## Quick Start (5 Minutes)

### 1. Run Database Migration
```bash
npm run migrate
```

This creates:
- `land_boundaries` table
- `land_surveys` table  
- `geospatial_audit_logs` table
- 13 RLS security policies
- Cluster table enhancements
- 5 automated triggers
- 9 performance indexes

### 2. Start the Application
```bash
npm run dev:all  # or npm run dev for frontend only
```

### 3. Navigate to Geospatial Features
```
1. Login to the app
2. Go to Clusters
3. Click on any cluster
4. Go to "Land Management" tab
5. You'll see the interactive map
```

## Features Overview

### Map View
- **See all boundaries** for the cluster on an interactive map
- **Click boundaries** to view details
- **Zoom in/out** with map controls
- **Export as GeoJSON** for external use
- **View statistics** in the sidebar

### Draw New Boundary
1. Click **"New Boundary"** button
2. **Draw polygon** by clicking points on the map
3. **Or draw rectangle** for regular plots
4. **Edit shapes** by dragging points
5. **Delete shapes** with the delete button
6. **View real-time area** calculation
7. **Save boundary** with a name

### Statistics
- Total boundaries
- Combined area (hectares)
- Average accuracy rating
- Verified boundaries count

### Survey Management
- Upload survey files (GPS, drone, satellite, etc.)
- Track accuracy and confidence
- Admin verification workflow
- Quality ratings

## Detailed Walkthrough

### Creating Your First Boundary

#### Step 1: Open a Cluster
```
Dashboard → Clusters → Select any cluster
```

#### Step 2: Go to Land Management
```
Click the "Land Management" tab
You'll see the map viewer and boundary list
```

#### Step 3: Click "New Boundary"
```
A drawing interface opens
Map appears with OpenStreetMap tiles
Leaflet-Draw controls visible on left
```

#### Step 4: Draw the Boundary
**Using Polygon Tool:**
1. Click "Draw a polygon" in the toolbar
2. Click map points to draw shape
3. Double-click to close polygon
4. Area calculates automatically

**Using Rectangle Tool:**
1. Click "Draw a rectangle" in the toolbar
2. Drag on map to create rectangle
3. Area calculates automatically

#### Step 5: Enter Details
```
Name: "North Field" (required)
Description: "Main cultivation area" (optional)
Accuracy: 1-5 stars
```

#### Step 6: Save
```
Click "Save Boundary"
Shows "Area: X.XX ha (Y,ZZZ m²)"
Boundary added to the list
```

### Editing a Boundary

1. **Open Land Management tab**
2. **Select boundary** from the list (left sidebar)
3. **Click "New Boundary"** to redraw
4. **Or view details** in info panel
5. **Click "Verify"** to mark as verified (admin)
6. **Click "Delete"** to remove

### Viewing Statistics

1. **Go to Land Management tab**
2. **Click "Stats" button/tab**
3. **See:**
   - Total number of boundaries
   - Combined area in hectares
   - Average accuracy rating
   - Count of verified boundaries

## Component Architecture

### Map Viewer (Read-Only)
- Display all boundaries
- Color-coded by index
- Click to select
- Popups with info
- Export GeoJSON

### Boundary Drawer (Create/Edit)
- Leaflet-Draw integration
- Polygon & rectangle tools
- Real-time area calculation
- Coordinate extraction
- Name input

### Geospatial Detail (Management)
- Tabbed interface
- Boundary list
- Map viewer
- Drawing interface
- Statistics
- Survey management

## API Quick Reference

### Create Boundary
```bash
POST /api/geospatial/boundaries
{
  "cluster_id": "uuid",
  "name": "North Field",
  "coordinates": [
    { "lat": 20.5, "lng": 0.5 },
    { "lat": 20.6, "lng": 0.5 },
    { "lat": 20.6, "lng": 0.6 }
  ],
  "accuracy_rating": 4
}
```

### Get Boundaries
```bash
GET /api/geospatial/boundaries/cluster/{clusterId}
```

### Update Boundary
```bash
PUT /api/geospatial/boundaries/{boundaryId}
{
  "name": "Updated Name",
  "accuracy_rating": 5
}
```

### Verify Boundary (Admin)
```bash
POST /api/geospatial/boundaries/{boundaryId}/verify
{
  "verified_notes": "Verified against satellite"
}
```

### Get Statistics
```bash
GET /api/geospatial/statistics/cluster/{clusterId}
```

### Upload Survey
```bash
POST /api/geospatial/surveys/upload
{
  "boundary_id": "uuid",
  "survey_type": "gps",
  "file_url": "https://...",
  "file_name": "survey.pdf",
  "file_size": 2048
}
```

## Understanding the Database

### Three New Tables

#### `land_boundaries`
Stores boundary polygons with:
- Coordinates array
- Calculated area
- GeoJSON representation
- Accuracy rating
- Verification status
- Owner/creator info

#### `land_surveys`
Stores survey file metadata:
- File URL and name
- Survey type
- Accuracy metrics
- Quality rating
- Verification status
- Processed status

#### `geospatial_audit_logs`
Complete change history:
- What changed
- Before/after geometry
- Who made change
- When it happened
- IP address logged

### Security (RLS Policies)

**Owners can:**
- View own cluster boundaries
- Create boundaries
- Edit boundaries
- Upload surveys
- Cannot verify (admin only)

**Tenants can:**
- View boundaries for leased clusters
- Cannot create/edit
- Cannot upload surveys

**Admins can:**
- See all boundaries
- Verify boundaries
- Verify surveys
- View all audit logs

## Common Tasks

### Task: Add a New Farm Plot
1. Open cluster
2. Go to "Land Management"
3. Click "New Boundary"
4. Draw plot on map
5. Enter plot name (e.g., "Plot A")
6. See area auto-calculate
7. Click "Save"

### Task: Verify a Boundary (Admin)
1. Select boundary from list
2. Click "Verify" button
3. Boundary marked verified
4. Timestamp recorded
5. Area becomes immutable

### Task: Track Total Land Area
1. Go to "Stats" tab
2. See total area in hectares
3. See combined area from all boundaries
4. See verification status

### Task: Export Boundary Data
1. Go to "Map" view
2. Click "Export" button (top right)
3. Download as GeoJSON
4. Use in GIS software
5. Share with partners

### Task: Upload Survey Data
1. Go to "Surveys" tab
2. Select boundary
3. Click "Upload"
4. Choose file (GPS/drone/satellite)
5. System processes
6. Admin verifies quality

## Coordinate System

All coordinates use **WGS84 (EPSG:4326)**:
- **Latitude**: -90 to +90 (North/South)
- **Longitude**: -180 to +180 (East/West)
- **Format**: `{lat: number, lng: number}`

### Example Coordinates
```javascript
// California
{ lat: 37.7749, lng: -122.4194 }

// Nigeria
{ lat: 9.0765, lng: 7.3986 }

// India
{ lat: 28.6139, lng: 77.2090 }
```

## Area Calculations

### Formula Used
- **Shoelace formula** with haversine distance
- **Accuracy**: ±5% for typical farm sizes
- **Unit**: Square meters (m²)
- **Conversion**: 1 hectare = 10,000 m²

### Example
```
Drawing: 4-point rectangle (200m × 250m)
Calculated: ~50,000 m² = 5 hectares ✓

Drawing: Complex polygon (irregular field)
Calculated: Area from 3+ points ✓
Accuracy: Within 5% ✓
```

## Troubleshooting

### Map Not Loading
**Problem**: Blank white map area
**Solution**:
- Wait 2-3 seconds for tiles to load
- Check internet connection
- Try zoom in/out
- Refresh page

### Area Calculation Wrong
**Problem**: Area doesn't match expected
**Solution**:
- Need minimum 3 points
- Check point order (clockwise/counter)
- Compare with GPS survey
- Accuracy rating 1-5 (lower = less accurate)

### Boundary Not Saving
**Problem**: "Boundary creation failed" error
**Solution**:
- Enter boundary name
- Ensure 3+ points are drawn
- Check you own the cluster
- Check database connection
- Try refreshing

### Permission Denied
**Problem**: Cannot create/edit boundaries
**Solution**:
- Only cluster owners can create
- Only admins can verify
- Check your role (owner/tenant/admin)
- Contact cluster owner

### Old Data Still Showing
**Problem**: Changes not appearing
**Solution**:
- Refresh the page
- Clear browser cache
- Check audit logs for changes
- Reload boundaries list

## Performance Tips

### For Large Clusters (100+ boundaries)
1. Use "Stats" instead of "Map" for viewing
2. Boundaries load on demand
3. Only selected boundary details fetch surveys
4. Pagination coming in future update

### Optimize Drawing
1. Use rectangle tool for regular plots
2. Keep points simple (don't over-detail)
3. Edit rather than redraw
4. Save frequently

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Esc** | Cancel drawing |
| **Delete** | Remove last point |
| **Enter** | Finish shape |
| **+** | Zoom in |
| **-** | Zoom out |

## Mobile Usage

### Supported
- ✅ View boundaries on map
- ✅ Select boundaries
- ✅ View details
- ✅ Zoom controls
- ✅ Export GeoJSON

### Limited
- ⚠ Drawing accuracy (touch-based)
- ⚠ Small screen map

**Recommendation**: Use desktop/tablet for drawing, mobile for viewing.

## Integration with Other Features

### Proposals
- Show boundary location
- Reference boundary ID
- Display area in proposal

### Agreements
- Store boundary reference
- Include area in contract
- Track leased vs available

### Payments
- Calculate rent per hectare
- Use area for calculations
- Track land-based revenue

### Analytics
- Show area distribution
- Land utilization stats
- Verification trends

## Next Steps

1. **Try Creating a Boundary**
   - Opens Cluster
   - Draws a simple rectangle
   - Names it
   - Saves it

2. **View on Map**
   - See colored polygon
   - Click to view details
   - Check calculated area

3. **Verify it (Admin)**
   - Select boundary
   - Click "Verify"
   - Confirm with timestamp

4. **View Statistics**
   - Go to "Stats" tab
   - See total area
   - See verification count

5. **Export Data**
   - Click "Export" on map
   - Get GeoJSON file
   - Use in other tools

## Additional Resources

- **Full Documentation**: See GEOSPATIAL_FEATURES.md
- **API Reference**: See BACKEND_SETUP.md
- **Architecture**: See ARCHITECTURE.md
- **Implementation**: See GEOSPATIAL_IMPLEMENTATION.md

## Support & Issues

### Check These First
1. Database migration ran: `npm run migrate`
2. Backend started: `npm run dev:server`
3. Frontend loaded: `npm run dev`
4. You're logged in as cluster owner
5. Cluster has valid location

### Debug Mode
```typescript
// In console
localStorage.debug = 'geospatial:*'
// See detailed logs
```

### Get Help
1. Check documentation files
2. Review component code comments
3. Check browser console for errors
4. Review database schema (SQL file)

---

**Ready to map your farmland!** 🗺️ Start with a simple rectangle boundary and grow from there.
