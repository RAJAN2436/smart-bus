import { useState, useEffect, useCallback } from "react"
import MapComponent from "../components/map/MapComponent"
import { User, Bell, LogOut, Map as MapIcon, Calendar, Clock, Heart, History, HelpCircle, MessageSquare, Save, Camera, Search, LayoutDashboard, Settings, Info, Menu, X, ChevronRight, Navigation } from "lucide-react"
import * as api from "../services/api"
function UserDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedBus, setSelectedBus] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [savedTrips, setSavedTrips] = useState(["R-45 City Centre Express"])
  const [favouriteRouteIds, setFavouriteRouteIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favouriteRoutes') || '[]'); }
    catch { return []; }
  })
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 })
  const [autocomplete, setAutocomplete] = useState(null)
  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 9876543210",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    id: "USER-001"
  })
  const [feedback, setFeedback] = useState({ type: "General Feedback", message: "" })
  const [notifications, setNotifications] = useState([
    { id: 1, type: "Alert", message: "Bus R-45 is arriving in 5 minutes.", date: "Just now", read: false },
    { id: 2, type: "System", message: "Route change on Sector 62 starting tomorrow.", date: "2 hours ago", read: true }
  ])
  const [showNotifications, setShowNotifications] = useState(false)


  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [trips, setTrips] = useState([])
  const [schedules, setSchedules] = useState([])
  const [userPos] = useState({ lat: 28.6139, lng: 77.2090 }) // Mock user position (New Delhi)

  // Distance helper (Haversine formula in KM)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return (R * c).toFixed(1)
  }

  const loadData = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId')
      const [bData, rData, tData, sData] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getTrips(),
        api.getSchedules()
      ])
      setBuses(bData)
      setRoutes(rData)
      setTrips(tData)
      setSchedules(sData)

      if (userId) {
        const uData = await api.getUserById(userId)
        if (uData && !uData.error) {
          setUserProfile({
            name: uData.name,
            email: uData.email,
            phone: uData.phone || "+91 9876543210",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uData.name}`,
            id: uData.id
          })
        }
      }
    } catch (err) {
      console.error("Failed to load passenger data", err)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
  ]

  // Mock Data
  const nearbyStops = [
    { name: "Main Bus Stand", distance: "0.2 mi", routes: ["R-45", "R-12"] },
    { name: "Oak Street", distance: "0.5 mi", routes: ["R-88"] },
    { name: "University Campus", distance: "0.8 mi", routes: ["R-12", "R-88"] },
  ]

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.geometry && place.geometry.location) {
        setMapCenter({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        })
        setActiveTab("map")
      }
    }
  }

  const toggleSavedTrip = (routeName) => {
    if (savedTrips.includes(routeName)) {
      setSavedTrips(savedTrips.filter(t => t !== routeName))
    } else {
      setSavedTrips([...savedTrips, routeName])
    }
  }

  const toggleFavourite = (routeId) => {
    setFavouriteRouteIds(prev => {
      const updated = prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId];
      localStorage.setItem('favouriteRoutes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      api.logoutUser()
      window.location.href = "/"
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      // In a real app, we'd find the user by their ID
      // await api.editUser(userProfile.id, userProfile)
      alert("Profile updated successfully!")
    } catch (err) {
      console.error("Failed to update profile", err)
    }
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    try {
      const fbData = {
        id: `FB-${Date.now()}`,
        userName: userProfile.name,
        userEmail: userProfile.email,
        ...feedback
      }
      await api.addFeedback(fbData)
      alert("Feedback submitted. Thank you!")
      setFeedback({ type: "General Feedback", message: "" })
    } catch (err) {
      console.error("Failed to submit feedback", err)
    }
  }

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard Home" },
    { id: "map", icon: MapIcon, label: "Live Bus Tracking" },
    { id: "route", icon: Navigation, label: "Live Route Map" },
    { id: "schedule", icon: Clock, label: "Bus Timetable" },
    { id: "search", icon: Search, label: "Search Bus / Route" },
    { id: "saved", icon: Heart, label: "Favourite Routes" },
    { id: "history", icon: History, label: "Trip History" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "support", icon: MessageSquare, label: "Report Issue" },
    { id: "help", icon: HelpCircle, label: "Help / Support" },
  ]

  const getRouteStops = (routeStr) => {
    if (!routes || !routeStr) return [];
    const route = routes.find(r => r.id === routeStr || r.name === routeStr || r.name.startsWith(routeStr));
    if (route) {
      const stopsArray = route.stopNames?.length > 0 
        ? route.stopNames 
        : (route.stops_list ? route.stops_list.split(',').map(s => s.trim()) : [route.start, route.dest].filter(Boolean));
      
      return stopsArray.map((stop, i) => {
        const ratio = i / (stopsArray.length - 1 || 1);
        return {
          name: stop,
          lat: (route.startLat || 28.6139) + ((route.destLat || 28.7041) - (route.startLat || 28.6139)) * ratio,
          lng: (route.startLng || 77.2090) + ((route.destLng || 77.1015) - (route.startLng || 77.2090)) * ratio
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

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-24'} transition-all duration-500 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50`}
      >
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <MapIcon size={20} className="text-white" />
          </div>
          {isSidebarOpen && (
            <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 animate-fade-in-right">
              BUSRIDE
            </h1>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-red-500 text-white shadow-[0_10px_30px_rgba(239,68,68,0.2)]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
              {isSidebarOpen && (
                <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap animate-fade-in-right">
                  {item.label}
                </span>
              )}
              {activeTab === item.id && isSidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
              )}
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
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search Bus, Route or Station..." 
                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-sm outline-none focus:border-red-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 ml-10">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all relative"
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute top-16 right-0 w-96 bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 shadow-2xl z-50 animate-fade-in-down backdrop-blur-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">System Alerts</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white font-black text-[10px] uppercase">Mark All as Read</button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.read ? 'border-white/5 bg-white/5 opacity-50' : 'border-red-500/20 bg-red-500/5'}`}>
                        <div className="flex gap-4">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.type === 'Alert' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                          <div>
                            <p className="text-xs text-white font-medium leading-relaxed">{n.message}</p>
                            <span className="text-[8px] text-gray-500 mt-2 block font-black uppercase tracking-widest">{n.date} • {n.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 p-1 pr-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">{userProfile.name}</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest italic">Passenger</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group"
            >
              <LogOut size={20} className="mx-auto group-hover:rotate-12 transition-transform" />
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
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Dashboard <span className="text-red-500">Overview</span></h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Welcome back, {userProfile.name.split(' ')[0]}! Here's what's happening on your routes.</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    System Status: Normal
                  </div>
                </div>

                {/* Dashboard Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { title: "Live Buses Nearby", value: buses.filter(b => b.status === 'Active').length, icon: MapIcon, color: "from-blue-500 to-indigo-600", tab: "map" },
                    { title: "Upcoming Arrival", value: "8 Mini", icon: Clock, color: "from-red-500 to-red-600", tab: "schedule" },
                    { title: "Favourite Routes", value: savedTrips.length, icon: Heart, color: "from-amber-500 to-orange-600", tab: "saved" },
                    { title: "Total Trips", value: "42", icon: History, color: "from-emerald-500 to-teal-600", tab: "history" }
                  ].map((card, i) => (
                    <div 
                      key={i} 
                      onClick={() => setActiveTab(card.tab)}
                      className="glass-card group p-8 relative overflow-hidden transition-all hover:-translate-y-2 hover:border-red-500/30 cursor-pointer"
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
                      <div className="flex items-center justify-between mb-8">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-xl`}>
                          <card.icon size={24} />
                        </div>
                        <ChevronRight className="text-gray-700 group-hover:text-red-500 transition-colors" size={20} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2">{card.title}</h3>
                      <p className="text-4xl font-black text-white tracking-tighter">{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Activities / Map Preview */}
                <div className="grid grid-cols-1 gap-8">
                  <div className="glass-card p-10">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <History className="text-red-500" size={20} /> Quick History
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(trips.length > 0 ? trips.slice(0, 6) : []).map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-1">{h.route}</p>
                            <span className="text-[10px] text-gray-500 font-bold">{new Date(h.createdAt || h.date || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${h.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {h.status || 'Active'}
                          </span>
                        </div>
                      ))}
                      {trips.length === 0 && <p className="text-xs text-gray-500 italic p-6">No recent history.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "map" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Live <span className="text-red-500">Tracking</span></h2>
                  <button onClick={loadData} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                    <Clock size={14} className="text-red-500" /> Refresh Location
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 glass-card p-0 h-[600px] relative overflow-hidden group border-white/5">
                      <MapComponent 
                        center={mapCenter} 
                        zoom={12}
                        markers={buses.map((bus) => ({
                          id: bus.id,
                          lat: bus.lat,
                          lng: bus.lng,
                          type: 'bus',
                          status: bus.status
                        }))}
                        autoFollowId={selectedBus?.id}
                        selectedInfo={selectedBus}
                        onCloseInfo={() => setSelectedBus(null)}
                        onMarkerClick={(m) => {
                          const bus = buses.find(b => b.id === m.id);
                          setSelectedBus(bus);
                          setMapCenter({ lat: m.lat, lng: m.lng });
                        }}
                      />
                  </div>
                  <div className="glass-card p-8 h-[600px] overflow-y-auto scrollbar-hide flex flex-col space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 italic">Available Buses</h4>
                    <div className="space-y-4">
                      {buses.map(bus => (
                        <button
                          key={bus.id}
                          onClick={() => {
                            setSelectedBus(bus);
                            setMapCenter({ lat: bus.lat || 28.6139, lng: bus.lng || 77.2090 });
                          }}
                          className={`w-full p-5 rounded-2xl border transition-all duration-300 text-left group relative overflow-hidden ${selectedBus?.id === bus.id ? 'bg-red-600/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <div className={`text-lg font-black italic tracking-tighter leading-none mb-1 ${selectedBus?.id === bus.id ? 'text-white' : 'text-gray-300'}`}>{bus.id}</div>
                              <div className={`text-[8px] font-black uppercase tracking-widest ${selectedBus?.id === bus.id ? 'text-red-400' : 'text-gray-500'}`}>{bus.route}</div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${bus.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{bus.status}</span>
                            </div>
                            <span className="text-[10px] text-white font-bold">{bus.capacity || 50} Seats</span>
                          </div>
                          {selectedBus?.id === bus.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                          )}
                        </button>
                      ))}
                      {buses.length === 0 && (
                        <p className="text-xs text-gray-500 font-medium italic text-center py-10">No active buses available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === "route" && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Live <span className="text-red-500">Route Map</span></h2>
                    
                    {!selectedBus ? (
                        <div className="glass-card p-20 text-center space-y-6">
                            <Navigation size={48} className="mx-auto text-gray-700 animate-pulse" />
                            <p className="text-gray-500 font-black uppercase tracking-[0.3em] italic">No active bus selected for tracking.</p>
                            <button onClick={() => setActiveTab('schedule')} className="btn-primary px-8">Select from Timetable</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 glass-card p-10">
                                <h4 className="text-xl font-black uppercase mb-10">Route Timeline</h4>
                                <div className="space-y-10 relative before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-white/5 max-h-[500px] overflow-y-auto scrollbar-hide pr-4">
                                    {(() => {
                                        const routeData = routes.find(r => r.id === selectedBus.route || r.name === selectedBus.route);
                                        const stops = routeData?.stopNames?.length > 0 
                                            ? routeData.stopNames 
                                            : (routeData?.stops_list ? routeData.stops_list.split(',').map(s => s.trim()) : [routeData?.start, routeData?.dest].filter(Boolean));
                                        
                                        if (!stops || stops.length === 0) return <p className="text-xs text-gray-500 italic">No nodes identified for this route.</p>;

                                        return stops.map((stop, i) => {
                                            const status = i < 2 ? "Completed" : (i === 2 ? "Active" : "Pending");
                                            return (
                                                <div key={i} className="flex gap-6 relative">
                                                    <div className={`w-4 h-4 rounded-full mt-1.5 shrink-0 z-10 ${status === 'Completed' ? 'bg-green-500' : status === 'Active' ? 'bg-red-500' : 'bg-gray-700'}`}></div>
                                                    {status === 'Active' && <div className="absolute w-4 h-4 bg-red-500 rounded-full mt-1.5 shrink-0 z-10 left-0 animate-ping"></div>}
                                                    <div>
                                                        <p className={`text-sm font-black uppercase tracking-widest ${status === 'Completed' ? 'text-gray-600 line-through' : status === 'Active' ? 'text-white' : 'text-gray-400'}`}>{stop}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Clock size={10} className="text-gray-500" />
                                                            <span className="text-[10px] font-bold text-gray-500">{new Date(Date.now() + i * 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                        const routeData = routes.find(r => r.id === selectedBus.route || r.name === selectedBus.route);
                                        const totalStops = routeData?.stops || routeData?.stopNames?.length || 0;
                                        return (
                                            <>
                                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Total Nodes</p>
                                                    <p className="text-4xl font-black text-white italic">{totalStops.toString().padStart(2, '0')}</p>
                                                </div>
                                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Completed</p>
                                                    <p className="text-4xl font-black text-green-500 italic">02</p>
                                                </div>
                                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Remaining</p>
                                                    <p className="text-4xl font-black text-red-500 italic">{(Math.max(0, totalStops - 2)).toString().padStart(2, '0')}</p>
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
                                            <h4 className="text-lg font-black uppercase italic">ETA to Destination</h4>
                                            <p className="text-3xl font-black text-white mt-2 tracking-tighter">{selectedBus?.eta || "18 MINUTES"} <span className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-4">Normal Traffic</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Bus <span className="text-red-500">Timetables</span></h2>
                <div className="glass-card p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <th className="px-6 py-4">Bus Reg. Number</th>
                          <th className="px-6 py-4">Route</th>
                          <th className="px-6 py-4">Departure</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((schedule) => (
                          <tr key={schedule.id} className="bg-white/5 hover:bg-white/10 transition-colors group">
                            <td className="px-6 py-6 rounded-l-2xl border-l border-t border-b border-white/5">
                              <div className="flex items-center gap-4 text-sm font-bold text-white">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">{schedule.bus}</div>
                                {schedule.route}
                              </div>
                            </td>
                            <td className="px-6 py-6 border-t border-b border-white/5">
                              <span className="text-xs font-black uppercase tracking-widest text-gray-400">{schedule.route}</span>
                            </td>
                            <td className="px-6 py-6 border-t border-b border-white/5">
                              <span className="text-sm font-black text-white">{schedule.departure} &rarr; {schedule.arrival}</span>
                            </td>
                            <td className="px-6 py-6 border-t border-b border-white/5">
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${schedule.status === 'Confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{schedule.status || 'Timetabled'}</span>
                            </td>
                            <td className="px-6 py-6 rounded-r-2xl border-r border-t border-b border-white/5 text-right">
                              <button onClick={() => {
                                const matchedBus = buses.find(b => b.id === schedule.bus || b.route === schedule.route);
                                if (matchedBus) setSelectedBus(matchedBus);
                                setActiveTab('map')
                              }} className="px-6 py-3 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all">Track</button>
                            </td>
                          </tr>
                        ))}
                        {schedules.length === 0 && (
                          <tr>
                             <td colSpan="5" className="px-6 py-6 text-center text-gray-500 italic text-sm border-t border-b border-l border-r border-white/5 rounded-2xl">No upcoming schedules found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "search" && (() => {
              const q = searchQuery.toLowerCase().trim();
              const filteredRoutes = q.length === 0 ? routes : routes.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.start?.toLowerCase().includes(q) ||
                r.dest?.toLowerCase().includes(q) ||
                r.id?.toLowerCase().includes(q) ||
                (r.stopNames || []).some(s => s.toLowerCase().includes(q))
              );
              const filteredBuses = q.length === 0 ? buses : buses.filter(b =>
                b.id?.toLowerCase().includes(q) ||
                b.name?.toLowerCase().includes(q) ||
                b.route?.toLowerCase().includes(q) ||
                b.driver?.toLowerCase().includes(q)
              );
              return (
                <div className="space-y-8 animate-fade-in">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Search <span className="text-red-500">Bus / Route</span></h2>

                  {/* Search Input */}
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors pointer-events-none">
                      <Search size={20} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by route name, stop, origin or destination..."
                      className="w-full bg-black/60 backdrop-blur-3xl border border-white/10 focus:border-red-500/50 rounded-2xl pl-14 pr-6 py-5 text-sm font-semibold text-white outline-none transition-all placeholder:text-gray-600"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Stats Bar */}
                  <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">{filteredRoutes.length} Routes Found</span>
                    <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">{filteredBuses.length} Buses Found</span>
                  </div>

                  {/* Routes Results */}
                  {filteredRoutes.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 italic">Matching Routes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredRoutes.map(r => (
                          <div key={r.id} className="glass-card p-8 hover:border-red-500/30 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-600/5 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
                            <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Navigation size={20} className="text-red-500" />
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFavourite(r.id); }}
                                  title={favouriteRouteIds.includes(r.id) ? 'Remove from favourites' : 'Add to favourites'}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${
                                    favouriteRouteIds.includes(r.id)
                                      ? 'bg-red-600 border-red-500 shadow-lg shadow-red-600/30'
                                      : 'bg-white/5 border-white/10 hover:border-red-500/50'
                                  }`}
                                >
                                  <Heart size={14} fill={favouriteRouteIds.includes(r.id) ? '#fff' : 'none'} className={favouriteRouteIds.includes(r.id) ? 'text-white' : 'text-gray-500'} />
                                </button>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{r.id}</span>
                              </div>
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tight text-white leading-none mb-3">{r.name}</h4>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 italic mb-6">
                              <span>{r.start}</span>
                              <ChevronRight size={10} />
                              <span>{r.dest}</span>
                            </div>

                            {/* Checkpoints preview */}
                            {(r.stopNames?.length > 0) && (
                              <div className="mb-6 space-y-1.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">Checkpoints</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {r.stopNames.slice(0, 4).map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-400">{s}</span>
                                  ))}
                                  {r.stopNames.length > 4 && (
                                    <span className="px-2 py-1 bg-red-600/10 border border-red-600/20 rounded-lg text-[8px] font-black uppercase tracking-widest text-red-500">+{r.stopNames.length - 4} more</span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                              <div className="space-y-0.5">
                                <p className="text-[8px] font-black text-gray-600 uppercase">Distance</p>
                                <p className="text-sm font-black text-white">{r.distance || 'N/A'} KM</p>
                              </div>
                              <div className="space-y-0.5 text-right">
                                <p className="text-[8px] font-black text-gray-600 uppercase">Est. Time</p>
                                <p className="text-sm font-black text-white">{r.time || 'N/A'}</p>
                              </div>
                              <button
                                onClick={() => {
                                  const matchedBus = buses.find(b => b.route === r.id || b.route === r.name);
                                  if (matchedBus) {
                                    setSelectedBus(matchedBus);
                                    setMapCenter({ lat: matchedBus.lat || r.startLat || 28.6139, lng: matchedBus.lng || r.startLng || 77.2090 });
                                  }
                                  setActiveTab('map');
                                }}
                                className="px-5 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-red-600/20"
                              >
                                Track
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bus Results */}
                  {filteredBuses.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 italic">Matching Buses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {filteredBuses.map(b => (
                          <button
                            key={b.id}
                            onClick={() => {
                              setSelectedBus(b);
                              setMapCenter({ lat: b.lat || 28.6139, lng: b.lng || 77.2090 });
                              setActiveTab('map');
                            }}
                            className="glass-card p-8 text-left hover:border-red-500/30 transition-all duration-500 group active:scale-95"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className={`w-2.5 h-2.5 rounded-full mt-1 ${b.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{b.status}</span>
                            </div>
                            <p className="text-2xl font-black italic tracking-tight text-white">{b.id}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-1">{b.name}</p>
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
                              <span>Route: {b.route || 'N/A'}</span>
                              <span className="text-red-500">Track →</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredRoutes.length === 0 && filteredBuses.length === 0 && searchQuery && (
                    <div className="glass-card p-16 text-center">
                      <Search size={48} className="text-gray-700 mx-auto mb-6" />
                      <p className="text-lg font-black uppercase tracking-widest text-gray-600">No results found</p>
                      <p className="text-xs text-gray-700 mt-3 italic">Try searching by route name, stop name, or bus ID</p>
                    </div>
                  )}

                  {!searchQuery && (
                    <div className="glass-card p-16 text-center">
                      <Search size={48} className="text-gray-800 mx-auto mb-6" />
                      <p className="text-sm font-black uppercase tracking-widest text-gray-600">Type to search the fleet registry</p>
                      <p className="text-xs text-gray-700 mt-3 italic">{routes.length} routes · {buses.length} buses available</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === "profile" && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-black uppercase tracking-tighter">My <span className="text-red-500">Profile</span></h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-10 text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 rounded-[2.5rem] border-2 border-red-500/30 p-2 overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                           <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[2rem]" />
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition active:scale-95">
                          <Camera size={18} />
                        </button>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{userProfile.name}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">{userProfile.id}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-10 pt-10 border-t border-white/5">
                        <div className="p-4 rounded-2xl bg-white/5">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Lifetime Trips</p>
                          <p className="text-xl font-black text-white">42</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Points</p>
                          <p className="text-xl font-black text-red-500">1,240</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleUpdateProfile} className="glass-card p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Display Name</label>
                          <input 
                            type="text" 
                            className="glass-input w-full p-4" 
                            value={userProfile.name}
                            onChange={e => setUserProfile({...userProfile, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                          <input 
                            type="email" 
                            className="glass-input w-full p-4 opacity-50 cursor-not-allowed" 
                            value={userProfile.email}
                            disabled
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phone Number</label>
                          <input 
                            type="text" 
                            className="glass-input w-full p-4" 
                            value={userProfile.phone}
                            onChange={e => setUserProfile({...userProfile, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Verified ID</label>
                          <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-black tracking-widest rounded-2xl flex items-center justify-center uppercase">
                            Secure Passenger
                          </div>
                        </div>
                      </div>
                      <button type="submit" className="btn-primary w-full py-5 text-sm font-black uppercase tracking-widest shadow-2xl">Save Intelligence Profile</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Search <span className="text-red-500">Bus / Route</span></h2>
                <div className="glass-card p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Bus Reg. Number</label>
                      <input type="text" placeholder="e.g. R-45" className="glass-input w-full p-4" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Route Number</label>
                      <select className="glass-input w-full p-4 bg-black">
                        <option>All Routes</option>
                        {routes.map(r => <option key={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Destination</label>
                      <input type="text" placeholder="e.g. City Centre" className="glass-input w-full p-4" />
                    </div>
                  </div>
                  <button className="btn-primary w-full py-5 text-sm font-black uppercase tracking-widest">Find Direct Buses</button>
                </div>
              </div>
            )}

            {activeTab === "saved" && (() => {
              const favouriteRoutes = routes.filter(r => favouriteRouteIds.includes(r.id));
              return (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter">Favourite <span className="text-red-500">Routes</span></h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2 italic">{favouriteRoutes.length} routes bookmarked</p>
                    </div>
                    {favouriteRoutes.length > 0 && (
                      <button
                        onClick={() => { setFavouriteRouteIds([]); localStorage.setItem('favouriteRoutes', '[]'); }}
                        className="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-red-500 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {favouriteRoutes.length === 0 ? (
                    <div className="glass-card p-20 text-center">
                      <Heart size={56} className="text-gray-800 mx-auto mb-6" />
                      <p className="text-lg font-black uppercase tracking-widest text-gray-600">No favourite routes yet</p>
                      <p className="text-xs text-gray-700 mt-3 italic">Tap the ♥ heart on any route in Search to bookmark it here</p>
                      <button onClick={() => setActiveTab('search')} className="mt-8 px-8 py-4 bg-red-600 hover:bg-red-500 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-red-600/20 active:scale-95">
                        Browse Routes
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {favouriteRoutes.map(r => (
                        <div key={r.id} className="glass-card p-8 hover:border-red-500/30 transition-all duration-500 group relative overflow-hidden">
                          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-600/5 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                              <Heart size={20} fill="#ef4444" className="text-red-500" />
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleFavourite(r.id)}
                                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-600/10 flex items-center justify-center transition-all active:scale-90"
                                title="Remove from favourites"
                              >
                                <X size={12} className="text-gray-500 hover:text-red-500" />
                              </button>
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{r.id}</span>
                            </div>
                          </div>
                          <h4 className="text-lg font-black uppercase tracking-tight text-white leading-none mb-3">{r.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 italic mb-6">
                            <span>{r.start}</span>
                            <ChevronRight size={10} />
                            <span>{r.dest}</span>
                          </div>

                          {r.stopNames?.length > 0 && (
                            <div className="mb-6">
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">Checkpoints</p>
                              <div className="flex flex-wrap gap-1.5">
                                {r.stopNames.slice(0, 4).map((s, i) => (
                                  <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-400">{s}</span>
                                ))}
                                {r.stopNames.length > 4 && (
                                  <span className="px-2 py-1 bg-red-600/10 border border-red-600/20 rounded-lg text-[8px] font-black uppercase tracking-widest text-red-500">+{r.stopNames.length - 4} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <div className="space-y-0.5">
                              <p className="text-[8px] font-black text-gray-600 uppercase">Distance</p>
                              <p className="text-sm font-black text-white">{r.distance || 'N/A'} KM</p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-[8px] font-black text-gray-600 uppercase">Est. Time</p>
                              <p className="text-sm font-black text-white">{r.time || 'N/A'}</p>
                            </div>
                            <button
                              onClick={() => {
                                const matchedBus = buses.find(b => b.route === r.id || b.route === r.name);
                                if (matchedBus) {
                                  setSelectedBus(matchedBus);
                                  setMapCenter({ lat: matchedBus.lat || r.startLat || 28.6139, lng: matchedBus.lng || r.startLng || 77.2090 });
                                }
                                setActiveTab('map');
                              }}
                              className="px-5 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-red-600/20"
                            >
                              Track
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === "history" && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Trip <span className="text-red-500">History</span></h2>
                <div className="glass-card p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <th className="px-6 py-4">Date & Time</th>
                          <th className="px-6 py-4">Bus</th>
                          <th className="px-6 py-4">Route</th>
                          <th className="px-6 py-4">Start Point</th>
                          <th className="px-6 py-4">Destination</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {trips.map((trip, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-6 text-sm font-medium">{new Date(trip.createdAt || trip.date || Date.now()).toLocaleString()}</td>
                            <td className="px-6 py-6 text-xs font-black uppercase tracking-widest">{trip.bus}</td>
                            <td className="px-6 py-6 text-[10px] font-black text-red-500">{trip.route}</td>
                            <td className="px-6 py-6 text-xs text-gray-400">{trip.start || 'N/A'}</td>
                            <td className="px-6 py-6 text-sm font-bold text-white">{trip.stop || trip.dest || 'N/A'}</td>
                            <td className="px-6 py-6"><span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest">{trip.status || 'Active'}</span></td>
                          </tr>
                        ))}
                        {trips.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-6 text-center text-gray-500 italic text-sm">No trip history available.</td>
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
                <h2 className="text-3xl font-black uppercase tracking-tighter">Global <span className="text-red-500">Notifications</span></h2>
                <div className="grid grid-cols-1 gap-6">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-8 rounded-[2rem] border transition-all flex items-start justify-between ${n.read ? 'border-white/5 bg-white/5 opacity-60' : 'border-red-500/30 bg-red-500/5 shadow-2xl shadow-red-500/5'}`}>
                      <div className="flex gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'Alert' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                          <Bell size={24} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-2">{n.type}</h4>
                          <p className="text-lg font-bold text-white leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-gray-500 mt-4 block font-black uppercase tracking-widest">{n.date} • System Dispatch</span>
                        </div>
                      </div>
                      {!n.read && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_#ef4444]"></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "support" && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Report <span className="text-red-500">Issue</span></h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <form onSubmit={handleSubmitFeedback} className="lg:col-span-2 glass-card p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Bus Number</label>
                        <input type="text" placeholder="e.g. UP25 AB1234" className="glass-input w-full p-4" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Issue Type</label>
                        <select 
                          className="glass-input w-full p-4 bg-black"
                          value={feedback.type}
                          onChange={e => setFeedback({...feedback, type: e.target.value})}
                        >
                          <option>Bus Delay</option>
                          <option>Incorrect Location</option>
                          <option>Driver Behavior</option>
                          <option>Cleanliness Issue</option>
                          <option>App Performance</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Detailed Description</label>
                      <textarea 
                        className="glass-input w-full p-4 h-48 resize-none" 
                        placeholder="Please provide specific details to help us investigate..."
                        value={feedback.message}
                        onChange={e => setFeedback({...feedback, message: e.target.value})}
                      ></textarea>
                    </div>
                    <button type="submit" className="btn-primary w-full py-5 text-sm font-black uppercase tracking-widest shadow-2xl">Transmit Report to Command Centre</button>
                  </form>
                  <div className="space-y-8">
                    <div className="glass-card p-8 bg-white/5 border-red-500/20">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-6">Active Reports</h4>
                      <p className="text-sm font-medium text-gray-400">You have no pending reports. All previous issues have been resolved by our support team.</p>
                    </div>
                    <div className="glass-card p-10 bg-gradient-to-br from-red-600/20 to-red-600/5 border-red-500/20">
                    <Info className="text-red-500 mb-6" size={32} />
                      <h4 className="text-lg font-black uppercase tracking-tighter mb-4">Pro-Tip</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">Attaching the exact bus number helps our engineering team track the vehicle telemetry data faster.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "help" && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Help <span className="text-red-500">/ Support</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-10 space-y-6">
                    <h4 className="text-xl font-black uppercase tracking-tighter">Frequently Asked Questions</h4>
                    <div className="space-y-6">
                      {[
                        { q: "How do I track my bus in real-time?", a: "The 'Live Bus Tracking' section uses satellite data updated every 10 seconds to show precision locations." },
                        { q: "Can I book tickets through the app?", a: "Ticket booking is currently being integrated for a future update. Stay tuned!" },
                        { q: "What happens if I lose my phone?", a: "Your account is linked to your email. Simply log in from any device to see your favourites." }
                      ].map((faq, i) => (
                        <div key={i} className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-widest text-red-500">{faq.q}</p>
                          <p className="text-sm font-medium text-gray-400">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-10 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter mb-8">Contact Command Centre</h4>
                      <div className="space-y-8">
                        <div className="flex items-center gap-6 group">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-red-500 transition-colors">
                            <Info size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Support Email</p>
                            <p className="text-lg font-bold text-white tracking-widest">support@busride.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-red-500 transition-colors">
                            <Clock size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Emergency Hotline</p>
                            <p className="text-lg font-bold text-white tracking-widest">1-800-BUS-RIDE</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-12 p-6 bg-red-500 rounded-2xl text-center">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Live Chat Available 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Global Footer */}
            <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-50 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 font-black text-[10px]">v2.1</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">© 2026 BusRide Mobility System</p>
              </div>
              <div className="flex gap-8">
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Contact Support</a>
              </div>
            </footer>

          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard