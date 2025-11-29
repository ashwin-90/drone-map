import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  Grid3x3,
  ChevronLeft,
  Search,
  Upload,
  Pencil,
  MousePointer,
  Maximize2,
  Compass,
  Plus,
  Minus,
  Trash2,
  Download,
} from 'lucide-react';

import type { LeafletMouseEvent } from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';

interface LatLng {
  lat: number;
  lng: number;
}

type ViewType = 'street' | 'satellite';

interface MapControllerProps {
  mapCenter: LatLng;
  zoom: number;
  setMapCenter: React.Dispatch<React.SetStateAction<LatLng>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  isDrawing: boolean;
  setDrawingPoints: React.Dispatch<React.SetStateAction<LatLng[]>>;
}

// Relax prop checking on leaflet components to avoid TS2322 issues
const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyCircleMarker = CircleMarker as any;

const MapController: React.FC<MapControllerProps> = ({
  mapCenter,
  zoom,
  setMapCenter,
  setZoom,
  isDrawing,
  setDrawingPoints,
}) => {
  const map = useMap();

  useEffect(() => {
    map.setView([mapCenter.lat, mapCenter.lng], zoom);
  }, [mapCenter, zoom, map]);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (isDrawing) {
        setDrawingPoints((prev) => [
          ...prev,
          { lat: e.latlng.lat, lng: e.latlng.lng },
        ]);
      }
    },
    moveend() {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
    },
    zoomend() {
      setZoom(map.getZoom());
    },
  });

  return null;
};

const DEFAULT_CENTER: LatLng = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;

const toRad = (deg: number) => (deg * Math.PI) / 180;

function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const si =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(si), Math.sqrt(1 - si));
  return R * c;
}

function perimeterKm(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += distanceKm(a, b);
  }
  return total;
}

