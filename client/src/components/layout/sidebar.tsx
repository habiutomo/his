import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

type NavigationItem = {
  name: string;
  href: string;
  icon: string;
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navigationItems: NavigationItem[] = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Patients", href: "/patients", icon: "people" },
    { name: "Appointments", href: "/appointments", icon: "event" },
    { name: "Medical Records", href: "/medical-records", icon: "folder_shared" },
    { name: "Prescriptions", href: "/prescriptions", icon: "medication" },
    { name: "Departments", href: "/departments", icon: "business" },
    { name: "Staff", href: "/staff", icon: "badge" },
    { name: "Reports", href: "/reports", icon: "bar_chart" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-neutral-dark text-white">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          <span className="material-icons text-primary-light mr-2">local_hospital</span>
          <h1 className="text-xl font-semibold">MediTrack HIS</h1>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="material-icons">person</span>
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400">{user?.role || 'Role'}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-grow overflow-y-auto scrollbar-hide p-2">
        <ul>
          {navigationItems.map((item) => (
            <li key={item.href} className="mb-1">
              <Link href={item.href}>
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-lg hover:bg-gray-700",
                    location === item.href && "bg-gray-700"
                  )}
                >
                  <span className="material-icons mr-3 text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <button 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex items-center justify-center w-full px-4 py-2 text-sm text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-70"
        >
          {logoutMutation.isPending ? (
            <span className="material-icons animate-spin mr-2">refresh</span>
          ) : (
            <span className="material-icons mr-2">logout</span>
          )}
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
