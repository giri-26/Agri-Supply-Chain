import api from './axiosClient';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

export const trackingApi = {
  track: (trackingId) => api.get(`/tracking/${trackingId}`),
};

export const adminApi = {
  dashboardStats: () => api.get('/admin/dashboard-stats'),
  listUsers: (params) => api.get('/admin/users', { params }),
  approveUser: (id) => api.patch(`/admin/users/${id}/approve`),
  rejectUser: (id) => api.patch(`/admin/users/${id}/reject`),
  setUserActive: (id, isActive) => api.patch(`/admin/users/${id}/active`, { isActive }),
  activityLogs: (params) => api.get('/admin/activity-logs', { params }),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const farmerApi = {
  list: (params) => api.get('/farmers', { params }),
  create: (payload) => api.post('/farmers', payload),
  getOne: (id) => api.get(`/farmers/${id}`),
  getMe: () => api.get('/farmers/me'),
  update: (id, payload) => api.put(`/farmers/${id}`, payload),
  remove: (id) => api.delete(`/farmers/${id}`),
  uploadPhoto: (id, formData) =>
    api.post(`/farmers/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listFarms: (id) => api.get(`/farmers/${id}/farms`),
  addFarm: (id, payload) => api.post(`/farmers/${id}/farms`, payload),
  updateFarm: (farmId, payload) => api.put(`/farmers/farms/${farmId}`, payload),
  removeFarm: (farmId) => api.delete(`/farmers/farms/${farmId}`),
};

export const productApi = {
  categories: () => api.get('/products/categories'),
  list: (params) => api.get('/products', { params }),
  create: (payload) => api.post('/products', payload),
  getOne: (id) => api.get(`/products/${id}`),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, formData) =>
    api.post(`/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const inventoryApi = {
  listWarehouses: (params) => api.get('/warehouse/warehouses', { params }),
  createWarehouse: (payload) => api.post('/warehouse/warehouses', payload),
  listShelves: (warehouseId) => api.get(`/warehouse/warehouses/${warehouseId}/shelves`),
  createShelf: (warehouseId, payload) => api.post(`/warehouse/warehouses/${warehouseId}/shelves`, payload),
  environmentLogs: (warehouseId) => api.get(`/warehouse/warehouses/${warehouseId}/environment-logs`),
  logEnvironment: (warehouseId, payload) => api.post(`/warehouse/warehouses/${warehouseId}/environment-logs`, payload),
  receiveBatch: (payload) => api.post('/warehouse/batches', payload),
  listInventory: (params) => api.get('/warehouse/inventory', { params }),
  listMovements: (params) => api.get('/warehouse/stock-movements', { params }),
  adjustStock: (payload) => api.post('/warehouse/stock-movements', payload),
};

export const collectionApi = {
  list: (params) => api.get('/collection', { params }),
  create: (payload) => api.post('/collection', payload),
  getOne: (id) => api.get(`/collection/${id}`),
  update: (id, payload) => api.put(`/collection/${id}`, payload),
  remove: (id) => api.delete(`/collection/${id}`),
  assignFarmer: (id, farmerId) => api.post(`/collection/${id}/farmers`, { farmerId }),
  unassignFarmer: (id, farmerId) => api.delete(`/collection/${id}/farmers/${farmerId}`),
  listAssignedFarmers: (id) => api.get(`/collection/${id}/farmers`),
  listRecords: (params) => api.get('/collection/records', { params }),
  createRecord: (payload) => api.post('/collection/records', payload),
};

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  create: (payload) => api.post('/orders', payload),
  getOne: (id) => api.get(`/orders/${id}`),
  history: (id) => api.get(`/orders/${id}/history`),
  accept: (id, notes) => api.patch(`/orders/${id}/accept`, { notes }),
  reject: (id, notes) => api.patch(`/orders/${id}/reject`, { notes }),
  cancel: (id, notes) => api.patch(`/orders/${id}/cancel`, { notes }),
  fulfill: (id, notes) => api.patch(`/orders/${id}/fulfill`, { notes }),
};

export const shipmentApi = {
  listVehicles: (params) => api.get('/transport/vehicles', { params }),
  createVehicle: (payload) => api.post('/transport/vehicles', payload),
  listDrivers: () => api.get('/transport/drivers'),
  upsertDriver: (payload) => api.post('/transport/drivers', payload),
  list: (params) => api.get('/transport/shipments', { params }),
  create: (payload) => api.post('/transport/shipments', payload),
  getOne: (id) => api.get(`/transport/shipments/${id}`),
  updateStatus: (id, payload) => api.patch(`/transport/shipments/${id}/status`, payload),
  updateLocation: (id, payload) => api.patch(`/transport/shipments/${id}/location`, payload),
  route: (id) => api.get(`/transport/shipments/${id}/route`),
};

export const buyerApi = {
  register: (payload) => api.post('/buyers/register', payload),
  getMe: () => api.get('/buyers/me'),
  updateMe: (payload) => api.put('/buyers/me', payload),
  purchaseHistory: () => api.get('/buyers/me/purchase-history'),
  activeOrders: () => api.get('/buyers/me/active-orders'),
  list: (params) => api.get('/buyers', { params }),
  getOne: (id) => api.get(`/buyers/${id}`),
};

export const retailerApi = {
  register: (payload) => api.post('/retailer/register', payload),
  getMe: () => api.get('/retailer/me'),
  updateMe: (payload) => api.put('/retailer/me', payload),
  receive: (payload) => api.post('/retailer/receive', payload),
  stock: (params) => api.get('/retailer/stock', { params }),
};

export const reportApi = {
  sales: (params) => api.get('/reports/sales', { params }),
  farmers: (params) => api.get('/reports/farmers', { params }),
  products: (params) => api.get('/reports/products', { params }),
  shipments: (params) => api.get('/reports/shipments', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
};

export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  ordersChart: (params) => api.get('/analytics/charts/orders', { params }),
  shipmentsChart: () => api.get('/analytics/charts/shipments'),
  productsChart: () => api.get('/analytics/charts/products'),
};

export const profileApi = {
  update: (payload) => api.put('/profile', payload),
  uploadPhoto: (formData) => api.post('/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (payload) => api.post('/profile/change-password', payload),
};

export const searchApi = {
  search: (q) => api.get('/search', { params: { q } }),
};
