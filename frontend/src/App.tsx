import { Navigate, useRoutes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import CarDetail from './pages/CarDetail'
import UserLayout from './layouts/UserLayout'
import MyOrders from './pages/user/MyOrders'
import MyProfile from './pages/user/MyProfile'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import RoleManagement from './pages/admin/RoleManagement'
import PermissionManagement from './pages/admin/PermissionManagement'
import CarManagement from './pages/admin/CarManagement'
import CarTypeManagement from './pages/admin/CarTypeManagement'
import OrderManagement from './pages/admin/OrderManagement'
import AnnouncementManagement from './pages/admin/AnnouncementManagement'
import AboutUsManagement from './pages/admin/AboutUsManagement'
import SiteIntroManagement from './pages/admin/SiteIntroManagement'

export default function App() {
  const routes = useRoutes([
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/',
      element: <Home />,
    },
    {
      path: '/cars/:id',
      element: <CarDetail />,
    },
    {
      path: '/user',
      element: <UserLayout />,
      children: [
        { index: true, element: <Navigate to="orders" replace /> },
        { path: 'orders', element: <MyOrders /> },
        { path: 'profile', element: <MyProfile /> },
      ],
    },
    {
      path: '/admin',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard', element: <AdminDashboard /> },
        { path: 'users', element: <UserManagement /> },
        { path: 'roles', element: <RoleManagement /> },
        { path: 'permissions', element: <PermissionManagement /> },
        { path: 'cars', element: <CarManagement /> },
        { path: 'car-types', element: <CarTypeManagement /> },
        { path: 'orders', element: <OrderManagement /> },
        { path: 'announcements', element: <AnnouncementManagement /> },
        { path: 'about-us', element: <AboutUsManagement /> },
        { path: 'site-intro', element: <SiteIntroManagement /> },
      ],
    },
  ])

  return routes
}
