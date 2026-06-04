import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userNavigationGroups, userRouteMap } from "@/lib/lydo-connect-data";

const navItems = [
  { label: "Home", href: "/" },
  { label: "FAQs", href: "/faqs" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut, role } = useAuth();

  const handleSignOut = () => {
    signOut();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-primary/15">
      <div className="container mx-auto flex items-center justify-between h-16 px-3 sm:px-4 gap-2">
        <Link to="/" className="min-w-0">
          <BrandLogo
            imgClassName="h-9 w-9 sm:h-10 sm:w-10"
            showText
            textClassName="hidden sm:block"
          />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "bg-primary/12 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && role !== "admin"
            ? userNavigationGroups.map((group) => {
                const isGroupActive = group.items.some((item) => location.pathname === userRouteMap[item.id]);
                return (
                  <DropdownMenu key={group.id}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className={`gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                          isGroupActive
                            ? "bg-primary/12 text-primary border border-primary/25"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        }`}
                      >
                        {group.label}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="min-w-[240px]">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === userRouteMap[item.id];
                        return (
                          <DropdownMenuItem
                            key={item.id}
                            className={active ? "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary" : ""}
                            onClick={() => navigate(userRouteMap[item.id])}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })
            : null}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={role === "admin" ? "/admin" : "/dashboard"}>{role === "admin" ? "Admin Portal" : "Open Portal"}</Link>
              </Button>
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
        <div className="md:hidden bg-background border-b border-primary/15 px-4 pb-4">
          <div className="py-3">
            <Link to="/" onClick={() => setMobileOpen(false)}>
              <BrandLogo imgClassName="h-8 w-8" showText textClassName="text-sm" />
            </Link>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                location.pathname === item.href
                  ? "bg-primary/12 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && role !== "admin" ? (
            <div className="mt-3 space-y-3 px-4">
              {userNavigationGroups.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          navigate(userRouteMap[item.id]);
                          setMobileOpen(false);
                        }}
                        className={`block w-full rounded-lg px-4 py-3 text-left text-sm font-medium ${
                          location.pathname === userRouteMap[item.id]
                            ? "bg-primary/12 text-primary border border-primary/25"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2 mt-3 px-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={role === "admin" ? "/admin" : "/dashboard"} onClick={() => setMobileOpen(false)}>
                    {role === "admin" ? "Admin Portal" : "Open Portal"}
                  </Link>
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
