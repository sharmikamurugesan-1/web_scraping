import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';

import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import ProductsListPage from './pages/ProductsListPage';
import ReviewsPage from './pages/ReviewsPage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import { api } from './services/api';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('demo_iphone_15_pro');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);

  // Load products and verify backend health on startup
  useEffect(() => {
    api.getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    api.listProducts(100)
      .then((res) => {
        if (res.products && res.products.length > 0) {
          setProducts(res.products);
          setSelectedProductId((prev) => {
            const exists = res.products.some((p) => p.id === prev);
            return exists ? prev : res.products[0].id;
          });
        }
      })
      .catch((err) => console.error("Error loading products list:", err));
  }, []);

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    // If currently on dashboard, navigate to the specific product dashboard
    if (location.pathname.startsWith('/dashboard')) {
      navigate(`/dashboard/${productId}`);
    }
  };

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;

  // Determine if this is the marketing landing page (/)
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100 selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-1">
          <LandingPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Full-featured SaaS Command Center Shell for all analytical views
  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 selection:bg-brand-500 selection:text-white flex flex-col">
      {/* Sidebar navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        apiOnline={apiOnline}
      />

      {/* Main Container with smooth margin transition matching sidebar width */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Top bar with product switcher and global search */}
        <TopHeader
          setMobileOpen={setMobileOpen}
          products={products}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
          activeProduct={activeProduct}
          collapsed={collapsed}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 pb-12">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  activeProductId={selectedProductId}
                  onSelectProduct={setSelectedProductId}
                />
              }
            />
            <Route
              path="/dashboard/:id"
              element={
                <DashboardPage
                  activeProductId={selectedProductId}
                  onSelectProduct={setSelectedProductId}
                />
              }
            />
            <Route path="/analyze" element={<SearchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/products" element={<ProductsListPage />} />
            <Route
              path="/reviews"
              element={<ReviewsPage activeProductId={selectedProductId} />}
            />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route
              path="/insights"
              element={<InsightsPage activeProductId={selectedProductId} />}
            />
            <Route
              path="/reports"
              element={<ReportsPage activeProductId={selectedProductId} />}
            />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Fallback route */}
            <Route
              path="*"
              element={
                <DashboardPage
                  activeProductId={selectedProductId}
                  onSelectProduct={setSelectedProductId}
                />
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
