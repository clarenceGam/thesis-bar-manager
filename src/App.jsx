import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BarManagement from './pages/BarManagement';
import Inventory from './pages/Inventory';
import Menu from './pages/Menu';
import Tables from './pages/Tables';
import Reservations from './pages/Reservations';
import Events from './pages/Events';
import Staff from './pages/Staff';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import DeductionSettings from './pages/DeductionSettings';
import Documents from './pages/Documents';
import Customers from './pages/Customers';
import Reviews from './pages/Reviews';
import Promotions from './pages/Promotions';
import Analytics from './pages/Analytics';
import Financials from './pages/Financials';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Branches from './pages/Branches';
import Subscription from './pages/Subscription';
import SubscriptionApprovals from './pages/SubscriptionApprovals';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bar-management" element={<ProtectedRoute permissions={['bar_details_view']}><BarManagement /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute permissions={['menu_view']}><Inventory /></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute permissions={['menu_view']}><Menu /></ProtectedRoute>} />
        <Route path="/tables" element={<ProtectedRoute permissions={['table_view']}><Tables /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute permissions={['reservation_view']}><Reservations /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute permissions={['events_view']}><Events /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute permissions={['staff_view']}><Staff /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute permissions={['attendance_view_own', 'attendance_view_all']}><Attendance /></ProtectedRoute>} />
        <Route path="/leaves" element={<ProtectedRoute permissions={['leave_view_own', 'leave_view_all']}><Leaves /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute permissions={['payroll_view_own', 'payroll_view_all']}><Payroll /></ProtectedRoute>} />
        <Route path="/deduction-settings" element={<ProtectedRoute permissions={['payroll_create']}><DeductionSettings /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute permissions={['documents_view_own', 'documents_view_all']}><Documents /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute permissions={['ban_view']}><Customers /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute permissions={['reviews_view']}><Reviews /></ProtectedRoute>} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/analytics" element={<ProtectedRoute permissions={['analytics_bar_view']}><Analytics /></ProtectedRoute>} />
        <Route path="/financials" element={<ProtectedRoute permissions={['financials_view']}><Financials /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute permissions={['logs_view']}><AuditLogs /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/subscription-approvals" element={<SubscriptionApprovals />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/subscription/success" element={<PaymentSuccess />} />
        <Route path="/subscription/failed" element={<PaymentFailed />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
