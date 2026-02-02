import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Users, QrCode, History, Menu, X, LogOut, Car } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import logoWhite from '@/assets/logo-white.png';
import logoIconWhite from '@/assets/logo-icon-white.png';

const navItems = [{
  to: '/',
  icon: LayoutDashboard,
  label: 'Dashboard'
}, {
  to: '/equipment',
  icon: Package,
  label: 'Equipamentos'
}, {
  to: '/vehicles',
  icon: Car,
  label: 'Veículos'
}, {
  to: '/users',
  icon: Users,
  label: 'Usuários'
}, {
  to: '/movement',
  icon: QrCode,
  label: 'Movimentação'
}, {
  to: '/history',
  icon: History,
  label: 'Histórico'
}];
export function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    signOut
  } = useAuth();
  const handleLogout = async () => {
    await signOut();
  };
  return <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img alt="UNAX Group" className="h-10 w-auto" src={logoWhite} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar - Desktop always visible, Mobile slide-in */}
      <aside className={cn("fixed top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300", "w-64 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <img src={logoWhite} alt="UNAX Group" className="h-11 w-auto transition-transform hover:scale-105" />
        </div>
        
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200", isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>;
        })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
          <p className="text-xs text-sidebar-foreground/40 text-center">
            Sistema de Almoxarifado
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden mobile-nav safe-bottom">
        <div className="flex justify-around">
          {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return <Link key={item.to} to={item.to} className={cn("mobile-nav-item flex-1", isActive && "active")}>
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>;
        })}
        </div>
      </nav>
    </>;
}