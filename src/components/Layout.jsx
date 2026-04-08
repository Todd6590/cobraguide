import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, CalendarClock, 
  Mail, DollarSign, Shield, ChevronLeft, ChevronRight, LogOut, BarChart2, Settings,
  HelpCircle, BookOpen, MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import TrialBanner from '@/components/subscription/TrialBanner';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Building2 },
  { path: '/beneficiaries', label: 'Beneficiaries', icon: Users },
  { path: '/events', label: 'Qualifying Events', icon: CalendarClock },
  { path: '/notices', label: 'Notices', icon: Mail },
  { path: '/payments', label: 'Payments', icon: DollarSign },
  { path: '/reports', label: 'Employer Reports', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { tenantSettings, isAgency } = useSubscription();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {isAgency && tenantSettings?.logo_url ? (
              <img src={tenantSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                {isAgency && tenantSettings?.company_name ? tenantSettings.company_name : 'COBRA Admin'}
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60">Benefits Administration</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md' 
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          {/* Help section */}
          {!collapsed && (
            <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Help</p>
          )}
          {[
            { path: '/getting-started', label: 'Getting Started', icon: BookOpen },
            { path: '/contact', label: 'Contact Us', icon: MessageSquare },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <div className="border-t border-sidebar-border my-1" />

          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent transition-all w-full"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent transition-all w-full"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <TrialBanner />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}