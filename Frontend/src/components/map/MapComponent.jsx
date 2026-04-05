import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Target, Eye, Bus as BusIcon, User, Route, Activity, X, MapPin, Search } from 'lucide-react';

// Fix for default Leaflet icon issues in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom red icon for buses
const busIcon = L.divIcon({
    className: 'custom-bus-icon',
    html: `<div style="background-color: #dc2626; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Custom icon for route start
const startIcon = L.divIcon({
    className: 'route-start-icon',
    html: `<div style="background-color: #22c55e; width: 12px; height: 12px; border-radius: 2px; border: 2px solid white; box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Custom icon for route end
const endIcon = L.divIcon({
    className: 'route-end-icon',
    html: `<div style="background-color: #ef4444; width: 12px; height: 12px; transform: rotate(45deg); border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Custom icon for checkpoints
const stopIcon = L.divIcon({
    className: 'route-stop-icon',
    html: `<div style="background-color: white; width: 8px; height: 8px; border-radius: 50%; border: 2px solid #374151;"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4]
});

function SelectedInfo({ info, onToggleFollow, isFollowing, onClose }) {
    const cardRef = useRef(null);

    useEffect(() => {
        if (cardRef.current) {
            L.DomEvent.disableClickPropagation(cardRef.current);
            L.DomEvent.disableScrollPropagation(cardRef.current);
        }
    }, []);

    if (!info) return null;

    return (
        <div ref={cardRef} className="absolute top-32 right-10 z-[1000] w-72 animate-fade-in pointer-events-auto">
            <div className="glass-card p-6 border-white/10 bg-black/60 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600 opacity-5 blur-3xl"></div>
                
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-30 bg-white/5 rounded-lg hover:bg-white/10"
                    title="Close"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xl">
                        <BusIcon size={20} />
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${info.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {info.status || 'Active'}
                    </div>
                </div>

                <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none mb-1 text-white">{info.name || info.id}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">{info.id}</p>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                            <Route size={12} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 leading-none mb-1">Assigned Route</p>
                            <p className="text-[10px] font-bold text-gray-300 uppercase">{info.route || 'Line-40 Express'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                            <User size={12} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 leading-none mb-1">Operator</p>
                            <p className="text-[10px] font-bold text-gray-300 uppercase">{info.driver || 'Rajan Kumar'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-red-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 italic">Telemetry Synced</span>
                    </div>
                    {onToggleFollow && (
                        <button 
                            onClick={onToggleFollow}
                            className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-widest transition-all ${isFollowing ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Eye size={12} />
                            {isFollowing ? 'Tracking' : 'Follow'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function MapSearch() {
    const map = useMap();
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchLabel, setSearchLabel] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const debounceTimer = useRef(null);

    useEffect(() => {
        if (searchRef.current) {
            L.DomEvent.disableClickPropagation(searchRef.current);
            L.DomEvent.disableScrollPropagation(searchRef.current);
        }
    }, [map]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        
        setSearching(true);
        setShowSuggestions(false);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                map.flyTo([parseFloat(lat), parseFloat(lon)], 15);
                setSearchLabel(display_name.split(',')[0]);
                setQuery("");
            } else {
                alert("Location not found in registry.");
            }
        } catch (err) {
            console.error("Geocoding Failure", err);
        } finally {
            setSearching(false);
        }
    };

    const fetchSuggestions = async (val) => {
        if (val.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`);
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (err) {
            console.error("Suggestion Failure", err);
        }
    };

    const onInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => fetchSuggestions(val), 500);
    };

    const selectSuggestion = (s) => {
        const { lat, lon, display_name } = s;
        map.flyTo([parseFloat(lat), parseFloat(lon)], 15);
        setSearchLabel(display_name.split(',')[0]);
        setQuery("");
        setShowSuggestions(false);
    };

    return (
        <div ref={searchRef} className="absolute top-10 right-10 z-[1001] w-80 animate-fade-in group pointer-events-auto">
            <form onSubmit={handleSearch} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-red-500 transition-colors pointer-events-none">
                    <Search size={16} />
                </div>
                <input 
                    type="text" 
                    value={query}
                    onChange={onInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.stopPropagation();
                        }
                    }}
                    placeholder="Search Location..." 
                    className="w-full bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-red-500/50 transition-all italic shadow-2xl"
                />
                {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 glass-card bg-black/90 backdrop-blur-3xl border-white/10 overflow-hidden animate-fade-in-up">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-6 py-4 border-b border-white/5 last:border-0 hover:bg-red-600/20 transition-all group"
                        >
                            <p className="text-[10px] font-black text-white uppercase tracking-wider mb-1 line-clamp-1">{s.display_name.split(',')[0]}</p>
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest line-clamp-1 italic">{s.display_name.split(',').slice(1).join(',').trim()}</p>
                        </button>
                    ))}
                </div>
            )}

            {searchLabel && !showSuggestions && (
                <div className="mt-3 px-4 py-2 bg-red-600 rounded-xl text-[8px] font-black uppercase tracking-widest text-white shadow-xl animate-fade-in-up flex items-center gap-2 italic">
                    <MapPin size={10} /> {searchLabel}
                </div>
            )}
        </div>
    );
}

function MapControls({ center, zoom, isFollowing, setIsFollowing, hasFollowTarget }) {
    const map = useMap();
    const controlsRef = useRef(null);

    useEffect(() => {
        if (controlsRef.current) {
            L.DomEvent.disableClickPropagation(controlsRef.current);
            L.DomEvent.disableScrollPropagation(controlsRef.current);
        }
    }, [map]);

    const handleLocate = () => {
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, map.getZoom());
            L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
        });
    };

    const handleRecenter = () => {
        if (center) {
            map.flyTo(center, zoom || 13);
            if (hasFollowTarget) setIsFollowing(true);
        }
    };

    return (
        <div ref={controlsRef} className="absolute bottom-10 right-10 z-[1000] flex flex-col gap-4">
            <button 
                onClick={handleLocate}
                className="w-12 h-12 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-2xl group"
                title="Locate Me"
            >
                <Navigation size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
                onClick={handleRecenter}
                className="w-12 h-12 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-2xl group"
                title="Recenter on Bus"
            >
                <Target size={20} className="group-hover:scale-110 transition-transform" />
            </button>
        </div>
    );
}

function MapEvents({ setIsFollowing, onMapClick }) {
    useMapEvents({
        dragstart: () => {
            setIsFollowing(false);
        },
        zoomstart: () => {
            setIsFollowing(false);
        },
        click: (e) => {
            if (onMapClick) {
                onMapClick(e.latlng);
            }
        }
    });
    return null;
}

function RecenterMap({ center, zoom, autoFollowId, markers, isFollowing }) {
    const map = useMap();
    const lastPos = useRef(null);

    useEffect(() => {
        if (!isFollowing) return;

        let targetPos = center;

        if (autoFollowId) {
            const targetMarker = markers.find(m => (m.id || m.email) === autoFollowId);
            if (targetMarker) {
                targetPos = [targetMarker.lat, targetMarker.lng];
            }
        }

        if (targetPos) {
            const currentPosJson = JSON.stringify(targetPos);
            if (lastPos.current !== currentPosJson) {
                map.flyTo(targetPos, zoom || map.getZoom(), {
                    animate: true,
                    duration: 1.5
                });
                lastPos.current = currentPosJson;
            }
        }
    }, [center, zoom, autoFollowId, markers, isFollowing, map]);

    return null;
}

function MapComponent({ center, zoom = 13, markers = [], onMarkerClick = null, autoFollowId = null, selectedInfo = null, onCloseInfo = null, routePath = [], stops = [], onMapClick = null }) {
    const [isFollowing, setIsFollowing] = useState(!!autoFollowId);
    const [hoveredInfo, setHoveredInfo] = useState(null);
    const [isCardClosed, setIsCardClosed] = useState(false);

    // Reset closed state when selection changes
    useEffect(() => {
        if (selectedInfo) {
            setIsCardClosed(false);
        }
    }, [selectedInfo?.id]);

    useEffect(() => {
        if (autoFollowId) setIsFollowing(true);
    }, [autoFollowId]);

    const activeInfo = isCardClosed ? (hoveredInfo || null) : (selectedInfo || hoveredInfo);

    return (
        <MapContainer 
            center={center || [28.6139, 77.2090]} 
            zoom={zoom} 
            style={{ width: '100%', height: '100%', borderRadius: '2rem', background: '#0a0a0a' }}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            <MapSearch />
            <MapEvents setIsFollowing={setIsFollowing} onMapClick={onMapClick} />
            <RecenterMap 
                center={center} 
                zoom={zoom} 
                autoFollowId={autoFollowId} 
                markers={markers} 
                isFollowing={isFollowing} 
            />
            
            <SelectedInfo 
                info={activeInfo} 
                onToggleFollow={autoFollowId ? () => setIsFollowing(!isFollowing) : null}
                isFollowing={isFollowing}
                onClose={() => {
                    if (selectedInfo) {
                        setIsCardClosed(true);
                    }
                    setHoveredInfo(null);
                    onCloseInfo && onCloseInfo();
                }}
            />

            <MapControls 
                center={center} 
                zoom={zoom} 
                isFollowing={isFollowing} 
                setIsFollowing={setIsFollowing}
                hasFollowTarget={!!autoFollowId}
            />

            {/* Render Route Polyline */}
            {routePath && routePath.length > 0 && (
                <Polyline 
                    positions={routePath} 
                    color="#dc2626" 
                    weight={4} 
                    opacity={0.6} 
                    dashArray="10, 15"
                />
            )}

            {/* Render Stops/Checkpoints */}
            {stops && stops.map((stop, i) => {
                const pos = [
                    stop.lat || stop.position?.[0] || stop.startLat || stop.destLat,
                    stop.lng || stop.position?.[1] || stop.startLng || stop.destLng
                ];
                let icon = stopIcon;
                if (i === 0) icon = startIcon;
                else if (i === stops.length - 1) icon = endIcon;

                return (
                    <Marker 
                        key={stop.id || i} 
                        position={pos} 
                        icon={icon}
                    >
                        <Popup>
                            <div className="p-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{i === 0 ? 'Start' : i === stops.length - 1 ? 'Destination' : `Stop ${i}`}</p>
                                <p className="text-xs font-bold">{stop.name}</p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Render Regular Markers (Buses, etc.) */}
            {markers.map((m, i) => {
                const pos = [
                    m.lat || m.position?.[0],
                    m.lng || m.position?.[1]
                ];
                return (
                    <Marker 
                        key={m.id || m.email || i} 
                        position={pos} 
                        icon={m.type === 'bus' ? busIcon : DefaultIcon}
                        eventHandlers={{
                            click: () => {
                                setIsCardClosed(false);
                                onMarkerClick && onMarkerClick(m);
                            },
                            mouseover: () => setHoveredInfo(m.data || m),
                            mouseout: () => setHoveredInfo(null)
                        }}
                    >
                        {m.popup && <Popup>{m.popup}</Popup>}
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

export default MapComponent;