function areaKm2(points: LatLng[]): number {
  if (points.length < 3) return 0;

  const R = 6378137;
  const projected = points.map((p) => {
    const x = (R * p.lng * Math.PI) / 180;
    const y =
      R * Math.log(Math.tan(Math.PI / 4 + (p.lat * Math.PI) / 360));
    return { x, y };
  });

  let sum = 0;
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i];
    const b = projected[(i + 1) % projected.length];
    sum += a.x * b.y - b.x * a.y;
  }

  const areaMeters2 = Math.abs(sum) / 2;
  return areaMeters2 / 1_000_000;
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<LatLng[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [activeDrawTool, setActiveDrawTool] = useState<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isGridOn, setIsGridOn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_ZOOM = 18;
  const MIN_ZOOM = 2;

  const activeShape: LatLng[] | null =
    drawnPolygon.length > 2
      ? drawnPolygon
      : drawingPoints.length > 2
      ? drawingPoints
      : null;

  const stats =
    activeShape != null
      ? {
          vertices: activeShape.length,
          perimeter: perimeterKm(activeShape),
          area: areaKm2(activeShape),
        }
      : null;

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&limit=1`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Network error');
      }

      const data: Array<{ lat: string; lon: string; display_name: string }> =
        await res.json();

      if (!data || data.length === 0) {
        setSearchError('Location not found');
        return;
      }

      const { lat, lon, display_name } = data[0];
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);

      setMapCenter({ lat: latNum, lng: lonNum });
      setZoom(11);
      setSelectedArea(display_name);
      setSearchError(null);
    } catch (err) {
      setSearchError('Error searching location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBack = () => {
    setSelectedArea('');
    setSearchQuery('');
    setDrawnPolygon([]);
    setDrawingPoints([]);
    setIsDrawing(false);
    setActiveDrawTool(null);
  };

  const handleHome = () => {
    setMapCenter(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
    setDrawnPolygon([]);
    setDrawingPoints([]);
    setSelectedArea('');
    setSearchQuery('');
    setIsDrawing(false);
    setActiveDrawTool(null);
  };

  const handleClearAOI = () => {
    setDrawnPolygon([]);
    setDrawingPoints([]);
    setIsDrawing(false);
    setActiveDrawTool(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const geojson = JSON.parse(text) as any;

        let coords: number[][][] | null = null;

        if (geojson.type === 'FeatureCollection') {
          const feature = geojson.features.find(
            (f: any) =>
              f.geometry &&
              (f.geometry.type === 'Polygon' ||
                f.geometry.type === 'MultiPolygon'),
          );
          if (feature) {
            if (feature.geometry.type === 'Polygon') {
              coords = feature.geometry.coordinates;
            } else if (feature.geometry.type === 'MultiPolygon') {
              coords = feature.geometry.coordinates[0];
            }
          }
        } else if (geojson.type === 'Feature') {
          if (geojson.geometry.type === 'Polygon') {
            coords = geojson.geometry.coordinates;
          } else if (geojson.geometry.type === 'MultiPolygon') {
            coords = geojson.geometry.coordinates[0];
          }
        } else if (geojson.type === 'Polygon') {
          coords = geojson.coordinates;
        }

        if (!coords || coords.length === 0) {
          alert('No polygon geometry found in GeoJSON.');
          return;
        }

        const ring = coords[0];
        const polygon: LatLng[] = ring.map((c) => ({
          lng: c[0],
          lat: c[1],
        }));

        setDrawnPolygon(polygon);
        setDrawingPoints([]);
        setIsDrawing(false);
        setActiveDrawTool(null);

        const lats = polygon.map((p) => p.lat);
        const lngs = polygon.map((p) => p.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

        setMapCenter({ lat: centerLat, lng: centerLng });
        setZoom(12);
        setSelectedArea(file.name);
      } catch (err) {
        console.error(err);
        alert('Failed to read GeoJSON file.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleApplyOutline = () => {
    if (!selectedArea) return;
    if (!activeShape) {
      alert('Draw or upload a shape first.');
      return;
    }
  };

  const toggleDrawing = () => {
    if (activeDrawTool === 'polygon') {
      if (drawingPoints.length > 2) {
        setDrawnPolygon(drawingPoints);
      }
      setDrawingPoints([]);
      setIsDrawing(false);
      setActiveDrawTool(null);
    } else {
      setDrawnPolygon([]);
      setDrawingPoints([]);
      setIsDrawing(true);
      setActiveDrawTool('polygon');
    }
  };

  const handlePointerMode = () => {
    setIsDrawing(false);
    setActiveDrawTool('pointer');
    setDrawingPoints([]);
  };

  const handleZoomToShape = () => {
    const pts = activeShape;
    if (!pts || pts.length === 0) return;

    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    setMapCenter({ lat: centerLat, lng: centerLng });
    setZoom(13);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setZoom(13);
        setSelectedArea('My Location');
      },
      () => {
        alert('Unable to retrieve your location.');
      },
    );
  };

  const toggleGrid = () => {
    setIsGridOn((prev) => !prev);
  };

  const handleExportGeoJSON = () => {
    if (!activeShape || activeShape.length < 3) {
      alert('No polygon to export.');
      return;
    }

    const coords = activeShape.map((p) => [p.lng, p.lat]);
    coords.push(coords[0]);

    const geojson = {
      type: 'Feature',
      properties: {
        name: selectedArea || 'Area of Interest',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'area-of-interest.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - 1));

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* LEFT WRAPPER: sidebar + panel */}
      <div className="flex flex-col md:flex-row w-full md:w-[28rem] shadow-md md:shadow-none">
        {/* SIDEBAR */}
        <div className="bg-gray-800 flex md:flex-col items-center md:items-center px-3 md:px-0 py-2 md:py-4 space-x-4 md:space-x-0 md:space-y-6">
          <div className="w-10 h-10 bg-orange-500 rounded-sm flex items-center justify-center">
            <div className="w-6 h-6 border-l-4 border-b-4 border-white transform rotate-45 -translate-x-1" />
          </div>

          <button
            className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center hover:bg-orange-600"
            onClick={handleHome}
          >
            <Home className="w-5 h-5 text-white" />
          </button>

          <button
            className={`w-10 h-10 rounded flex items-center justify-center hover:bg-gray-600 ${
              isGridOn ? 'bg-gray-600' : 'bg-gray-700'
            }`}
            onClick={toggleGrid}
          >
            <Grid3x3 className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* LEFT PANEL (AOI controls) */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="p-3 md:p-4 border-b flex items-center space-x-3">
            <button onClick={handleBack} className="p-2 rounded hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg md:text-xl text-orange-500 font-medium">
              Define Area of Interest
            </h1>
          </div>

          <div className="p-4 md:p-6 flex-1 flex flex-col overflow-y-auto">
            <p className="mb-3 md:mb-4 text-gray-600 text-sm md:text-base">
              Search or draw your area of interest:
            </p>

            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  placeholder="Search city..."
                  className="w-full border p-3 pl-9 rounded text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleSearch();
                    }
                  }}
                />
              </div>
              <div className="min-h-[18px] text-xs text-gray-500">
                {isSearching && <span>Searching…</span>}
                {!isSearching && searchError && (
                  <span className="text-red-500">{searchError}</span>
                )}
                {!isSearching && !searchError && selectedArea && (
                  <span className="text-gray-500 truncate">
                    Selected: {selectedArea}
                  </span>
                )}
              </div>
            </div>

            <button
              className="w-full mt-4 flex items-center justify-center border p-3 rounded text-gray-600 text-sm hover:bg-gray-50"
              onClick={handleUploadClick}
            >
              <Upload className="mr-2 w-4 h-4" /> Upload Shape File (GeoJSON)
            </button>
            <input
              type="file"
              accept=".json,.geojson"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedArea && (
              <button
                onClick={handleApplyOutline}
                className="w-full mt-4 text-white px-4 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 text-sm"
              >
                Apply Outline as Base Area
              </button>
            )}

            {/* Stats Panel */}
            <div className="mt-4 md:mt-6 p-4 bg-gray-50 rounded border text-xs text-gray-700">
              <div className="flex justify-between mb-1">
                <span>Center</span>
                <span>
                  {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Zoom level</span>
                <span>{zoom}</span>
              </div>
              {stats ? (
                <>
                  <div className="flex justify-between mb-1">
                    <span>Vertices</span>
                    <span>{stats.vertices}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Perimeter</span>
                    <span>{stats.perimeter.toFixed(2)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Area</span>
                    <span>{stats.area.toFixed(2)} km²</span>
                  </div>
                </>
              ) : (
                <div className="mt-1 text-gray-400">
                  Draw or upload a polygon to see stats.
                </div>
              )}
            </div>

            {/* Export / clear */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExportGeoJSON}
                className="flex-1 flex items-center justify-center px-3 py-2 text-xs rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
                disabled={!activeShape}
              >
                <Download className="w-3 h-3 mr-2" />
                Export AOI (GeoJSON)
              </button>
              <button
                onClick={handleClearAOI}
                className="flex items-center justify-center px-3 py-2 text-xs rounded border border-red-400 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAP SECTION */}
      <div className="flex-1 relative min-h-[320px] md:min-h-0">
        <AnyMapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          className="w-full h-full"
        >
          {view === 'street' ? (
            <AnyTileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <AnyTileLayer
              attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}

          {drawnPolygon.length > 0 && (
            <Polygon
              pathOptions={{ color: 'orange' }}
              positions={drawnPolygon.map((p) => [p.lat, p.lng])}
            />
          )}

          {drawingPoints.length > 0 && (
            <>
              <Polyline
                pathOptions={{ color: 'orange' }}
                positions={drawingPoints.map((p) => [p.lat, p.lng])}
              />
              {drawingPoints.map((p, i) => (
                <AnyCircleMarker
                  key={i}
                  center={[p.lat, p.lng]}
                  radius={5}
                  pathOptions={{
                    color: 'orange',
                    fillColor: 'orange',
                    fillOpacity: 1,
                  }}
                />
              ))}
            </>
          )}

          <MapController
            mapCenter={mapCenter}
            zoom={zoom}
            setMapCenter={setMapCenter}
            setZoom={setZoom}
            isDrawing={isDrawing}
            setDrawingPoints={setDrawingPoints}
          />
        </AnyMapContainer>

        {/* Grid overlay */}
        {isGridOn && (
          <div className="pointer-events-none absolute inset-0 z-[500] opacity-40">
            <div className="w-full h-full grid grid-cols-4 sm:grid-cols-6 grid-rows-4 border border-gray-400" />
          </div>
        )}

        {/* Zoom buttons */}
        <div className="absolute top-4 right-4 space-y-2 z-[1000]">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white shadow rounded hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white shadow rounded hover:bg-gray-50"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Drawing / map tools */}
        <div className="absolute bottom-4 right-4 p-2 md:p-3 bg-gray-900 rounded text-white flex space-x-2 z-[1000]">
          <button
            data-testid="draw-polygon-btn"
            onClick={toggleDrawing}
            className={`p-2 rounded ${
              activeDrawTool === 'polygon' ? 'bg-orange-500' : 'bg-gray-700'
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handlePointerMode}
            className={`p-2 rounded ${
              activeDrawTool === 'pointer' ? 'bg-orange-500' : 'bg-gray-700'
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomToShape}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleLocateMe}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* View toggle */}
        <div className="absolute bottom-4 left-4 flex text-sm z-[1000]">
          <button
            className={`px-3 md:px-4 py-2 rounded-l ${
              view === 'street'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700'
            }`}
            onClick={() => setView('street')}
          >
            Street
          </button>
          <button
            className={`px-3 md:px-4 py-2 rounded-r ${
              view === 'satellite'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700'
            }`}
            onClick={() => setView('satellite')}
          >
            Satellite
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
