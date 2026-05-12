import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import AppHeader from "./components/AppHeader";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import BuffettAnalyzer from "./pages/BuffettAnalyzer";
import BuffettQuantAnalyzer from "./pages/BuffettQuantAnalyzer";
import LiveAnalysis from "./pages/LiveAnalysis";
import Watchlists from "./pages/Watchlists";
import WatchlistDetail from "./pages/WatchlistDetail";
import Portfolios from "./pages/Portfolios";
import AdminDashboard from "./pages/AdminDashboard";
import DesignSystem from "./pages/DesignSystem";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/AdminRoute";
import ImpersonationBanner from "./components/ImpersonationBanner";
import { AuthProvider } from "./context/AuthContext";
import { StockProvider } from "./context/StockContext";
import { LanguageProvider } from "./context/LanguageContext";

const queryClient = new QueryClient();

const App = () => {
  // Component to access location
  const AppContent = () => {
    const location = useLocation();
    const isAuthPage = location.pathname === "/auth";
    const isLandingPage = location.pathname === "/";
    
    // Initialize analytics and track page views
    useAnalytics();
    
    return (
      <div className="min-h-screen bg-background flex flex-col w-full">
        {/* App Header - Fixed at top */}
        {!isAuthPage && !isLandingPage && <AppHeader />}

        {/* Main content area */}
        <main className={`
          ${!isAuthPage && !isLandingPage ? 'pt-18' : ''}
          min-h-screen flex-1 w-full
        `}>
          {/* Impersonation Banner */}
          {!isAuthPage && !isLandingPage && (
            <div className="px-4 pt-4">
              <ImpersonationBanner />
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/analyzer" element={<BuffettAnalyzer />} />
            <Route path="/quant" element={<BuffettQuantAnalyzer />} />
            <Route path="/live-analysis" element={<LiveAnalysis />} />
            <Route path="/watchlists" element={<Watchlists />} />
            <Route path="/watchlists/:id" element={<WatchlistDetail />} /> 
            <Route path="/portfolios" element={<Portfolios />} />
            <Route path="/design-system" element={<DesignSystem />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <StockProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </StockProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;