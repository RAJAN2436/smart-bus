import { useState, useEffect, useCallback } from "react"
import {
    Bus, Users, Map as MapIcon, Route as RouteIcon, Activity,
    MessageSquare, BarChart3, Settings, AlertTriangle,
    Clock, Shield, Plus, Edit2, Trash2, MapPin,
    LogOut, Menu, X, ChevronRight, Bell, Send,
    Search, Filter, CheckCircle, Smartphone, RefreshCw,
    Wrench, FileText, Calendar, ShieldAlert, ShieldCheck,
    ArrowUpRight, ArrowDownRight, Layers, Database
} from "lucide-react"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import MapComponent from "../components/map/MapComponent"
import * as api from "../services/api"

// Register ChartJS
ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
)

const LIBRARIES = ['places']

function AdminDashboard() {
    const [activeModule, setActiveModule] = useState('stats')
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [loading, setLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    // System Data State
    const [fleet, setFleet] = useState([])
    const [drivers, setDrivers] = useState([])
    const [routes, setRoutes] = useState([])
    const [users, setUsers] = useState([])
    const [trips, setTrips] = useState([])
    const [schedules, setSchedules] = useState([])
    const [stats, setStats] = useState({ totalBuses: 0, totalDrivers: 0, totalUsers: 0, activeBuses: 0 })
    const [notifications, setNotifications] = useState([])

    const [selectedBus, setSelectedBus] = useState(null)
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 })

    // Modal State
    const [showAddBus, setShowAddBus] = useState(false)
    const [showAddDriver, setShowAddDriver] = useState(false)
    const [showAddRoute, setShowAddRoute] = useState(false)
    const [showAddUser, setShowAddUser] = useState(false)
    const [showAddTrip, setShowAddTrip] = useState(false)
    const [showAddSchedule, setShowAddSchedule] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)

    // Map Capture State for Routes
    const [mapSelectMode, setMapSelectMode] = useState(null)
    const [routeCoords, setRouteCoords] = useState({
        startLat: 28.6139,
        startLng: 77.2090,
        destLat: 28.7041,
        destLng: 77.1025
    })

    useEffect(() => {
        if (editingItem?.type === 'route') {
            setRouteCoords({
                startLat: parseFloat(editingItem.data.startLat) || 28.6139,
                startLng: parseFloat(editingItem.data.startLng) || 77.2090,
                destLat: parseFloat(editingItem.data.destLat) || 28.7041,
                destLng: parseFloat(editingItem.data.destLng) || 77.1025
            });
        } else if (showAddRoute) {
            setRouteCoords({
                startLat: 28.6139,
                startLng: 77.2090,
                destLat: 28.7041,
                destLng: 77.1025
            });
        }
    }, [editingItem, showAddRoute])

    const loadData = useCallback(async () => {
        try {
            const [s, f, d, r, u, t, sch] = await Promise.all([
                api.getStats(), api.getBuses(), api.getDrivers(),
                api.getRoutes(), api.getUsers(), api.getTrips(),
                api.getSchedules()
            ])
            setStats(s)
            setFleet(f)
            setDrivers(d)
            setRoutes(r)
            setUsers(u)
            setTrips(t)
            setSchedules(sch)
        } catch (err) {
            console.error("Failed to fetch data:", err)
        }
    }, [])

    useEffect(() => {
        setLoading(true)
        loadData().finally(() => setLoading(false))
        const interval = setInterval(loadData, 5000)
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => {
            clearInterval(interval)
            clearInterval(timeInterval)
        }
    }, [loadData])

    const modules = [
        { id: "stats", title: "Dashboard", icon: Activity },
        { id: "fleet", title: "Bus Management", icon: Bus },
        { id: "driver", title: "Driver Management", icon: Users },
        { id: "user", title: "User Management", icon: ShieldCheck },
        { id: "route", title: "Route Management", icon: RouteIcon },
        { id: "tracking", title: "Live Tracking", icon: MapPin },
        { id: "trip", title: "Trip Management", icon: Clock },
        { id: "schedule", title: "Schedule Management", icon: Calendar },
        { id: "notify", title: "Notifications", icon: Bell },
        { id: "issues", title: "Complaints / Issues", icon: MessageSquare },
        { id: "analytics", title: "Analytics / Reports", icon: BarChart3 },
        { id: "maintenance", title: "Maintenance", icon: Wrench },
        { id: "logs", title: "System Logs", icon: FileText },
        { id: "settings", title: "Settings", icon: Settings },
    ]

    const handleLogout = () => {
        if (confirm("Terminate admin session and logout?")) {
            api.logoutUser()
            window.location.href = "/"
        }
    }

    // --- Sub-Components Rendering Logic ---
    const renderModule = () => {
        switch (activeModule) {
            case "stats": return <StatisticsView stats={stats} drivers={[...drivers, ...users.filter(u => u.role === 'driver' && !drivers.some(d => d.id === u.id))]} />
            case "fleet": return <FleetManagement fleet={fleet} setShowAddBus={setShowAddBus} setEditingItem={setEditingItem} loadData={loadData} setConfirmDelete={setConfirmDelete} />
            case "driver": return <DriverManagement drivers={drivers} setShowAddDriver={setShowAddDriver} setEditingItem={setEditingItem} loadData={loadData} setConfirmDelete={setConfirmDelete} />
            case "user": return <UserManagement users={users} setShowAddUser={setShowAddUser} setEditingItem={setEditingItem} loadData={loadData} setConfirmDelete={setConfirmDelete} />
            case "route":
                if (selectedRoute) {
                    return <RouteIntelligenceView
                        route={selectedRoute}
                        onClose={() => setSelectedRoute(null)}
                        fleet={fleet}
                    />
                }
                return <RouteManagement routes={routes} setShowAddRoute={setShowAddRoute} setEditingItem={setEditingItem} onSelectRoute={setSelectedRoute} loadData={loadData} setConfirmDelete={setConfirmDelete} />
            case "tracking": return <LiveTracking fleet={fleet} mapCenter={mapCenter} setMapCenter={setMapCenter} selectedBus={selectedBus} setSelectedBus={setSelectedBus} routes={routes} />
            case "trip": return <TripManagement trips={trips} setShowAddTrip={setShowAddTrip} setEditingItem={setEditingItem} loadData={loadData} setConfirmDelete={setConfirmDelete} />
            case "schedule": return <ScheduleManagement schedules={schedules} setShowAddSchedule={setShowAddSchedule} setEditingItem={setEditingItem} loadData={loadData} setConfirmDelete={setConfirmDelete} />
            case "notify": return <NotificationManagement />
            case "issues": return <IssueManagement />
            case "analytics": return <AnalyticsReports />
            case "maintenance": return <MaintenanceManagement />
            case "logs": return <SystemLogs />
            case "settings": return <SystemSettings />
            default: return <StatisticsView stats={stats} />
        }
    }

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-red-500/30">

            {/* Sidebar Navigation */}
            <aside className={`${sidebarOpen ? 'w-80' : 'w-24'} transition-all duration-700 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50`}>
                <div className="p-10 flex items-center gap-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)] border border-white/10 group rotate-45 hover:rotate-0 transition-all duration-500">
                        <Database size={24} className="text-white -rotate-45 group-hover:rotate-0 transition-transform" />
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black tracking-tighter italic">SMART<span className="text-red-600">BUS</span></h1>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Superuser Console</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-6 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
                    {modules.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveModule(item.id)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${activeModule === item.id
                                ? 'bg-red-600 text-white shadow-2xl shadow-red-600/20'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} className={`${activeModule === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform z-10`} />
                            {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap z-10">{item.title}</span>}
                            {activeModule === item.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-8 border-t border-white/5">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center p-4 rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all hover:bg-white/10 border border-white/5"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Top Navbar */}
                <header className="h-28 bg-black/20 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-12 sticky top-0 z-40">
                    <div className="flex items-center gap-12">
                        <div className="relative group hidden lg:block">
                            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-red-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Universal User Search..."
                                className="bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 w-96 text-xs font-black uppercase tracking-widest outline-none focus:border-red-500/50 focus:w-[450px] transition-all duration-500 italic"
                            />
                        </div>
                        <div className="hidden xl:flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">System Time</span>
                            <div className="flex items-center gap-3 text-lg font-black tracking-widest text-white italic">
                                <Clock size={16} className="text-gray-500" />
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all relative group">
                                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                                <span className="absolute top-4 right-4 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                                <span className="absolute top-4 right-4 w-2 h-2 bg-red-600 rounded-full"></span>
                            </button>
                            <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all group">
                                <Settings size={20} className="group-hover:rotate-90 transition-transform duration-700" />
                            </button>
                        </div>

                        <div className="h-14 w-px bg-white/10 hidden md:block"></div>

                        <div className="flex items-center gap-5 pl-2">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Administrator</span>
                                <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] opacity-80">CEO</span>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white border border-white/10 shadow-xl overflow-hidden group p-0.5">
                                <div className="w-full h-full rounded-[0.9rem] overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Admin" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all duration-500 flex items-center justify-center"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Viewport */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-12 pb-12">
                    <div className="max-w-[1700px] mx-auto py-12 animate-fade-in-up">
                        {renderModule()}
                    </div>
                </div>

                {/* System Footer */}
                <footer className="h-16 bg-black/40 backdrop-blur-3xl border-t border-white/5 px-12 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-600">
                    <div className="flex items-center gap-8">
                        <span className="flex items-center gap-2 italic">
                            <Activity size={12} className="text-red-500" /> System Status: <span className="text-green-500">Nominal</span>
                        </span>
                        <span className="opacity-40">Core Version: v4.2.0-Alpha</span>
                    </div>
                    <div className="flex gap-10">
                        <a href="#" className="hover:text-red-500 transition-colors">Documentation</a>
                        <a href="#" className="hover:text-red-500 transition-colors">Support Matrix</a>
                        <a href="#" className="hover:text-red-500 transition-colors">Security Patch Notes</a>
                    </div>
                </footer>
            </main>

            {/* Modals & Overlays */}
            {(showAddBus || showAddDriver || showAddRoute || showAddUser || showAddTrip || showAddSchedule || editingItem) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center py-4 px-4 md:p-8">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-fade-in" onClick={() => {
                        setShowAddBus(false); setShowAddDriver(false); setShowAddRoute(false);
                        setShowAddUser(false); setShowAddTrip(false); setShowAddSchedule(false); setEditingItem(null);
                        setMapSelectMode(null);
                    }}></div>
                    <div className={`glass-card w-[90vw] md:w-[80vw] p-8 relative z-10 border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-fade-in-up ${showAddRoute || editingItem?.type === 'route' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[80vh] overflow-y-auto scrollbar-hide`}>
                        <header className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                                    {editingItem ? 'Update' : 'Register'} <span className="text-red-600">{editingItem ? editingItem.type.toUpperCase() : (showAddBus ? 'Bus' : showAddDriver ? 'Driver' : showAddRoute ? 'Route' : showAddUser ? 'User' : showAddTrip ? 'Trip' : 'SCHEDULE')}</span>
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mt-2 italic">Security Protocol: Admin Authorization Required</p>
                            </div>
                            <button onClick={() => {
                                setShowAddBus(false); setShowAddDriver(false); setShowAddRoute(false);
                                setShowAddUser(false); setShowAddTrip(false); setShowAddSchedule(false); setEditingItem(null);
                                setMapSelectMode(null);
                            }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"><X size={20} /></button>
                        </header>

                        <form className="space-y-8" onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());
                            const type = editingItem?.type || (showAddBus ? 'bus' : showAddDriver ? 'driver' : showAddRoute ? 'route' : showAddUser ? 'user' : showAddTrip ? 'trip' : 'schedule');

                            // For routes: merge map-selected coords and convert stops_list -> stopNames array
                            if (type === 'route') {
                                data.startLat = routeCoords.startLat;
                                data.startLng = routeCoords.startLng;
                                data.destLat = routeCoords.destLat;
                                data.destLng = routeCoords.destLng;
                                if (data.stops_list) {
                                    data.stopNames = data.stops_list.split(',').map(s => s.trim()).filter(Boolean);
                                    delete data.stops_list;
                                }
                            }

                            const apiCall = editingItem
                                ? (type === 'bus' ? api.editBus : type === 'driver' ? api.editDriver : type === 'route' ? api.editRoute : type === 'user' ? api.editUser : type === 'trip' ? api.editTrip : api.editSchedule)
                                : (type === 'bus' ? api.addBus : type === 'driver' ? api.addDriver : type === 'route' ? api.addRoute : type === 'user' ? api.addUser : type === 'trip' ? api.addTrip : api.addSchedule);

                            setLoading(true);
                            
                            const action = editingItem ? apiCall(editingItem.data.id, data) : apiCall(data);

                            action.then(() => {
                                setShowAddBus(false); setShowAddDriver(false); setShowAddRoute(false);
                                setShowAddUser(false); setShowAddTrip(false); setShowAddSchedule(false);
                                setEditingItem(null);
                                loadData();
                            }).catch(err => alert("Protocol Failure: " + (err.message || "Unknown error encountered")))
                                .finally(() => setLoading(false));
                        }}>
                            <div className={`grid gap-8 ${showAddRoute || editingItem?.type === 'route' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2'}`}>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">
                                        {showAddBus || editingItem?.type === 'bus' ? 'Bus Registration Number' :
                                            showAddRoute || editingItem?.type === 'route' ? 'Route Tracking Number' :
                                                showAddDriver || editingItem?.type === 'driver' ? 'Driver ID Number' :
                                                    showAddSchedule || editingItem?.type === 'schedule' ? 'Schedule Code' :
                                                        showAddUser || editingItem?.type === 'user' ? 'User Reference ID' :
                                                            showAddTrip || editingItem?.type === 'trip' ? 'Trip Log ID' : 'Identification Number'}
                                    </label>
                                    <input name="id" defaultValue={editingItem?.data?.id} placeholder="UID-0000" className="glass-input w-full" required />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Display Label</label>
                                    <input name="name" defaultValue={editingItem?.data?.name} placeholder="User_ALPHA" className="glass-input w-full" required />
                                </div>
                                <div className={`space-y-3 ${showAddRoute || editingItem?.type === 'route' ? 'col-span-1' : 'col-span-2'}`}>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Operational Status</label>
                                    <select name="status" defaultValue={editingItem?.isApproval ? 'Active' : editingItem?.data?.status} className="glass-input w-full appearance-none">
                                        <option>Pending</option>
                                        <option>Active</option>
                                        <option>Standby</option>
                                        <option>Offline</option>
                                        <option>Online</option>
                                        <option>Maintenance</option>
                                    </select>
                                </div>
                                {(showAddUser || showAddDriver || (editingItem?.type === 'user')) && (
                                    <>
                                        {(!editingItem || editingItem?.type === 'user') && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Official Email Address</label>
                                                <input name="email" type="email" defaultValue={editingItem?.data?.email} placeholder="pilot@smartbus.com" className="glass-input w-full" required />
                                            </div>
                                        )}
                                        {!editingItem && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Access Credentials (Password)</label>
                                                <input name="password" type="password" placeholder="••••••••" className="glass-input w-full" required={!editingItem} />
                                            </div>
                                        )}
                                        {(!editingItem || editingItem?.type === 'user') && (
                                            <div className="space-y-3 col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Pre-auth Role Allocation</label>
                                                <select name="role" defaultValue={editingItem?.data?.role || (showAddDriver ? 'driver' : 'user')} className="glass-input w-full appearance-none">
                                                    <option value="user">Standard Fleet User</option>
                                                    <option value="driver">Certified Fleet Pilot</option>
                                                    <option value="admin">Superuser Level 1</option>
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                                {(showAddDriver || editingItem?.type === 'driver') && (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Phone Number</label>
                                            <input name="phone" defaultValue={editingItem?.data?.phone} placeholder="9876543210" className="glass-input w-full" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Licence Number</label>
                                            <input name="license" defaultValue={editingItem?.data?.license} placeholder="DL12345" className="glass-input w-full" />
                                        </div>
                                        <div className="space-y-3 col-span-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Assigned Bus (Registration Number)</label>
                                            <select name="bus" defaultValue={editingItem?.data?.bus} className="glass-input w-full appearance-none">
                                                <option value="">-- UNASSIGNED --</option>
                                                {fleet.map(b => (
                                                    <option key={b.id} value={b.id}>{b.id} ({b.name})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                {(showAddBus || editingItem?.type === 'bus') && (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Assigned Route</label>
                                            <select name="route" defaultValue={editingItem?.data?.route} className="glass-input w-full appearance-none" required={showAddBus || editingItem?.type === 'bus'}>
                                                <option value="">-- UNASSIGNED --</option>
                                                {routes.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Driver Name</label>
                                            <select name="driver" defaultValue={editingItem?.data?.driver} className="glass-input w-full appearance-none" required={showAddBus || editingItem?.type === 'bus'}>
                                                <option value="">-- UNASSIGNED --</option>
                                                {drivers.map(d => (
                                                    <option key={d.id} value={d.name}>{d.name} ({d.id})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                {(showAddRoute || editingItem?.type === 'route') && (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Start Location</label>
                                            <input name="start" defaultValue={editingItem?.data?.start} placeholder="Central Station" className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Destination Location</label>
                                            <input name="dest" defaultValue={editingItem?.data?.dest} placeholder="North Hub" className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Total Stops (Count)</label>
                                            <input name="stops" type="number" defaultValue={editingItem?.data?.stops} placeholder="14" className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Route Distance (KM)</label>
                                            <input name="distance" defaultValue={editingItem?.data?.distance} placeholder="42.5" className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Estimated Time</label>
                                            <input name="time" defaultValue={editingItem?.data?.time} placeholder="1h 20m" className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Start Latitude</label>
                                            <input name="startLat" type="number" step="any" value={routeCoords.startLat} onChange={(e) => setRouteCoords({...routeCoords, startLat: parseFloat(e.target.value)})} className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Start Longitude</label>
                                            <input name="startLng" type="number" step="any" value={routeCoords.startLng} onChange={(e) => setRouteCoords({...routeCoords, startLng: parseFloat(e.target.value)})} className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Dest Latitude</label>
                                            <input name="destLat" type="number" step="any" value={routeCoords.destLat} onChange={(e) => setRouteCoords({...routeCoords, destLat: parseFloat(e.target.value)})} className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Dest Longitude</label>
                                            <input name="destLng" type="number" step="any" value={routeCoords.destLng} onChange={(e) => setRouteCoords({...routeCoords, destLng: parseFloat(e.target.value)})} className="glass-input w-full" required={showAddRoute || editingItem?.type === 'route'} />
                                        </div>
                                        <div className="col-span-1 md:col-span-3 h-96 relative group rounded-3xl overflow-hidden border border-white/10">
                                            <div className="absolute top-4 left-4 z-[1001] flex flex-col gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setMapSelectMode('start')}
                                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${mapSelectMode === 'start' ? 'bg-green-600 text-white border-green-500' : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'}`}
                                                >
                                                    {mapSelectMode === 'start' ? 'Click Map for Start' : 'Set Start Point'}
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setMapSelectMode('dest')}
                                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${mapSelectMode === 'dest' ? 'bg-red-600 text-white border-red-500' : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'}`}
                                                >
                                                    {mapSelectMode === 'dest' ? 'Click Map for End' : 'Set End Point'}
                                                </button>
                                            </div>
                                            <MapComponent 
                                                center={[routeCoords.startLat, routeCoords.startLng]} 
                                                zoom={12}
                                                stops={[
                                                    { name: 'Start', lat: routeCoords.startLat, lng: routeCoords.startLng },
                                                    { name: 'End', lat: routeCoords.destLat, lng: routeCoords.destLng }
                                                ]}
                                                onMapClick={(latlng) => {
                                                    if (mapSelectMode === 'start') {
                                                        setRouteCoords(prev => ({ ...prev, startLat: latlng.lat, startLng: latlng.lng }));
                                                        setMapSelectMode(null);
                                                    } else if (mapSelectMode === 'dest') {
                                                        setRouteCoords(prev => ({ ...prev, destLat: latlng.lat, destLng: latlng.lng }));
                                                        setMapSelectMode(null);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-3 col-span-1 md:col-span-3 mt-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Route Checkpoints (Comma Separated)</label>
                                            <textarea 
                                                name="stops_list" 
                                                defaultValue={
                                                    editingItem?.data?.stopNames?.length > 0
                                                        ? editingItem.data.stopNames.join(', ')
                                                        : (editingItem?.data?.stops_list || "Station A, Station B, Station C")
                                                } 
                                                placeholder="Enter stops separated by commas..." 
                                                className="glass-input w-full h-32 resize-none" 
                                                required={showAddRoute || editingItem?.type === 'route'}
                                            ></textarea>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2 italic">e.g. Bus Stand, City Center, Railway Station, North Hub</p>
                                        </div>
                                    </>
                                )}
                                {(showAddSchedule || editingItem?.type === 'schedule') && (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Assigned Bus (Registration Num)</label>
                                            <select name="bus" defaultValue={editingItem?.data?.bus} className="glass-input w-full appearance-none" required={showAddSchedule || editingItem?.type === 'schedule'}>
                                                <option value="">-- SELECT BUS --</option>
                                                {fleet.map(b => (
                                                    <option key={b.id} value={b.id}>{b.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Assigned Route</label>
                                            <select name="route" defaultValue={editingItem?.data?.route} className="glass-input w-full appearance-none" required={showAddSchedule || editingItem?.type === 'schedule'}>
                                                <option value="">-- SELECT ROUTE --</option>
                                                {routes.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Departure Time</label>
                                            <input name="departure" defaultValue={editingItem?.data?.departure} placeholder="08:00 AM" className="glass-input w-full" required={showAddSchedule || editingItem?.type === 'schedule'} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Arrival Time</label>
                                            <input name="arrival" defaultValue={editingItem?.data?.arrival} placeholder="09:30 AM" className="glass-input w-full" required={showAddSchedule || editingItem?.type === 'schedule'} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <button type="submit" className="btn-primary w-full mt-6">
                                Execute Synchronization
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-3xl animate-fade-in">
                    <div className="glass-card p-12 max-w-lg w-full text-center border-red-500/30 animate-fade-in-up">
                        <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-red-600/40">
                            <Trash2 size={40} className="text-white animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-4">Request <span className="text-red-500">Authorization</span></h2>
                        <p className="text-gray-400 text-sm font-black uppercase tracking-widest leading-relaxed mb-12 italic">
                            Purge following asset from global registry?
                            <span className="block text-white mt-4 text-lg">[{confirmDelete.type}] {confirmDelete.name || confirmDelete.id}</span>
                        </p>
                        <div className="flex gap-6">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all"
                            >
                                Abort Mission
                            </button>
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    confirmDelete.action()
                                        .then(() => {
                                            loadData();
                                            setConfirmDelete(null);
                                        })
                                        .catch(err => alert("Authorization Denied: " + (err.message || "Registry lock detected")))
                                        .finally(() => setLoading(false));
                                }}
                                className="flex-1 py-5 bg-red-600 hover:bg-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Execute Purge"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- SUB-COMPONENT DEFINITIONS ---

function StatisticsView({ stats, drivers }) {
    const cards = [
        { label: "Total Buses", value: stats.totalBuses || 0, icon: Bus, trend: "+12%", color: "from-red-600 to-red-900" },
        { label: "Active Buses", value: stats.activeBuses || 0, icon: Activity, trend: "Stable", color: "from-blue-600 to-blue-900" },
        { label: "Fleet Pilots", value: drivers.length, icon: Users, trend: "+3", color: "from-indigo-600 to-indigo-900" },
    ]

    return (
        <div className="space-y-12">
            <header>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">System <span className="text-red-600">Overview</span></h2>
                <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Real-time operational metadata</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {cards.map((card, i) => (
                    <div key={i} className="glass-card p-10 group hover:border-red-500/30 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-600/5 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
                        <div className="flex justify-between items-start mb-10">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-2xl border border-white/10 group-hover:scale-110 transition-transform`}>
                                <card.icon size={24} />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-red-500 tracking-[0.2em]">{card.trend}</span>
                                <ArrowUpRight size={12} className="text-red-500" />
                            </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">{card.label}</h3>
                        <div className="text-5xl font-black italic tracking-tighter text-white tabular-nums">{card.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-10 h-[600px] relative">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-8 flex items-center gap-3 italic">
                        <Layers size={16} /> Global Network Distribution
                    </h4>
                    <div className="h-[450px] w-full bg-white/5 rounded-3xl overflow-hidden relative border border-white/5">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <MapPin size={80} className="text-red-600 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-10 h-[600px] flex flex-col justify-between">
                    <header>
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-8 italic">Personnel Allocation</h4>
                    </header>
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="w-full aspect-square relative">
                            <Doughnut
                                data={{
                                    labels: ['Duty', 'Standby', 'Offline'],
                                    datasets: [{
                                        data: [12, 19, 3],
                                        backgroundColor: ['#dc2626', '#3b82f6', '#111827'],
                                        borderColor: 'transparent',
                                        hoverOffset: 20
                                    }]
                                }}
                                options={{ cutout: '75%', plugins: { legend: { display: false } } }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black italic">82%</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Utilization</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 pt-8">
                        {['Duty', 'Standby', 'Offline'].map((l, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-600' : i === 1 ? 'bg-blue-600' : 'bg-gray-800'}`}></div>
                                    <span className="text-gray-400">{l}</span>
                                </div>
                                <span className="text-white">{(Math.random() * 20).toFixed(0)} Buses</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function FleetManagement({ fleet, setShowAddBus, setEditingItem, loadData, setConfirmDelete }) {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Bus <span className="text-red-600">List</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Machine inventory matrix</p>
                </div>
                <button onClick={() => setShowAddBus(true)} className="btn-primary flex items-center gap-3"><Plus size={20} /> Deploy New Bus</button>
            </header>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4 px-8 pb-8">
                        <thead className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/60 sticky top-0 bg-black/50 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-8">Bus Registration Number</th>
                                <th className="p-8">Operational Route</th>
                                <th className="p-8">Protocol Driver</th>
                                <th className="p-8">Condition</th>
                                <th className="p-8">Operational ETA</th>
                                <th className="p-8 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fleet.map((bus) => (
                                <tr key={bus.id} className="group hover:bg-white/5 transition-all duration-300">
                                    <td className="p-8 rounded-l-[2rem] border-l border-t border-b border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                                                <Bus size={20} className="text-red-500" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black italic tracking-tighter text-white leading-none mb-2">{bus.id}</div>
                                                <div className="text-[8px] font-black uppercase tracking-widest text-gray-500">{bus.name} • VIP CONFIG</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="text-xs font-black italic text-white uppercase tracking-widest leading-none mb-2 tabular-nums">{bus.route}</div>
                                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em]">Inter-terminal Path</div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="flex flex-col">
                                            <div className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] mb-1 italic">Certified Pilot</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white">{bus.driver || 'D_UNASSIGNED'}</div>
                                        </div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5 uppercase">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest italic ${bus.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {bus.status}
                                        </span>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center text-red-500">
                                                <Clock size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">{bus.eta || "EN-ROUTE"}</span>
                                        </div>
                                    </td>
                                    <td className="p-8 rounded-r-[2rem] border-r border-t border-b border-white/5 text-right space-x-4">
                                        <button onClick={() => setEditingItem({ type: 'bus', data: bus })} className="p-4 hover:bg-white/10 rounded-2xl text-blue-400 transition transform hover:scale-110"><Edit2 size={16} /></button>
                                        <button
                                            onClick={() => setConfirmDelete({
                                                type: 'Bus Asset',
                                                id: bus.id,
                                                name: bus.name,
                                                action: () => api.deleteBus(bus.id)
                                            })}
                                            className="p-4 hover:bg-white/10 rounded-2xl text-red-500 transition transform hover:scale-110"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function DriverManagement({ drivers, setShowAddDriver, setEditingItem, loadData, setConfirmDelete }) {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Driver <span className="text-red-600">Directory</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Active driver staff grid</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowAddDriver(true)} className="btn-primary flex items-center gap-3"><Plus size={20} /> Onboard Driver</button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {drivers.map(d => (
                    <div key={d.id} className="glass-card p-10 flex flex-col justify-between hover:border-red-500/30 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-600/5 blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
                        <div>
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-3xl shadow-2xl border border-white/10 group-hover:rotate-6 transition-transform">
                                    👨‍✈️
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${d.status === 'Online' || d.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-500'}`}>
                                        {d.status}
                                    </span>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">ID: {d.id}</span>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none mb-3">{d.name}</h3>
                            <div className="space-y-3 mt-8">
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <Bus size={14} className="text-red-600" />
                                    <span className="text-white/60">Assigned Bus: <span className="text-white font-black italic ml-2">{d.bus || "FLEET_UNASSIGNED"}</span></span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <Smartphone size={14} className="text-red-600" />
                                    <span>Comms: <span className="text-white ml-2">{d.phone || "En-route"}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 space-y-4 pt-8 border-t border-white/5">
                            <button
                                onClick={() => {
                                    localStorage.setItem('driverId', d.id);
                                    window.open('/driver', '_blank');
                                }}
                                className="w-full py-4 text-[8px] font-black uppercase tracking-[0.3em] bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 hover:scale-105"
                            >
                                Launch Dashboard
                            </button>
                            <div className="flex gap-4">
                                <button onClick={() => setEditingItem({ type: 'driver', data: d })} className="flex-1 py-4 text-[8px] font-black uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">Modify</button>
                                <button
                                    onClick={() => setConfirmDelete({
                                        type: 'Driver Personnel',
                                        id: d.id,
                                        name: d.name,
                                        action: () => api.deleteDriver(d.id)
                                    })}
                                    className="flex-1 py-4 text-[8px] font-black uppercase tracking-[0.3em] bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all"
                                >
                                    Release
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function UserManagement({ users, setShowAddUser, setEditingItem, loadData, setConfirmDelete }) {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Identity <span className="text-red-600">Registry</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">System-wide user matrix</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowAddUser(true)} className="btn-primary flex items-center gap-3"><Plus size={20} /> Register User</button>
                </div>
            </header>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4 px-8 pb-8">
                        <thead className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/60 sticky top-0 bg-black/50 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-8">User Profile</th>
                                <th className="p-8">Operational Role</th>
                                <th className="p-8">Travel Statistics</th>
                                <th className="p-8">Operational Status</th>
                                <th className="p-8 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="group hover:bg-white/5 transition-all duration-300">
                                    <td className="p-8 rounded-l-[2rem] border-l border-t border-b border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center font-black text-red-500 text-xl italic shadow-2xl group-hover:scale-110 transition-transform">{u.name[0]}</div>
                                            <div>
                                                <div className="text-xl font-black italic tracking-tighter text-white leading-none mb-2">{u.name.toUpperCase()}</div>
                                                <div className="text-[8px] font-black uppercase tracking-widest text-gray-500 italic">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="text-xs font-black italic text-red-500 uppercase tracking-widest">{u.role?.toUpperCase() || 'USER'}</div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="text-xs font-black italic text-white uppercase tracking-widest leading-none mb-2 tabular-nums">{u.trips || 0} Trips</div>
                                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em]">Verified Passage</div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5 uppercase">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest italic ${u.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {u.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic tabular-nums">{u.date}</div>
                                    </td>
                                    <td className="p-8 rounded-r-[2rem] border-r border-t border-b border-white/5 text-right space-x-4">
                                        <button onClick={() => setEditingItem({ type: 'user', data: u })} className="p-4 hover:bg-white/10 rounded-2xl text-blue-400 transition transform hover:scale-110"><Edit2 size={16} /></button>
                                        <button
                                            onClick={() => setConfirmDelete({
                                                type: 'Identity Registry',
                                                id: u.id,
                                                name: u.name,
                                                action: () => api.deleteUser(u.id)
                                            })}
                                            className="p-4 hover:bg-white/10 rounded-2xl text-red-500 transition transform hover:scale-110"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function RouteIntelligenceView({ route, onClose, fleet }) {
    if (!route) return null;

    // Use actual route data if available, fallback to defaults
    const stopsArray = route.stopNames?.length > 0
        ? route.stopNames
        : (route.stops_list ? route.stops_list.split(',').map(s => s.trim()) : [route.start, route.dest].filter(Boolean));

    const timeline = stopsArray.map((stop, i) => {
        // Simple logic to distribute times and status for visualization
        const status = i < Math.floor(stopsArray.length / 2) ? "Completed" : (i === Math.floor(stopsArray.length / 2) ? "Active" : "Pending");

        // Generate approximate coordinates if not provided (for visualization)
        const startLat = route.startLat || 28.6139;
        const startLng = route.startLng || 77.2090;
        const destLat = route.destLat || 28.7041;
        const destLng = route.destLng || 77.1025;

        const ratio = i / (stopsArray.length - 1 || 1);
        const lat = startLat + (destLat - startLat) * ratio;
        const lng = startLng + (destLng - startLng) * ratio;

        return {
            stop,
            status,
            time: `${8 + Math.floor(i * 20 / 60)}:${((i * 20) % 60).toString().padStart(2, '0')} AM`,
            lat,
            lng
        };
    });

    const routePath = timeline.map(t => [t.lat, t.lng]);

    return (
        <div className="space-y-12 animate-fade-in">
            <header className="flex justify-between items-end">
                <div>
                    <button onClick={onClose} className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest mb-4 hover:text-white transition-colors">
                        <ChevronRight size={14} className="rotate-180" /> Back to Routes
                    </button>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Route <span className="text-red-600">Intelligence</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">{route.name} Topology</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-gray-500 mb-1">Total Distance</span>
                        <span className="text-lg font-black italic">{route.distance || '12.4'} KM</span>
                    </div>
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-gray-500 mb-1">Total Nodes</span>
                        <span className="text-lg font-black italic">{stopsArray.length} STOPS</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Timeline Panel */}
                <div className="glass-card p-10 flex flex-col">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-10 italic">Stop Chronology</h4>
                    <div className="space-y-10 relative flex-1 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-px before:bg-white/10 overflow-y-auto scrollbar-hide max-h-[600px]">
                        {timeline.map((step, i) => (
                            <div key={i} className="flex gap-8 relative z-10">
                                <div className={`w-4 h-4 rounded-full mt-1.5 shrink-0 border-2 border-[#050505] shadow-xl ${step.status === 'Completed' ? 'bg-green-500' : step.status === 'Active' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`}></div>
                                {step.status === 'Active' && <div className="absolute w-4 h-4 bg-red-500 rounded-full mt-1.5 shrink-0 animate-ping opacity-50"></div>}
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-widest ${step.status === 'Completed' ? 'text-gray-600 line-through' : 'text-white'}`}>{step.stop}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock size={10} className="text-gray-500" />
                                        <span className="text-[10px] font-bold text-gray-500 tracking-widest">{step.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Analytical Stats Panel */}
                <div className="space-y-8">
                    <div className="glass-card p-10">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-8 italic">Route Execution Matrix</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase mb-3">Identifier</p>
                                <p className="text-2xl font-black italic text-red-600">{route.id}</p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase mb-3">Est. Time</p>
                                <p className="text-2xl font-black italic text-white">{route.time || 'N/A'}</p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black text-gray-500 uppercase mb-3">Efficiency</p>
                                <p className="text-2xl font-black italic text-green-500">9.8/10</p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black text-gray-500 uppercase mb-3">Fleet Load</p>
                                <p className="text-2xl font-black italic text-red-500">PO-4</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-10 bg-gradient-to-br from-red-600/5 to-transparent border-red-500/10 mb-8">
                        <div className="flex items-center gap-8 mb-8">
                            <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl transition hover:rotate-6">
                                <Bus size={32} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black italic uppercase leading-none">Route Fleet Status</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2 italic">Active Hardware Registry</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {(() => {
                                const activeBuses = fleet?.filter(b => b.route === route.id || b.route === route.name) || [];
                                if (activeBuses.length === 0) return <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">No assets currently assigned to this sector.</p>;
                                return activeBuses.map(bus => (
                                    <div key={bus.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{bus.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-red-500 tabular-nums uppercase tracking-widest">REG: {bus.id}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    <div className="glass-card p-10 bg-gradient-to-br from-red-600/5 to-transparent border-red-500/10">
                        <div className="flex items-center gap-8 mb-8">
                            <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl">
                                <RouteIcon size={32} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black italic uppercase leading-none">Operational Summary</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2 italic">Sector: Global Network</p>
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-relaxed italic">
                            This route topology utilizes {stopsArray.length} nodes across a {route.distance || '0'} KM operational span. All telemetry is verified via admin protocol.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RouteManagement({ routes, setShowAddRoute, setEditingItem, onSelectRoute, loadData, setConfirmDelete }) {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Travel <span className="text-red-600">Routes</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Operational route topology</p>
                </div>
                <button onClick={() => setShowAddRoute(true)} className="btn-primary flex items-center gap-3"><RouteIcon size={20} /> Establish New Route</button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {routes.map((r) => (
                    <div key={r.id} className="glass-card p-10 hover:border-red-500/30 transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <RouteIcon size={24} className="text-red-600" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{r.id}</span>
                        </div>
                        <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">{r.name}</h3>
                        <div className="flex items-center gap-3 mb-8 text-[10px] font-black uppercase tracking-widest text-red-500 italic">
                            <span>{r.start || 'Sector-A'}</span>
                            <ChevronRight size={10} />
                            <span>{r.dest || 'Sector-B'}</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Stops</span>
                                <span className="text-white italic">{r.stops || 0} Nodes</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Distance</span>
                                <span className="text-white italic">{r.distance || '0'} KM</span>
                            </div>
                        </div>
                        <div className="mt-10 flex gap-4 pt-8 border-t border-white/5">
                            <button onClick={() => onSelectRoute(r)} className="flex-1 py-4 text-[8px] font-black uppercase tracking-[0.3em] bg-red-600 border border-red-500 shadow-lg shadow-red-600/20 text-white rounded-xl transition-all">Analyze</button>
                            <button onClick={() => setEditingItem({ type: 'route', data: r })} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"><Edit2 size={14} /></button>
                            <button
                                onClick={() => setConfirmDelete({
                                    type: 'Route Topology',
                                    id: r.id,
                                    name: r.name,
                                    action: () => api.deleteRoute(r.id)
                                })}
                                className="p-4 bg-red-600/5 hover:bg-red-600/10 text-red-500 rounded-xl transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function LiveTracking({ fleet, mapCenter, setMapCenter, selectedBus, setSelectedBus, routes }) {
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

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Global <span className="text-red-600">Positioning</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Real-time asset telemetry</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 glass-card p-4 h-[800px] relative overflow-hidden group border-white/10">
                    <MapComponent
                        center={mapCenter}
                        markers={fleet.map(bus => ({
                            id: bus.id,
                            lat: bus.lat || 28.6139,
                            lng: bus.lng || 77.2090,
                            type: 'bus',
                            status: bus.status
                        }))}
                        autoFollowId={selectedBus?.id}
                        selectedInfo={selectedBus}
                        onCloseInfo={() => setSelectedBus(null)}
                        onMarkerClick={(m) => {
                            const bus = fleet.find(b => b.id === m.id);
                            setSelectedBus(bus);
                            setMapCenter({ lat: m.lat, lng: m.lng });
                        }}
                    />
                    <div className="absolute top-10 left-10 flex flex-col gap-4">
                        <div className="glass-card px-8 py-4 flex items-center gap-4 border-red-500/20 bg-black/60 backdrop-blur-3xl">
                            <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Live Uplink Active</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-10 h-[800px] overflow-y-auto scrollbar-hide flex flex-col space-y-8">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 italic">Bus List</h4>
                    <div className="space-y-6">
                        {fleet.map(bus => (
                            <button
                                key={bus.id}
                                onClick={() => {
                                    setSelectedBus(bus);
                                    setMapCenter(bus.location || { lat: 28.6139, lng: 77.2090 });
                                }}
                                className={`w-full p-6 rounded-2xl border transition-all duration-500 text-left group relative overflow-hidden ${selectedBus?.id === bus.id ? 'bg-red-600 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <div className={`text-xl font-black italic tracking-tighter leading-none mb-2 ${selectedBus?.id === bus.id ? 'text-white' : 'text-gray-300'}`}>{bus.id}</div>
                                        <div className={`text-[8px] font-black uppercase tracking-widest ${selectedBus?.id === bus.id ? 'text-white/80' : 'text-gray-500'}`}>{bus.route}</div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${selectedBus?.id === bus.id ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-gray-500 group-hover:text-red-500'
                                        }`}>
                                        <Bus size={18} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-3 relative z-10">
                                    <div className={`w-1.5 h-1.5 rounded-full ${bus.status === 'Active' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${selectedBus?.id === bus.id ? 'text-white/60' : 'text-gray-600'}`}>{bus.status.toUpperCase()}</span>
                                </div>
                                {selectedBus?.id === bus.id && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function TripManagement({ trips, setShowAddTrip, setEditingItem, loadData, setConfirmDelete }) {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Trip <span className="text-red-600">Control</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Live trip execution logs</p>
                </div>
                <button onClick={() => setShowAddTrip(true)} className="btn-primary flex items-center gap-3"><Plus size={20} /> Authorize Trip</button>
            </header>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4 px-8 pb-8">
                        <thead className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/60 sticky top-0 bg-black/50 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-8">Trip Header</th>
                                <th className="p-8">Assigned Route</th>
                                <th className="p-8">Timeline</th>
                                <th className="p-8">Load Factor</th>
                                <th className="p-8">Status</th>
                                <th className="p-8 text-right">Directives</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map((t) => (
                                <tr key={t.id} className="group hover:bg-white/5 transition-all duration-300">
                                    <td className="p-8 rounded-l-[2rem] border-l border-t border-b border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                                                <Clock size={20} className="text-red-500" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black italic tracking-tighter text-white leading-none mb-2 tabular-nums">#{t.id.slice(-4).toUpperCase()}</div>
                                                <div className="text-[8px] font-black uppercase tracking-widest text-gray-500 italic">Bus: {t.busId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="text-xs font-black italic text-white uppercase tracking-widest leading-none mb-2">{t.routeName}</div>
                                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em]">{t.driverName} DRIVING</div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white italic tabular-nums">{t.startTime}</div>
                                        <div className="text-[8px] font-black text-red-500/60 uppercase tracking-widest mt-1">Scheduled Departure</div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-2 w-24 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-600 to-red-900"
                                                    style={{ width: `${(t.passengers / 50) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-black italic text-white tabular-nums">{t.passengers}/50</span>
                                        </div>
                                    </td>
                                    <td className="p-8 border-t border-b border-white/5 uppercase">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest italic animate-pulse ${t.status === 'Ongoing' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-500'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="p-8 rounded-r-[2rem] border-r border-t border-b border-white/5 text-right space-x-4">
                                        <button onClick={() => setEditingItem({ type: 'trip', data: t })} className="p-4 hover:bg-white/10 rounded-2xl text-blue-400 transition transform hover:scale-110"><Edit2 size={16} /></button>
                                        <button
                                            onClick={() => setConfirmDelete({
                                                type: 'Operational Trip',
                                                id: t.id,
                                                name: `Log #${t.id.slice(-4).toUpperCase()}`,
                                                action: () => api.deleteTrip(t.id)
                                            })}
                                            className="p-4 hover:bg-white/10 rounded-2xl text-red-500 transition transform hover:scale-110"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function ScheduleManagement({ schedules, setShowAddSchedule, setEditingItem, loadData, setConfirmDelete }) {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Timetables</h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Bus scheduling & synchronization</p>
                </div>
                <button onClick={() => setShowAddSchedule(true)} className="btn-primary flex items-center gap-3"><Plus size={20} /> New Schedule Entry</button>
            </header>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-separate border-spacing-y-4 px-8 pb-8">
                    <thead className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/60">
                        <tr>
                            <th className="p-8">Slot UID</th>
                            <th className="p-8">Assigned Bus</th>
                            <th className="p-8">Route</th>
                            <th className="p-8">Window</th>
                            <th className="p-8">Sync Status</th>
                            <th className="p-8 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map(s => (
                            <tr key={s.id} className="group hover:bg-white/5 transition-all">
                                <td className="p-8 rounded-l-[2rem] border-l border-t border-b border-white/5 text-[10px] font-black text-white italic">{s.id}</td>
                                <td className="p-8 border-t border-b border-white/5 text-[10px] font-black text-white italic">{s.bus}</td>
                                <td className="p-8 border-t border-b border-white/5 text-[10px] font-black text-white italic">{s.route}</td>
                                <td className="p-8 border-t border-b border-white/5">
                                    <div className="text-[10px] font-black text-white italic">{s.departure} → {s.arrival}</div>
                                </td>
                                <td className={`p-8 border-t border-b border-white/5 text-[10px] font-black italic ${s.status === 'Confirmed' ? 'text-green-500' : 'text-orange-500'}`}>
                                    {s.status?.toUpperCase() || 'CONFIRMED'}
                                </td>
                                <td className="p-8 rounded-r-[2rem] border-r border-t border-b border-white/5 text-right space-x-4">
                                    <button onClick={() => setEditingItem({ type: 'schedule', data: s })} className="p-4 hover:bg-white/10 rounded-2xl text-blue-400 transition transform hover:scale-110"><Edit2 size={16} /></button>
                                    <button
                                        onClick={() => setConfirmDelete({
                                            type: 'System Schedule',
                                            id: s.id,
                                            name: s.id,
                                            action: () => api.deleteSchedule(s.id)
                                        })}
                                        className="p-4 hover:bg-white/10 rounded-2xl text-red-500 transition transform hover:scale-110"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {schedules.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500 italic text-sm border-t border-b border-white/5">No schedules synchronized.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function NotificationManagement() {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Notifications</h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Global communication protocol</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-10 italic">Dispatch Message</h4>
                    <form className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Target Cluster</label>
                            <select className="bg-white/5 border border-white/10 w-full p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-red-500 outline-none appearance-none transition-all italic">
                                <option>GLOBAL (ALL USERS)</option>
                                <option>DRIVERS ONLY</option>
                                <option>PASSENGERS ONLY</option>
                                <option>SECTOR A-1 (CITY CENTER)</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Message Content</label>
                            <textarea rows="5" placeholder="ENTER MESSAGE..." className="bg-white/5 border border-white/10 w-full p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-red-500 outline-none transition-all italic resize-none"></textarea>
                        </div>
                        <button type="button" className="w-full py-6 bg-red-600 rounded-3xl text-sm font-black uppercase tracking-[0.4em] italic shadow-2xl shadow-red-600/30 flex items-center justify-center gap-4 hover:scale-[1.02] transition-all">
                            <Send size={18} /> SEND NOTIFICATION
                        </button>
                    </form>
                </div>

                <div className="glass-card p-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-10 italic">Dispatch History</h4>
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex gap-6 items-start">
                                <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/20"><Bell size={16} /></div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] font-black text-white italic">M-30{i} TARGET: GLOBAL</span>
                                        <span className="text-[8px] font-black text-gray-600 uppercase">1{i}m ago</span>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">System-wide maintenance scheduled for midnight. All buses must return to stand.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function IssueManagement() {
    const issues = [
        { id: "TKT-920", origin: "Driver", unit: "BUS-101", priority: "CRITICAL", msg: "Engine overheating in sector 4. Emergency assistance required.", status: "Resolving" },
        { id: "TKT-921", origin: "USER", unit: "BUS-204", priority: "MEDIUM", msg: "AC unit malfunction on upper deck. Passengers complaining.", status: "Pending" },
    ]

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Issue <span className="text-red-600">Tracker</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">System complaints & issues</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {issues.map(iss => (
                    <div key={iss.id} className="glass-card p-10 flex gap-10 items-center justify-between border-red-500/10">
                        <div className="flex items-center gap-10 flex-1">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border transition-all ${iss.priority === 'CRITICAL' ? 'bg-red-600/10 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-gray-500'
                                }`}>
                                <AlertTriangle size={32} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="text-xl font-black italic tracking-tighter text-white uppercase">{iss.id}</span>
                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black tracking-widest ${iss.priority === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400'}`}>{iss.priority}</span>
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 italic leading-relaxed">{iss.msg}</p>
                                <div className="flex gap-8">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 italic"><Users size={12} /> ORIGIN: {iss.origin}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 italic"><Bus size={12} /> Bus: {iss.unit}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button className="px-8 py-4 bg-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:scale-105 transition-all">RESOLVE ISSUE</button>
                            <button className="px-8 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-white/10 transition-all text-gray-500">FORWARD TO MAINT</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}



function AnalyticsReports() {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">System <span className="text-red-600">Intelligence</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Predictive & historical data analytics</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-10 h-[500px]">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-10 italic">Trip Execution Volume</h4>
                    <div className="h-[350px]">
                        <Line
                            data={{
                                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                                datasets: [{
                                    label: 'Current Trip Load',
                                    data: [5, 2, 45, 30, 55, 20],
                                    borderColor: '#dc2626',
                                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 6,
                                    pointHoverRadius: 10
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { border: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } },
                                    x: { border: { display: false }, grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="glass-card p-10 h-[500px]">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-10 italic">Revenue Distribution</h4>
                    <div className="h-[350px]">
                        <Bar
                            data={{
                                labels: ['Route A', 'Route B', 'Route C', 'Route D'],
                                datasets: [{
                                    label: 'Contribution',
                                    data: [12000, 19000, 3000, 5000],
                                    backgroundColor: ['#dc2626', '#3b82f6', '#10b981', '#f59e0b'],
                                    borderRadius: 12
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { border: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } },
                                    x: { border: { display: false }, grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function MaintenanceManagement() {
    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Bus<span className="text-red-600"> Management</span></h2>
                    <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Bus health & maintenance monitoring</p>
                </div>
                <button className="btn-primary flex items-center gap-3"><Wrench size={20} /> Schedule Overhaul</button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['BUS-101', 'BUS-204', 'BUS-305'].map(id => (
                    <div key={id} className="glass-card p-10 space-y-8 group">
                        <div className="flex justify-between items-start">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-red-500 text-xl italic group-hover:scale-110 transition-transform shadow-2xl">{id.slice(-3)}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">HEALTH: 92%</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic text-white mb-2">{id}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Maintenance: 12 Days Ago</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500 italic">Oil Life</span>
                                <span className="text-white">85%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-red-600 w-[85%]"></div>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all">View Full Diagnostics</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SystemLogs() {
    const logs = [
        { time: "14:20:12", type: "SECURITY", msg: "ADMIN AUTHORIZED: MODULE ACCESS - ANALYTICS", entity: "SYSLOGD" },
        { time: "14:18:05", type: "BUS", msg: "BUS-101 Route SYNC SUCCESSFUL", entity: "Route_MGR" },
        { time: "14:15:22", type: "CRITICAL", msg: "ISSUE DETECTED: Bus BUS-204 OFFLINE", entity: "GUARD_EXEC" },
    ]

    return (
        <div className="space-y-12">
            <header>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">System <span className="text-red-600">Logs</span></h2>
                <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Real-time system activity stream</p>
            </header>

            <div className="glass-card p-10 font-mono text-xs leading-relaxed space-y-4 bg-black/60 border-red-500/10">
                {logs.map((l, i) => (
                    <div key={i} className="flex gap-8 group">
                        <span className="text-gray-600 font-black italic tabular-nums">[{l.time}]</span>
                        <span className={`font-black ${l.type === 'CRITICAL' ? 'text-red-600' : 'text-blue-500'} italic uppercase tracking-widest w-24`}>{l.type}</span>
                        <span className="text-gray-400 group-hover:text-white transition-colors">{l.msg}</span>
                        <span className="ml-auto text-gray-700 italic">::{l.entity}</span>
                    </div>
                ))}
                <div className="pt-8 flex items-center gap-4 text-red-500 animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    <span className="font-black uppercase tracking-[0.4em]">Listening for incoming system events...</span>
                </div>
            </div>
        </div>
    )
}

function SystemSettings() {
    return (
        <div className="space-y-12">
            <header>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Core <span className="text-red-600">Configuration</span></h2>
                <p className="text-gray-500 text-sm mt-3 font-black uppercase tracking-[0.3em] italic">Global system parameters & protocols</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="glass-card p-10 space-y-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 italic flex items-center gap-3"><Shield size={16} /> Security Settings</h4>
                    <div className="space-y-8">
                        {['Force 2FA for Drivers', 'Session Matrix Timeout', 'Log Critical Issues'].map(s => (
                            <div key={s} className="flex justify-between items-center group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white transition-colors italic">{s}</span>
                                <div className="w-14 h-8 bg-red-600 rounded-full flex items-center px-1 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                                    <div className="w-6 h-6 bg-white rounded-full ml-auto"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-10 space-y-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 italic flex items-center gap-3"><RefreshCw size={16} /> Global Sync Protocols</h4>
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Telemetry Update Frequency</label>
                            <div className="flex gap-4">
                                {['5s', '10s', '30s', '60s'].map(t => (
                                    <button key={t} className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all italic ${t === '10s' ? 'bg-red-600 border-red-500 text-white' : 'border-white/5 text-gray-500 hover:text-white'}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
