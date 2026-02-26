import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, ArrowUpDown, PieChart, Wallet, RotateCw, Lightbulb, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Tu panorama", icon: Home },
  { to: "/transactions", label: "Transacciones", icon: ArrowUpDown },
  { to: "/budgets", label: "Presupuestos", icon: PieChart },
  { to: "/accounts", label: "Cuentas", icon: Wallet },
  { to: "/subscriptions", label: "Suscripciones", icon: RotateCw },
  { to: "/insights", label: "Insights", icon: Lightbulb },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border p-6 fixed h-full">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Clara</h1>
          <p className="text-xs text-muted-foreground mt-1">Tu copiloto financiero</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">Todo claro ✨</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Clara</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="bg-sidebar w-64 h-full p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 mt-12">
              <p className="text-xs text-muted-foreground">Tu copiloto financiero</p>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
