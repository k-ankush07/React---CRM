import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "./Use-auth";
import {
  LayoutDashboard,
  Users,
  CircleUserRound,
  Clock,
  LogOut,
  FolderGit,
  Tent,
  ArrowRightLeft,
  Settings
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";

export function Sidebar() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  if (!user) return null;

  const links = [
    {
      href:
        user.role === "admin"
          ? "/admin"
          : user.role === "management"
            ? "/management"
            : user.role === "hr"
              ? "/hr-dashboard"
              : "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "management", "employee", "hr"],
    },
    { href: "/employees", label: "Employees", icon: Users, roles: ["admin", "management", "hr"] },
    { href: "/projects", label: "Projects", icon: FolderGit, roles: ["admin", "management"] },
    { href: "/transactions", label: "Transactions", icon: ArrowRightLeft, roles: ["management"] },
    { href: "/time-tracker", label: "Time Tracker", icon: Clock, roles: ["employee"] },
    { href: "/project", label: "Projects", icon: FolderGit, roles: ["employee"] },
    { href: "/policies", label: "Policies", icon: Tent, roles: ["admin", "management", "employee", "hr"] },
    { href: "/account", label: "Account", icon: CircleUserRound, roles: ["admin", "management", "employee", "hr"] },
    { href: "/setting", label: "Setting", icon: Settings, roles: ["admin"] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user.role));
  const mainLinks = filteredLinks.filter(
    link => link.href !== "/account" && link.href !== "/setting"
  );

  const bottomLinks = filteredLinks.filter(
    link => link.href === "/account" || link.href === "/setting"
  );

  return (
    <div
      className="h-screen w-64 bg-card border-r border-border flex flex-col shadow-xl sticky top-0"
      style={{ backgroundColor: "#fefbfd" }}
    >
      {/* LOGO */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <img src="https://www.hubsyntax.com/Hubsyntax-logo.png" alt="HubSyntax" />
          </div>
          <h1 className="font-bold text-xl text-foreground">HubSyntax</h1>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {mainLinks.map(link => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                    isActive
                      ? "bg-[#fbe5e9] text-primary shadow-lg"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {bottomLinks.length > 0 && (
          <div className="px-4 pb-3 space-y-1">
            {bottomLinks.map(link => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                      isActive
                        ? "bg-[#fbe5e9] text-primary shadow-lg"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50 bg-secondary/30 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={user.image}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {user.role}
            </p>
          </div>
        </div>
        <Button
          className="p-0 m-0 border-0 h-auto w-auto"
          onClick={() => logout()}
        >
          <LogOut size={14} />
        </Button>
      </div>
    </div>
  );
}
