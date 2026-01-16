import React, { useState } from "react";
import { Brain, User, LogOut, Settings, BarChart3, List, X, Briefcase, Menu } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import StockSearch from "./StockSearch";
import { useStock } from "@/context/StockContext";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/context/LanguageContext";

const AppHeader: React.FC = () => {
  const { handleSearch, isLoading } = useStock();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [enableDeepResearch, setEnableDeepResearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleStockSearch = (ticker: string) => {
    navigate("/analyzer");
    handleSearch(ticker, enableDeepResearch);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/auth");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-18 bg-background border-b border-border">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full items-center px-6 gap-6 max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-semibold text-lg">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Aesy</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <Link to="/analyzer">
            <Button variant={isActive("/analyzer") ? "secondary" : "ghost"} size="sm">
              {t('nav.analyzer')}
            </Button>
          </Link>
          <Link to="/quant-analyzer">
            <Button variant={isActive("/quant-analyzer") ? "secondary" : "ghost"} size="sm">
              {t('nav.boersenAnalyzer')}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="relative opacity-50"
          >
            {t('nav.watchlists')}
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
              {t('common.soon')}
            </Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="relative opacity-50"
          >
            {t('nav.portfolios')}
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
              {t('common.soon')}
            </Badge>
          </Button>
        </nav>

        {/* Search Field - Centered */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xl">
            <StockSearch
              onSearch={handleStockSearch}
              isLoading={isLoading}
              compact
              enableDeepResearch={enableDeepResearch}
              onDeepResearchChange={setEnableDeepResearch}
            />
          </div>
        </div>

        {/* Profile Menu - Conditional */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled className="opacity-50">
                <List className="h-4 w-4 mr-2" />
                {t('nav.watchlists')}
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {t('common.soon')}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50">
                <Briefcase className="h-4 w-4 mr-2" />
                {t('nav.portfolios')}
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {t('common.soon')}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            {t('nav.signIn')}
          </Button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full flex items-center justify-between px-4 gap-3 max-w-screen-xl mx-auto">
        {/* Logo - Links */}
        <Link to="/" className="shrink-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">A</span>
          </div>
        </Link>

        {/* Search - Mittig zentriert */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-[280px]">
            <StockSearch
              onSearch={handleStockSearch}
              isLoading={isLoading}
              compact
              mobileMode
              enableDeepResearch={enableDeepResearch}
              onDeepResearchChange={setEnableDeepResearch}
            />
          </div>
        </div>

        {/* Profile Button - Rechts (blauer Hintergrund!) */}
        <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="w-10 h-10 rounded-xl bg-primary shrink-0 btn-no-mobile-full"
            >
              <Menu className="h-5 w-5 text-primary-foreground" />
            </Button>
          </DrawerTrigger>

          <DrawerContent className="h-[100vh]" showHandle>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Menüpunkte */}
              <nav className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => handleMobileNavigation("/analyzer")}
                  className="w-full justify-start text-lg h-14"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  {t('nav.analyzer')}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleMobileNavigation("/quant-analyzer")}
                  className="w-full justify-start text-lg h-14"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  {t('nav.boersenAnalyzer')}
                </Button>

                <Button variant="ghost" disabled className="w-full justify-start text-lg h-14 opacity-50">
                  <List className="mr-3 h-5 w-5" />
                  {t('nav.watchlists')}
                  <Badge variant="secondary" className="ml-auto">
                    {t('common.soon')}
                  </Badge>
                </Button>

                <Button variant="ghost" disabled className="w-full justify-start text-lg h-14 opacity-50">
                  <Briefcase className="mr-3 h-5 w-5" />
                  {t('nav.portfolios')}
                  <Badge variant="secondary" className="ml-auto">
                    {t('common.soon')}
                  </Badge>
                </Button>

                <Separator className="my-4" />

                {/* Login/Logout Button - Conditional */}
                {user ? (
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-lg h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    {t('nav.signOut')}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => handleMobileNavigation("/auth")}
                    className="w-full justify-start text-lg h-14"
                  >
                    <User className="mr-3 h-5 w-5" />
                    {t('nav.signIn')}
                  </Button>
                )}
              </nav>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
};

export default AppHeader;
