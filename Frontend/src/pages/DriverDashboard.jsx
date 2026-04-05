import { useState, useEffect, useCallback, useRef } from "react"
import MapComponent from "../components/map/MapComponent"
import { 
  LayoutDashboard, Bus, Map as MapIcon, Navigation, Calendar, 
  Users, Bell, MessageSquare, History, AlertCircle, Settings, 
  LogOut, Menu, X, Clock, User, Phone, Info, Activity, 
  ChevronRight, Camera, Play, Pause, Square, Plus, Minus, Search
} from "lucide-react"
import * as api from "../services/api"

function DriverDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isShiftActive, setIsShiftActive] = useState(true)
  const [isEmergency, setIsEmergency] = useState(false)
  const [tripStatus, setTripStatus] = useState("Idle") // Idle, Active, Paused
  const [passengerCount, setPassengerCount] = useState(12)
  const [maxCapacity] = useState(40)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastPing, setLastPing] = useState("Just now")
  const [assignedBus, setAssignedBus] = useState(null)
  const [routes, setRoutes] = useState([])
  const [autocomplete, setAutocomplete] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)
  const [driverData, setDriverData] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [notifications, setNotifications] = useState([
    { id: 1, type: "Alert", message: "Route update: New stop added to R-45.", date: "10m ago", read: false },
    { id: 2, type: "Log", message: "Maintenance check scheduled for Friday.", date: "1h ago", read: true }
  ])
  const [fleet, setFleet] = useState([])
  const [trips, setTrips] = useState([])
  const [newEta, setNewEta] = useState("")
  const [updatingEta, setUpdatingEta] = useState(false)
  const [broadcastStatus, setBroadcastStatus] = useState('idle') // idle | acquiring | active | error
  const assignedBusRef = useRef(null)


  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Keep ref in sync with state to avoid stale closures
  useEffect(() => {
    assignedBusRef.current = assignedBus;
  }, [assignedBus]);

  // Telemetry Transmission Loop (GPS Ping)
  useEffect(() => {
    let watchId = null;

    if (tripStatus === 'Active' && assignedBus) {
      if (!("geolocation" in navigator)) {
        setBroadcastStatus('error');
        alert("GPS not supported in this browser.");
        return;
      }

      setBroadcastStatus('acquiring');

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const busSnapshot = assignedBusRef.current;
          if (!busSnapshot) return;

          setBroadcastStatus('active');
          try {
            await api.editBus(busSnapshot.id, {
              ...busSnapshot,
              lat: latitude,
              lng: longitude,
              status: 'Active'
            });

            setAssignedBus(prev => ({
              ...prev,
              lat: latitude,
              lng: longitude,
              status: 'Active'
            }));

            setLastPing("Just now");
          } catch (err) {
            console.error("Telemetry Dropout", err);
          }
        },
        (error) => {
          console.error("GPS Signal Lost:", error);
          setBroadcastStatus('error');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else {
      setBroadcastStatus('idle');
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [tripStatus, assignedBus?.id]);

  const loadData = useCallback(async () => {
    try {
      // Priority 1: Auth Session (Manual Login)
      // Priority 2: Dispatch Token (Admin Portal Launch)
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const dispatchId = localStorage.getItem('driverId');
      
      let driver = null;
      
      if (userObj && userObj.role === 'driver') {
        const drivers = await api.getDrivers();
        driver = drivers.find(d => d.id === userObj.id || d.email === userObj.email);
      } else if (dispatchId) {
        driver = await api.getDriverById(dispatchId);
      }
      
      const [f, r, s] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getSchedules()
      ]);
      
      if (driver) setDriverData(driver);
      setFleet(f);
      setRoutes(r);
      setSchedules(s);

      const bus = (driver && f.find(b => b.id === driver.bus || b.name === driver.bus)) || 
                  f.find(b => b.driver === driver?.id || b.driver === driver?.name) ||
                  f.find(b => b.status === 'Active') || 
                  f[0];
                  
      if (bus) {
        setAssignedBus(bus);
        console.log("Tactics Linked: Bus Found", bus.id);
        
        // Verifying route connectivity
        const linkedRoute = r.find(r => r.id === bus.route || r.name === bus.route);
        if (!linkedRoute) {
            console.warn("Operational Gap: Bus identified but no tactical route linked in Registry", { busRoute: bus.route });
        }
      }
    } catch (err) {
      console.error("Failed to load driver data", err)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = () => {
    if (confirm("Are you sure you want to end your shift and logout?")) {
      api.logoutUser()
      window.location.href = "/"
    }
  }

  const handleEmergency = () => {
    setIsEmergency(true)
    alert("EMERGENCY SIGNAL BROADCASTED. LOCAL AUTHORITIES NOTIFIED.")
  }

  const handleUpdateEta = async (e) => {
    e.preventDefault();
    if (!assignedBus || !newEta) return;
    setUpdatingEta(true);
    try {
      await api.editBus(assignedBus.id, { ...assignedBus, eta: newEta });
      setAssignedBus({ ...assignedBus, eta: newEta });
      // Refresh local fleet data to sync
      const f = await api.getBuses();
      setFleet(f);
      alert("ETA Transmitted to Registry");
      setNewEta("");
    } catch (err) {
      alert("Transmission Failure: " + err.message);
    } finally {
      setUpdatingEta(false);
    }
  };

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "bus", icon: Bus, label: "Assigned Bus" },
    { id: "map", icon: MapIcon, label: "Live Location" },
    { id: "route", icon: Navigation, label: "Route Details" },
    { id: "schedule", icon: Calendar, label: "Trip Schedule" },
    { id: "passengers", icon: Users, label: "Passenger Count" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "report", icon: MessageSquare, label: "Report Issue" },
    { id: "history", icon: History, label: "Trip History" },
    { id: "emergency", icon: AlertCircle, label: "Emergency", color: "text-red-500" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]


  const getRouteStops = (routeStr) => {
    if (!routes || routes.length === 0 || !routeStr) return [];
    
    // Auth-grade lookup: Exact ID, Exact Name, or Start-of-Name matching
    const route = routes.find(r => 
      r.id === routeStr || 
      r.name === routeStr || 
      (r.name && routeStr && r.name.toLowerCase().startsWith(routeStr.toLowerCase())) ||
      (routeStr && r.id && routeStr.toLowerCase().startsWith(r.id.toLowerCase()))
    );

    if (route) {
        const stopsArray = route.stopNames?.length > 0 
            ? route.stopNames 
            : (route.stops_list ? route.stops_list.split(',').map(s => s.trim()) : [route.start, route.dest].filter(Boolean));
        
        return stopsArray.map((stop, i) => {
            const ratio = i / (stopsArray.length - 1 || 1);
            return {
                name: stop,
                lat: (route.startLat || 28.6139) + ((route.destLat || 28.7041) - (route.startLat || 28.6139)) * ratio,
                lng: (route.startLng || 77.2090) + ((route.destLng || 77.1025) - (route.startLng || 77.2090)) * ratio
            };
        });
    }
    return [];
  };

  const getRoutePath = (routeStr) => {
    const stops = getRouteStops(routeStr);
    if (stops.length >= 2) {
      return stops.map(s => [s.lat, s.lng]);
    }
    return [];
  };

  console.log("Rendering Driver Dashboard", { activeTab, driverData, assignedBus });
  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} transition-all duration-500 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <Activity size={20} className="text-white" />
          </div>
          {isSidebarOpen && <h1 className="text-xl font-black tracking-tighter">DRIVER HUB</h1>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} ${item.color || ''} transition-transform`} />
              {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-full flex items-center justify-center p-4 rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-24 bg-black/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Live Operation Feed</h2>
            <div className="flex items-center gap-3 text-lg font-black tracking-widest text-white">
              <Clock size={18} className="text-gray-500" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all relative"
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </button>
              {showNotifications && (
                <div className="absolute top-16 right-0 w-80 bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 shadow-2xl z-50 backdrop-blur-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">Command Center Alerts</h4>
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-white font-bold leading-tight">{n.message}</p>
                        <span className="text-[8px] text-gray-500 mt-1 block uppercase">{n.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-4 p-1 pr-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-red-600 flex items-center justify-center text-white">
                <User size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">{driverData?.name || "Driver 7734"}</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase">{driverData?.license || "Class-A Commercial"}</span>
              </div>
            </div>

            <button onClick={handleLogout} className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-10 pb-10">
          <div className="max-w-7xl mx-auto py-10 space-y-12 animate-fade-in-up">
            
            {activeTab === "dashboard" && (
              <div className="space-y-12">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Command <span className="text-red-500">Overview</span></h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Route {assignedBus?.route || "R-45"} • Bus #{assignedBus?.id || "N/A"}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isShiftActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${isShiftActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    {isShiftActive ? 'Duty Active' : 'Duty Suspended'}
                  </div>
                </div>

                {/* Dashboard Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(() => {
                    const stops = getRouteStops(assignedBus?.route);
                    const routeInfo = routes.find(r => r.id === assignedBus?.route || r.name === assignedBus?.route);
                    
                    return [
                      { label: "Assigned Bus", value: assignedBus?.name || "Initializing Unit...", sub: `ID: ${assignedBus?.id || 'N/A'}`, icon: Bus, color: "from-red-600 to-red-800" },
                      { label: "Route Link", value: routeInfo?.id || "NO_SYNC", sub: `TRACKING ID: ${routeInfo?.id ? '#' + routeInfo.id : 'N/A'}`, icon: Navigation, color: "from-amber-500 to-orange-600" },
                      { label: "Mission Readiness", value: `${stops.length >= 2 ? 'Routing Ready' : (assignedBus?.route ? 'Deployment Pending' : 'No Route Linked')}`, sub: `${stops.length >= 2 ? 'Tactical mission synchronized' : (assignedBus?.route ? 'Route registry data incomplete' : 'Fleet assignment required')}`, icon: Activity, color: "from-blue-600 to-indigo-700" },
                      { label: "Mission Checkpoints", value: `${stops.length > 0 ? stops.length.toString().padStart(2, '0') + ' Nodes' : 'Unlinked'}`, sub: `${stops.length > 0 ? 'Sector synchronization active' : 'Awaiting admin dispatch'}`, icon: Clock, color: "from-emerald-500 to-teal-600" },
                      { label: "Passenger Load", value: `${passengerCount}/${maxCapacity}`, sub: `${Math.round((passengerCount/maxCapacity)*100)}% Saturation`, icon: Users, color: "from-purple-600 to-pink-700" },
                      { label: "Today's Ledger", value: "Verified", sub: "Operational protocols active", icon: History, color: "from-gray-700 to-gray-900" }
                    ].map((card, i) => (
                      <div key={i} className="glass-card group p-8 relative overflow-hidden transition-all hover:-translate-y-2">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-5 blur-3xl`}></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-xl`}>
                            <card.icon size={24} />
                          </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 relative z-10">{card.label}</h3>
                        <p className="text-2xl font-black text-white uppercase tracking-tighter relative z-10">{card.value}</p>
                        <p className="text-[10px] font-bold text-gray-600 mt-2 relative z-10 italic uppercase tracking-widest">{card.sub}</p>
                      </div>
                    ));
                  })()}
                </div>

                {/* Map Preview */}
                <div className="glass-card p-12 bg-gradient-to-br from-red-600/5 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-10">
                    <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl shrink-0">
                        <Activity size={40} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter">Telemetric Link Active</h4>
                        <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 mt-2">Authoritative GPS synchronization in progress...</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                      {["GPS", "NET", "SAT"].map(sys => (
                          <div key={sys} className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-[10px] font-black uppercase tracking-widest">{sys}</span>
                          </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bus" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Assigned <span className="text-red-500">Bus Intelligence</span></h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-10 space-y-8">
                            <div className="w-24 h-24 bg-red-600/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
                                <Bus size={48} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-white">{assignedBus?.name || "EICHER 1110"}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-2">Registration Number: {assignedBus?.id || "N/A"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Model</p>
                                    <p className="text-sm font-bold">2024 Pro-Line</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Capacity</p>
                                    <p className="text-sm font-bold">40 Seats</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Service Life</p>
                                    <p className="text-sm font-bold">88% Remaining</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Last Maintenance</p>
                                    <p className="text-sm font-bold">3 days ago</p>
                                </div>
                            </div>
                            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Mechanical Status: OPTIMAL</p>
                            </div>
                        </div>
                        <div className="glass-card p-10 flex flex-col justify-center items-center text-center space-y-6">
                            <h4 className="text-xl font-black uppercase">Bus Command Checklist</h4>
                            <div className="space-y-4 w-full text-left">
                                {[
                                    "Brake Pressure Check",
                                    "Tire Pressure Alignment",
                                    "Fuel Reservoir Level",
                                    "Interior Sanitation",
                                    "GPS Telemetry Link"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "map" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Live <span className="text-red-500">Location Sharing</span></h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 glass-card p-0 h-[600px] relative rounded-[2.5rem] overflow-hidden">
                            <MapComponent 
                                center={{ lat: assignedBus?.lat || 28.6139, lng: assignedBus?.lng || 77.2090 }} 
                                markers={(() => {
                                    const others = fleet.filter(b => b.id !== assignedBus?.id);
                                    const all = assignedBus ? [...others, assignedBus] : others;
                                    return all.map(b => ({
                                        id: b.id,
                                        lat: b.lat || 28.6139,
                                        lng: b.lng || 77.2090,
                                        type: 'bus',
                                        status: b.status || 'Active',
                                        isMe: b.id === assignedBus?.id 
                                    }));
                                })()}
                                autoFollowId={assignedBus?.id}
                                selectedInfo={assignedBus}
                                onCloseInfo={() => {}}
                            />
                            <div className="absolute top-8 left-8 p-6 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Coordinates</p>
                                <p className="text-xs font-mono font-bold text-red-500">LAT: {assignedBus?.lat?.toFixed(6) || "0.00000"} • LNG: {assignedBus?.lng?.toFixed(6) || "0.00000"}</p>
                            </div>
                        </div>
                        <div className="glass-card p-10 flex flex-col justify-between items-center text-center">
                            <div className="space-y-8 w-full">
                                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border-4 ${tripStatus === 'Active' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                    <div className={`w-10 h-10 rounded-full ${tripStatus === 'Active' ? 'bg-green-500 animate-pulse shadow-[0_0_30px_#22c55e]' : 'bg-red-500 shadow-[0_0_30px_#ef4444]'}`}></div>
                                </div>
                                <h3 className="text-xl font-black uppercase">Transmission Status</h3>
                                <p className="text-gray-500 text-xs font-medium">Broadcast frequency: 10hz per second to satellite link.</p>
                                
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => {
                                            if (!assignedBus) {
                                                alert("No bus assigned. Cannot broadcast.");
                                                return;
                                            }
                                            setTripStatus('Active');
                                        }}
                                        disabled={tripStatus === 'Active'}
                                        className={`w-full flex items-center justify-center gap-4 p-5 rounded-3xl text-sm font-black uppercase tracking-widest transition-all ${
                                            tripStatus === 'Active' 
                                                ? 'bg-green-600/50 text-green-300 cursor-not-allowed' 
                                                : 'bg-green-600 shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95'
                                        }`}
                                    >
                                        <Play size={18} /> 
                                        {broadcastStatus === 'acquiring' ? 'Acquiring GPS...' : tripStatus === 'Active' ? 'Broadcasting Live' : 'Start Broadcasting'}
                                    </button>
                                    <button 
                                        onClick={() => setTripStatus('Paused')}
                                        disabled={tripStatus !== 'Active'}
                                        className={`w-full flex items-center justify-center gap-4 p-5 border rounded-3xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
                                            tripStatus !== 'Active'
                                                ? 'border-white/5 bg-white/3 text-gray-700 cursor-not-allowed'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Square size={16} /> Terminate Feed
                                    </button>
                                    {broadcastStatus === 'error' && (
                                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest italic text-center">GPS Signal Lost — Check Location Permissions</p>
                                    )}
                                    {broadcastStatus === 'active' && (
                                        <p className="text-[9px] font-black text-green-500 uppercase tracking-widest italic text-center flex items-center justify-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
                                            Live Position Transmitted
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 w-full space-y-6">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Live ETA Control</p>
                                    <form onSubmit={handleUpdateEta} className="flex gap-4">
                                        <input 
                                            type="text" 
                                            value={newEta}
                                            onChange={(e) => setNewEta(e.target.value)}
                                            placeholder={assignedBus?.eta || "e.g. 15 mins"} 
                                            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-red-500/50 transition-all placeholder:text-gray-700 italic"
                                        />
                                        <button 
                                            disabled={updatingEta}
                                            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white p-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95"
                                        >
                                            <Navigation size={18} />
                                        </button>
                                    </form>
                                </div>
                                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest italic border-t border-white/5 pt-4">Safety Protocol: Telemetry must remain active during operational hours.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "route" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Mission <span className="text-red-500">Route Map</span></h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 glass-card p-10">
                            <h4 className="text-xl font-black uppercase mb-10">Route Timeline</h4>
                            <div className="space-y-10 relative before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-white/5 max-h-[500px] overflow-y-auto scrollbar-hide pr-4">
                                {(() => {
                                    const stops = getRouteStops(assignedBus?.route);
                                    if (stops.length === 0) return <p className="text-xs text-gray-500 italic">No mission nodes identified.</p>;
                                    return stops.map((step, i) => {
                                        const status = i < 2 ? "Completed" : (i === 2 ? "Active" : "Pending");
                                        const time = `${8 + Math.floor(i * 15 / 60)}:${((i * 15) % 60).toString().padStart(2, '0')} AM`;
                                        return (
                                            <div key={i} className="flex gap-6 relative">
                                                <div className={`w-4 h-4 rounded-full mt-1.5 shrink-0 z-10 ${status === 'Completed' ? 'bg-green-500' : status === 'Active' ? 'bg-red-500 animate-ping' : 'bg-gray-700'}`}></div>
                                                {status === 'Active' && <div className="absolute w-4 h-4 bg-red-500 rounded-full mt-1.5 shrink-0 z-10 left-0"></div>}
                                                <div>
                                                    <p className={`text-sm font-black uppercase tracking-widest ${status === 'Completed' ? 'text-gray-600 line-through' : status === 'Active' ? 'text-white' : 'text-gray-400'}`}>{step.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock size={10} className="text-gray-500" />
                                                        <span className="text-[10px] font-bold text-gray-500">{time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                        <div className="lg:col-span-2 glass-card p-10 space-y-8 flex flex-col justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {(() => {
                                    const stops = getRouteStops(assignedBus?.route);
                                    return (
                                        <>
                                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                                                <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Total Nodes</p>
                                                <p className="text-4xl font-black text-white italic">{stops.length.toString().padStart(2, '0')}</p>
                                            </div>
                                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                                                <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Nodes Passed</p>
                                                <p className="text-4xl font-black text-green-500 italic">02</p>
                                            </div>
                                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                                                <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Efficiency</p>
                                                <p className="text-4xl font-black text-red-500 italic">98%</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="glass-card p-10 bg-gradient-to-br from-red-600/5 to-transparent border-red-500/10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                                        <Info size={32} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        {(() => {
                                            const route = routes.find(r => r.id === assignedBus?.route || r.name === assignedBus?.route);
                                            return <h4 className="text-lg font-black uppercase italic">ETA to {route?.dest || 'Mission Terminus'}</h4>;
                                        })()}
                                        <p className="text-3xl font-black text-white mt-2 tracking-tighter">{assignedBus?.eta || "45 MINUTES"} <span className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-4">Normal Traffic</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "schedule" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">My <span className="text-red-500">Trip Schedule</span></h2>
                    <div className="glass-card p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <th className="px-6 py-4">Bus Reg. Number</th>
                                        <th className="px-6 py-4">Route</th>
                                        <th className="px-6 py-4">Timetable</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.filter(s => !assignedBus || s.bus === assignedBus.id || s.route === assignedBus.route).map((schedule) => (
                                        <tr key={schedule.id} className="bg-white/5 hover:bg-white/10 transition-colors">
                                            <td className="px-6 py-6 rounded-l-2xl border-l border-t border-b border-white/5">
                                                <div className="flex items-center gap-4 text-sm font-bold text-white">
                                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">{schedule.bus}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 border-t border-b border-white/5">
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">{schedule.route}</span>
                                            </td>
                                            <td className="px-6 py-6 border-t border-b border-white/5">
                                                <span className="text-sm font-black text-white">{schedule.departure} &rarr; {schedule.arrival}</span>
                                            </td>
                                            <td className="px-6 py-6 border-t border-b border-white/5">
                                                <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-green-500/10 text-green-500">{schedule.status || 'Assigned'}</span>
                                            </td>
                                            <td className="px-6 py-6 rounded-r-2xl border-r border-t border-b border-white/5 text-right space-x-4">
                                                <button onClick={() => setActiveTab('route')} className="px-6 py-3 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all">Start Trip</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {schedules.filter(s => !assignedBus || s.bus === assignedBus.id || s.route === assignedBus.route).length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-6 text-center text-gray-500 italic text-sm border-t border-b border-l border-r border-white/5 rounded-2xl">No upcoming schedules found for your assignments.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "notifications" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Operational <span className="text-red-500">Alerts</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notifications.map(n => (
                            <div key={n.id} className={`glass-card p-8 group relative overflow-hidden ${!n.read ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${n.type === 'Alert' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-500'}`}>
                                        {n.type === 'Alert' ? <AlertCircle size={20} /> : <Info size={20} />}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{n.date}</span>
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">{n.type} Notification</h4>
                                <p className="text-xs text-gray-400 font-medium leading-relaxed">{n.message}</p>
                                {!n.read && (
                                    <button className="mt-6 text-[8px] font-black uppercase tracking-[0.3em] text-red-500 hover:text-white transition-colors">Mark as Read</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "report" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Issue <span className="text-red-500">Reporting</span></h2>
                    <div className="glass-card p-10 max-w-2xl mx-auto space-y-8">
                        <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                            <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                                <MessageSquare size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic">Report Incident</h3>
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">Direct link to Bus Logistics Hub</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Incident Type</label>
                                <select className="glass-input w-full p-5 text-xs font-black uppercase tracking-widest bg-black/40 border-white/5 focus:border-red-500 outline-none transition-all">
                                    <option>Mechanical Failure</option>
                                    <option>Road Obstruction</option>
                                    <option>Passenger Medical</option>
                                    <option>Unscheduled Delay</option>
                                    <option>Security Incident</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Description</label>
                                <textarea 
                                    className="glass-input w-full p-5 h-40 text-xs font-medium bg-black/40 border-white/5 focus:border-red-500 outline-none transition-all resize-none"
                                    placeholder="Provide detailed telemetric data or situational overview..."
                                ></textarea>
                            </div>
                            <button className="w-full py-6 bg-red-600 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-95 transition-all">
                                Submit Incident Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "history" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Mission <span className="text-red-500">Logs</span></h2>
                    <div className="glass-card p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <th className="px-6 py-4">Serial</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Route ID</th>
                                        <th className="px-6 py-4">Total Pax</th>
                                        <th className="px-6 py-4 text-right">Trip Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: "#TR-990", date: "MAR 12", route: "R-45", pax: "142", time: "1h 45m" },
                                        { id: "#TR-989", date: "MAR 11", route: "R-45", pax: "128", time: "1h 38m" },
                                        { id: "#TR-988", date: "MAR 11", route: "G-12", pax: "94", time: "55m" },
                                        { id: "#TR-987", date: "MAR 10", route: "R-45", pax: "156", time: "1h 50m" }
                                    ].map((log, i) => (
                                        <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors">
                                            <td className="px-6 py-6 rounded-l-2xl border-l border-t border-b border-white/5">
                                                <span className="text-xs font-black text-gray-500 tracking-widest">{log.id}</span>
                                            </td>
                                            <td className="px-6 py-6 border-t border-b border-white/5 text-sm font-black">{log.date}</td>
                                            <td className="px-6 py-6 border-t border-b border-white/5 text-xs text-red-500 font-black">{log.route}</td>
                                            <td className="px-6 py-6 border-t border-b border-white/5 text-xs text-white font-bold">{log.pax} PASSENGERS</td>
                                            <td className="px-6 py-6 rounded-r-2xl border-r border-t border-b border-white/5 text-right font-mono text-[10px] text-gray-400">
                                                {log.time}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "settings" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">System <span className="text-red-500">Parameters</span></h2>
                    <div className="max-w-2xl mx-auto space-y-6">
                        {[
                            { label: "Night Vision Mode (Dark Mode)", sub: "Always enabled in High-Performance mode.", value: true },
                            { label: "Predictive GPS Ping", sub: "Optimize telemetry frequency for battery efficiency.", value: true },
                            { label: "Collision Alerts", sub: "Audio-visual override on detected proximity.", value: false },
                            { label: "Voice Navigation (Command)", sub: "Automated route guidance via comms.", value: true }
                        ].map((setting, i) => (
                            <div key={i} className="glass-card p-8 flex items-center justify-between group hover:border-red-500/30 transition-all">
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-white">{setting.label}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium mt-1">{setting.sub}</p>
                                </div>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${setting.value ? 'bg-red-600' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${setting.value ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Global Footer */}
            <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-50 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center text-red-500 font-black text-[10px]">D-v1.4</div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">© 2026 BusRide Bus Command</p>
                </div>
                <div className="flex gap-8">
                    <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Command Centre</a>
                    <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Safety Protocols</a>
                    <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Driver Support</a>
                </div>
            </footer>

          </div>
        </div>
      </main>
    </div>
  )
}

export default DriverDashboard