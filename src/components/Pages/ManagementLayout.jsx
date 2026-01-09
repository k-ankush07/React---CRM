import { Sidebar } from "../SideBar";
import Dashboard from "../ui/Dashboard";

export default function ManagementLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background/50">
      <Sidebar />
      <div className="flex-1  bg-[#ffffff]">
        <Dashboard />
        <div className="pt-[88px]">
          {children}</div>
      </div>
    </div>
  );
}