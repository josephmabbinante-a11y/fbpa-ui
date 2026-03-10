// Real-Time Driver Breadcrumb Variance Engine
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function detectRouteDeviation(gpsPoint, plannedRoutePoints) {
  let minDistance = Infinity;
  for (const point of plannedRoutePoints) {
    const dist = haversine(
      gpsPoint.lat,
      gpsPoint.lng,
      point.lat,
      point.lng
    );
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return {
    deviationMiles: minDistance,
    isOffRoute: minDistance > 3
  };
}

module.exports = { haversine, detectRouteDeviation };
