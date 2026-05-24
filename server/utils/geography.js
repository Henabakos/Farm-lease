/**
 * Geography utilities for coordinate calculations.
 */

const EARTH_RADIUS = 6378137; // Earth's radius in meters

/**
 * Calculate new coordinates based on a base point and meter offsets.
 * 
 * @param {number} lat - Base latitude
 * @param {number} lng - Base longitude
 * @param {number} offsetX - Meters east (positive) or west (negative)
 * @param {number} offsetY - Meters north (positive) or south (negative)
 */
export function offsetCoordinates(lat, lng, offsetX, offsetY) {
  const dLat = offsetY / EARTH_RADIUS;
  const dLng = offsetX / (EARTH_RADIUS * Math.cos(Math.PI * lat / 180));

  return {
    latitude: lat + (dLat * 180 / Math.PI),
    longitude: lng + (dLng * 180 / Math.PI)
  };
}

/**
 * Generate a GeoJSON polygon for a rectangular plot.
 * 
 * @param {number} baseLat - Base latitude (anchor point)
 * @param {number} baseLng - Base longitude (anchor point)
 * @param {string} direction - 'left', 'right', 'top', 'bottom' relative to base
 * @param {number} width - Width in meters
 * @param {number} height - Height in meters
 */
export function generateRectangularPlot(baseLat, baseLng, direction, width, height) {
  let startX = 0;
  let startY = 0;

  switch (direction.toLowerCase()) {
    case 'left':
      startX = -width;
      startY = -height / 2;
      break;
    case 'right':
      startX = 0;
      startY = -height / 2;
      break;
    case 'top':
    case 'north':
      startX = -width / 2;
      startY = 0;
      break;
    case 'bottom':
    case 'south':
      startX = -width / 2;
      startY = -height;
      break;
    default: // Center
      startX = -width / 2;
      startY = -height / 2;
      break;
  }

  // Calculate 4 corners of the rectangle
  const p1 = offsetCoordinates(baseLat, baseLng, startX, startY);
  const p2 = offsetCoordinates(baseLat, baseLng, startX + width, startY);
  const p3 = offsetCoordinates(baseLat, baseLng, startX + width, startY + height);
  const p4 = offsetCoordinates(baseLat, baseLng, startX, startY + height);

  // Return GeoJSON Polygon
  return {
    type: 'Feature',
    properties: {
      width,
      height,
      direction,
      baseLat,
      baseLng
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [p1.longitude, p1.latitude],
        [p2.longitude, p2.latitude],
        [p3.longitude, p3.latitude],
        [p4.longitude, p4.latitude],
        [p1.longitude, p1.latitude] // Close the polygon
      ]]
    }
  };
}
