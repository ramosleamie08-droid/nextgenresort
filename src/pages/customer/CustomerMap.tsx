import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { locateOutline, refreshOutline, navigateOutline } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CustomerMap.css';

// Pansamantala: sentro ng Brgy. Bagong Buhay, Victoria, Oriental Mindoro.
// TODO: palitan ng exact coordinates ng Next Gen Pascual Resort.
// Sa Google Maps: right-click sa mismong resort, tapos i-click ang mga numero (lat, lng) para makopya.
const RESORT = { lat: 13.2002, lng: 121.2056, name: 'Next Gen Pascual Resort' };

// Optional: places the customer can pick quickly (for example barangays).
// Add the correct coordinates before using. Example:
// { label: 'Pinagsabangan', lat: 0.0, lng: 0.0 },
const PRESETS: { label: string; lat: number; lng: number }[] = [];

// Average speeds (km/h). Adjust as needed.
const MODES = [
  { key: 'walk', label: 'Walking', emoji: '🚶', speed: 5 },
  { key: 'run', label: 'Running', emoji: '🏃', speed: 9 },
  { key: 'bike', label: 'Bike', emoji: '🚲', speed: 15 },
  { key: 'tricycle', label: 'Tricycle', emoji: '🛺', speed: 25 },
  { key: 'motor', label: 'Motorcycle', emoji: '🏍️', speed: 40 },
  { key: 'car', label: 'Car', emoji: '🚗', speed: 40 },
];

type Point = { lat: number; lng: number; label: string };

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const formatTime = (minutes: number) => {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
};

const pin = (emoji: string, cls: string) =>
  L.divIcon({
    className: `cm-pin ${cls}`,
    html: `<span>${emoji}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });

const CustomerMap: React.FC = () => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarker = useRef<L.Marker | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const requestId = useRef(0);

  const [origin, setOrigin] = useState<Point | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [estimated, setEstimated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  // Create the map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return undefined;

    const map = L.map(mapEl.current, { zoomControl: true }).setView(
      [RESORT.lat, RESORT.lng],
      14
    );

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.marker([RESORT.lat, RESORT.lng], { icon: pin('📍', 'cm-pin-resort') })
      .addTo(map)
      .bindPopup(`<strong>${RESORT.name}</strong>`)
      .openPopup();

    // Tap anywhere on the map to set the starting point
    map.on('click', (e: L.LeafletMouseEvent) => {
      setOrigin({ lat: e.latlng.lat, lng: e.latlng.lng, label: 'Selected location' });
    });

    mapRef.current = map;

    // Needed because the map sits inside an IonContent
    const t = window.setTimeout(() => map.invalidateSize(), 300);

    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // When a starting point is chosen: add a marker and fetch the route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin) return;

    if (originMarker.current) originMarker.current.remove();
    originMarker.current = L.marker([origin.lat, origin.lng], {
      icon: pin('🧍', 'cm-pin-origin'),
    }).addTo(map);

    if (routeLayer.current) {
      routeLayer.current.remove();
      routeLayer.current = null;
    }

    const myId = ++requestId.current;
    setLoading(true);
    setError('');

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${RESORT.lng},${RESORT.lat}` +
      `?overview=full&geometries=geojson`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('route failed');
        return r.json();
      })
      .then((data) => {
        if (myId !== requestId.current) return;
        const route = data?.routes?.[0];
        if (!route) throw new Error('no route');

        const coords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        routeLayer.current = L.polyline(coords, {
          color: '#0b4b5e',
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

        setDistanceKm(route.distance / 1000);
        setEstimated(false);
        map.fitBounds(routeLayer.current.getBounds(), { padding: [40, 40] });
      })
      .catch(() => {
        if (myId !== requestId.current) return;
        // If the route can't be fetched, estimate using the straight-line distance
        const straight = haversineKm(origin, RESORT);
        routeLayer.current = L.polyline(
          [
            [origin.lat, origin.lng],
            [RESORT.lat, RESORT.lng],
          ],
          { color: '#0b4b5e', weight: 4, dashArray: '8 8' }
        ).addTo(map);
        setDistanceKm(straight * 1.3);
        setEstimated(true);
        setError('Could not get the route right now, so only an estimate is shown.');
        map.fitBounds(routeLayer.current.getBounds(), { padding: [40, 40] });
      })
      .finally(() => {
        if (myId === requestId.current) setLoading(false);
      });
  }, [origin]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Your device does not support location.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your location',
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Could not get your location. Please allow location access, or tap the map instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const reset = () => {
    requestId.current += 1;
    originMarker.current?.remove();
    originMarker.current = null;
    routeLayer.current?.remove();
    routeLayer.current = null;
    setOrigin(null);
    setDistanceKm(null);
    setError('');
    setLoading(false);
    mapRef.current?.setView([RESORT.lat, RESORT.lng], 14);
  };

  const googleDirections = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${RESORT.lat},${RESORT.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${RESORT.lat},${RESORT.lng}`;

  return (
    <div className="cm-wrap">
      <h2 className="cm-title">How to get to the resort</h2>
      <p className="cm-sub">
        Tap the map where you are coming from, or use your current location.
      </p>

      <div className="cm-actions">
        <button type="button" className="cm-btn cm-btn-primary" onClick={useMyLocation} disabled={locating}>
          <IonIcon icon={locateOutline} />
          {locating ? 'Locating...' : 'Use my location'}
        </button>

        {PRESETS.length > 0 && (
          <select
            className="cm-select"
            defaultValue=""
            onChange={(e) => {
              const p = PRESETS[Number(e.target.value)];
              if (p) setOrigin({ lat: p.lat, lng: p.lng, label: p.label });
            }}
          >
            <option value="" disabled>
              Choose a place
            </option>
            {PRESETS.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label}
              </option>
            ))}
          </select>
        )}

        {origin && (
          <button type="button" className="cm-btn cm-btn-ghost" onClick={reset}>
            <IonIcon icon={refreshOutline} />
            Reset
          </button>
        )}
      </div>

      <div className="cm-map" ref={mapEl} />

      {error && <div className="cm-error">{error}</div>}

      {!origin && (
        <div className="cm-hint">
          No starting point selected yet. Tap the map or the button above to see the travel time.
        </div>
      )}

      {origin && (
        <div className="cm-result">
          <div className="cm-summary">
            <div>
              <span className="cm-from">From</span>
              <strong>{origin.label}</strong>
            </div>
            <div className="cm-dist">
              {loading || distanceKm === null ? (
                <strong>Calculating...</strong>
              ) : (
                <>
                  <strong>{distanceKm.toFixed(1)} km</strong>
                  <span>{estimated ? 'estimated' : 'road distance'}</span>
                </>
              )}
            </div>
          </div>

          {!loading && distanceKm !== null && (
            <div className="cm-modes">
              {MODES.map((m) => (
                <div className="cm-mode" key={m.key}>
                  <span className="cm-mode-emoji">{m.emoji}</span>
                  <span className="cm-mode-label">{m.label}</span>
                  <strong>{formatTime((distanceKm / m.speed) * 60)}</strong>
                </div>
              ))}
            </div>
          )}

          <p className="cm-note">
            Times are estimates only. They are based on average speeds and the road distance, and may
            change depending on traffic, weather, and road conditions.
          </p>
        </div>
      )}

      <a className="cm-btn cm-btn-ghost cm-gmaps" href={googleDirections} target="_blank" rel="noreferrer">
        <IonIcon icon={navigateOutline} />
        Open in Google Maps
      </a>
    </div>
  );
};

export default CustomerMap;