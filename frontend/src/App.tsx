import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { useAuth } from './features/auth/AuthProvider';
import { LoginPage } from './pages/LoginPage';
import { PageLoading } from './components/TableStates';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage').then((module) => ({ default: module.CustomerDetailPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const StockMovementsPage = lazy(() => import('./pages/StockMovementsPage').then((module) => ({ default: module.StockMovementsPage })));
const ChallansPage = lazy(() => import('./pages/ChallansPage').then((module) => ({ default: module.ChallansPage })));
const ChallanCreatePage = lazy(() => import('./pages/ChallanCreatePage').then((module) => ({ default: module.ChallanCreatePage })));
const ChallanDetailPage = lazy(() => import('./pages/ChallanDetailPage').then((module) => ({ default: module.ChallanDetailPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function ChallanCreateGuard() {
  const { can } = useAuth();
  return can('ADMIN', 'SALES') ? <ChallanCreatePage /> : <Navigate to="/challans" replace />;
}

export function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="stock-movements" element={<StockMovementsPage />} />
            <Route path="challans" element={<ChallansPage />} />
            <Route path="challans/new" element={<ChallanCreateGuard />} />
            <Route path="challans/:id" element={<ChallanDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
