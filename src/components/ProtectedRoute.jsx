import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute() {
  const user = useSelector((state) => state.auth.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
