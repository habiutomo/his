import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Department } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentStats() {
  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Calculate average occupancy and staff utilization
  const averageOccupancy = departments
    ? Math.round(departments.reduce((acc, dept) => acc + dept.occupancy, 0) / departments.length)
    : 0;

  const averageStaffUtilization = departments
    ? Math.round(departments.reduce((acc, dept) => acc + dept.staffUtilization, 0) / departments.length)
    : 0;

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Department Stats</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))
          ) : departments?.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No departments found.
            </div>
          ) : (
            departments?.map((dept) => (
              <div key={dept.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  <span className="text-sm font-medium text-gray-700">{dept.occupancy}%</span>
                </div>
                <Progress value={dept.occupancy} className="h-2" />
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Department Capacity</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : `${averageOccupancy}%`}</p>
              <p className="text-xs text-gray-500">Average Occupancy</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : `${averageStaffUtilization}%`}</p>
              <p className="text-xs text-gray-500">Staff Utilization</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
