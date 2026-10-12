import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerTracking from './pages/CustomerTracking';
import DashboardHome from './pages/dashboard/DashboardHome';
import NotFound from './pages/NotFound';

import FarmerList from './pages/farmers/FarmerList';
import FarmerProfile from './pages/farmers/FarmerProfile';
import ProductList from './pages/products/ProductList';
import InventoryPage from './pages/inventory/InventoryPage';
import CenterList from './pages/collection/CenterList';
import CenterProfile from './pages/collection/CenterProfile';
import CollectionRecordsPage from './pages/collection/CollectionRecordsPage';
import OrderList from './pages/orders/OrderList';
import ShipmentList from './pages/shipments/ShipmentList';
import ShipmentDetail from './pages/shipments/ShipmentDetail';
import BuyerList from './pages/buyers/BuyerList';
import MyBuyerProfile from './pages/buyers/MyBuyerProfile';
import RetailerStockPage from './pages/retailer/RetailerStockPage';
import ReportsPage from './pages/reports/ReportsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import UsersPage from './pages/admin/UsersPage';
import ActivityLogsPage from './pages/admin/ActivityLogsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/track" element={<CustomerTracking />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardHome />} />

                  {/* Farmers */}
                  <Route path="/dashboard/farmers" element={<FarmerList />} />
                  <Route path="/dashboard/farmers/:id" element={<FarmerProfile />} />
                  <Route path="/dashboard/my-farmer-profile" element={<FarmerProfile />} />

                  {/* Products */}
                  <Route path="/dashboard/products" element={<ProductList />} />

                  {/* Inventory */}
                  <Route path="/dashboard/inventory" element={<InventoryPage />} />

                  {/* Collection Centers */}
                  <Route path="/dashboard/collection-centers" element={<CenterList />} />
                  <Route path="/dashboard/collection-centers/:id" element={<CenterProfile />} />
                  <Route path="/dashboard/collection-records" element={<CollectionRecordsPage />} />

                  {/* Orders */}
                  <Route path="/dashboard/orders" element={<OrderList />} />

                  {/* Shipments */}
                  <Route path="/dashboard/shipments" element={<ShipmentList />} />
                  <Route path="/dashboard/shipments/:id" element={<ShipmentDetail />} />

                  {/* Buyers */}
                  <Route path="/dashboard/buyers" element={<BuyerList />} />
                  <Route path="/dashboard/my-buyer-profile" element={<MyBuyerProfile />} />

                  {/* Retailer */}
                  <Route path="/dashboard/retailer-stock" element={<RetailerStockPage />} />

                  {/* Reports & Analytics */}
                  <Route path="/dashboard/reports" element={<ReportsPage />} />
                  <Route path="/dashboard/analytics" element={<AnalyticsPage />} />

                  {/* Notifications & Profile */}
                  <Route path="/dashboard/notifications" element={<NotificationsPage />} />
                  <Route path="/dashboard/profile" element={<ProfilePage />} />

                  {/* Admin */}
                  <Route path="/dashboard/users" element={<UsersPage />} />
                  <Route path="/dashboard/activity-logs" element={<ActivityLogsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
