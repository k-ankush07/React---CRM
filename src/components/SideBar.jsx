import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "./Use-auth";
import { LayoutDashboard, Users, CircleUserRound, Clock, LogOut, FolderGit, Tent, ArrowRightLeft } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";

export function Sidebar() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  if (!user) return null;

  const links = [
    {
      href: user.role === "admin" ? "/admin" : user.role === "management" ? "/management" : user.role === "hr" ? "/hr-dashboard" : "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "management", "employee", "hr"],
    },
    { href: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'management', 'hr'] },
    { href: '/projects', label: 'Projects', icon: FolderGit, roles: ['admin', 'management'] },
    { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft, roles: ['management'] },
    { href: '/time-tracker', label: 'Time Tracker', icon: Clock, roles: ['employee'] },
    { href: '/project', label: 'Projects', icon: FolderGit, roles: ['employee'] },
    { href: '/account', label: 'Account', icon: CircleUserRound, roles: ['admin', 'management', 'employee', 'hr'] },
    { href: '/policies', label: 'Policies', icon: Tent, roles: ['admin', 'management', 'employee', 'hr'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user.role));

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col shadow-xl sticky top-0"
      style={{ backgroundColor: "#fefbfd" }}>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <img src="https://www.hubsyntax.com/Hubsyntax-logo.png" alt="" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-foreground">HubSyntax</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {filteredLinks.map(link => {
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                isActive
                  ? " bg-[#fbe5e9] text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <link.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50 bg-secondary/30 flex items-start justify-between">
        <div className="flex items-center gap-3  ">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white font-bold shadow-md">
            <img
              src={user?.image}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
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