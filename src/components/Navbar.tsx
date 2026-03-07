import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "Events", href: "/events" },
  { label: "Organizations", href: "/organizations" },
  { label: "Citizen Desk", href: "/feedback" },
];

const transparencyItems = [
  { label: "Disclosure Registry", href: "/transparency/reports" },
  { label: "Transparency Board", href: "/transparency/board" },
  { label: "Financial Disclosure", href: "/transparency/financial-disclosure" },
  { label: "Barangay Map", href: "/transparency/barangay-map" },
  { label: "Service Advisories", href: "/transparency/service-advisories" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTransparencyOpen, setMobileTransparencyOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut, role } = useAuth();

  const handleSignOut = () => {
    signOut();
    setMobileOpen(false);
    navigate("/");
  };

  const isTransparencyPath = location.pathname.startsWith("/transparency");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-3 sm:px-4 gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-xs tracking-tight">YG</span>
          </div>
          <span className="hidden sm:inline font-heading font-bold text-sm lg:text-base text-foreground leading-tight max-w-[13rem] lg:max-w-none">
            <span className="lg:hidden">Youth Governance System</span>
            <span className="hidden lg:inline">Youth Governance Transparency and Accountability System</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isTransparencyPath
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Transparency <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {transparencyItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link to={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                {role === "sk" ? "Barangay SK" : role}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-foreground shrink-0"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                location.pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMobileTransparencyOpen(!mobileTransparencyOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${
              isTransparencyPath ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
          >
            <span>Transparency</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileTransparencyOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileTransparencyOpen && (
            <div className="ml-4 space-y-1">
              {transparencyItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    location.pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3 px-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="flex-1" asChild>
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
