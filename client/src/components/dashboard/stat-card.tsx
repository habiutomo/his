import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: "primary" | "secondary" | "warning" | "accent";
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorMap = {
    primary: {
      border: "border-primary",
      bg: "bg-primary-light bg-opacity-10",
      text: "text-primary",
    },
    secondary: {
      border: "border-secondary",
      bg: "bg-secondary-light bg-opacity-10",
      text: "text-secondary",
    },
    warning: {
      border: "border-yellow-500",
      bg: "bg-yellow-400 bg-opacity-10",
      text: "text-yellow-500",
    },
    accent: {
      border: "border-purple-500",
      bg: "bg-purple-400 bg-opacity-10",
      text: "text-purple-500",
    },
  };

  return (
    <Card className={cn("p-4 border-l-4", colorMap[color].border)}>
      <div className="flex items-center">
        <div className={cn("flex-shrink-0 rounded-full p-3", colorMap[color].bg)}>
          <span className={cn("material-icons", colorMap[color].text)}>{icon}</span>
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
