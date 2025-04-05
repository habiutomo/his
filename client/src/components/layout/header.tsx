import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open mobile menu</span>
        </Button>
        
        {/* Search */}
        <div className="flex-1 mx-4">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <span className="material-icons">search</span>
            </span>
            <Input 
              type="text" 
              className="pl-10"
              placeholder="Search patients, records, appointments..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          
          {/* Help */}
          <Button variant="ghost" size="icon">
            <span className="material-icons">help_outline</span>
          </Button>
          
          {/* Account */}
          <Avatar className="h-8 w-8 border-2 border-gray-200">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className={cn(
              user?.role === "doctor" ? "bg-primary-light text-white" :
              user?.role === "nurse" ? "bg-secondary-light text-white" :
              "bg-gray-200"
            )}>
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
