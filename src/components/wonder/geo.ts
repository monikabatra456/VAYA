// src/components/wonder/geo.ts
import * as THREE from 'three';

/**
 * Verified formula from STEP 3:
 * phi = (90 - lat) * PI / 180
 * theta = (lon + 180) * PI / 180
 * x = -r * sin(phi) * cos(theta)
 * y = r * cos(phi)
 * z = r * sin(phi) * sin(theta)
 */
export function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

export function vec3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const r = v.length();
  if (r === 0) return { lat: 0, lon: 0 };
  const phi = Math.acos(Math.max(-1, Math.min(1, v.y / r)));
  const lat = 90 - (phi * 180) / Math.PI;
  const theta = Math.atan2(v.z, -v.x);
  let lon = (theta * 180) / Math.PI - 180;
  while (lon <= -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
}

/**
 * Computes camera-facing rotation angles (yaw, pitch) for a given lat/lon
 * so that when globeGroup.rotation.set(pitch, yaw, 0), this location faces (0, 0, 1) [camera].
 */
export function focusAngles(lat: number, lon: number): { yaw: number; pitch: number } {
  const pitch = (lat * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const yaw = Math.atan2(Math.cos(theta), Math.sin(theta));
  return { yaw, pitch };
}

export function shortest(a: number, b: number): number {
  let diff = (b - a) % (2 * Math.PI);
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

/**
 * Generates elevated great-circle quadratic bezier arc points between two 3D vectors on the globe.
 */
export function arcPoints(start: THREE.Vector3, end: THREE.Vector3, numPoints = 64): THREE.Vector3[] {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  const lift = Math.min(0.35, 0.08 + dist * 0.18);
  const midNorm = mid.clone().normalize();
  const ctrl = midNorm.multiplyScalar(1.0 + lift);

  const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
  return curve.getPoints(numPoints);
}

export function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i][0], xi = polygon[i][1];
    const yj = polygon[j][0], xj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
