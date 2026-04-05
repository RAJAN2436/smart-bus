const API_URL = "http://127.0.0.1:5000/api"

// Helper to get token
const getToken = () => localStorage.getItem('token')

// Generic fetcher
const fetchData = async (resource) => {
  const res = await fetch(`${API_URL}/${resource}`, {
    headers: {
      "Authorization": getToken() ? `Bearer ${getToken()}` : "",
    }
  })
  if (res.status === 204) return { success: true };
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || result.message || "Protocol level failure");
  return result;
}

// Generic poster
const postData = async (resource, data) => {
  const res = await fetch(`${API_URL}/${resource}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": getToken() ? `Bearer ${getToken()}` : "",
    },
    body: JSON.stringify(data)
  })
  if (res.status === 204) return { success: true };
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || result.message || "Execution level failure");
  return result;
}

// Generic deleter
const deleteData = async (resource, id) => {
  const res = await fetch(`${API_URL}/${resource}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      "Authorization": getToken() ? `Bearer ${getToken()}` : "",
    }
  })
  if (res.status === 204) return { success: true };
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || result.message || "Commission failure");
  return result;
}

// Generic put (update)
const putData = async (resource, id, data) => {
  const res = await fetch(`${API_URL}/${resource}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": getToken() ? `Bearer ${getToken()}` : "",
    },
    body: JSON.stringify(data)
  })
  if (res.status === 204) return { success: true };
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || result.message || "Configuration failure");
  return result;
}

// Specific exports
export const getStats = () => fetchData('stats')

export const getBuses = () => fetchData('buses')
export const addBus = (data) => postData('buses', data)
export const editBus = (id, data) => putData('buses', id, data)
export const deleteBus = (id) => deleteData('buses', id)

export const getDrivers = () => fetchData('drivers')
export const getDriverById = (id) => fetchData(`drivers/${encodeURIComponent(id)}`)
export const addDriver = (data) => postData('drivers', data)
export const editDriver = (id, data) => putData('drivers', id, data)
export const deleteDriver = (id) => deleteData('drivers', id)

export const getRoutes = () => fetchData('routes')
export const addRoute = (data) => postData('routes', data)
export const editRoute = (id, data) => putData('routes', id, data)
export const deleteRoute = (id) => deleteData('routes', id)

export const getUsers = () => fetchData('users')
export const getUserById = (id) => fetchData(`users/${encodeURIComponent(id)}`)
export const addUser = (data) => postData('users', data)
export const editUser = (id, data) => putData('users', id, data)
export const deleteUser = (id) => deleteData('users', id)

export const getTrips = () => fetchData('trips')
export const addTrip = (data) => postData('trips', data)
export const editTrip = (id, data) => putData('trips', id, data)
export const deleteTrip = (id) => deleteData('trips', id)

export const getSchedules = () => fetchData('schedules')
export const addSchedule = (data) => postData('schedules', data)
export const editSchedule = (id, data) => putData('schedules', id, data)
export const deleteSchedule = (id) => deleteData('schedules', id)

export const getFeedbacks = () => fetchData('feedbacks')
export const addFeedback = (data) => postData('feedbacks', data)

// Auth
export const loginUser = (data) => postData('users/login', data)
export const registerUser = (data) => postData('users/register', data)

export const logoutUser = () => {
  localStorage.clear()
}