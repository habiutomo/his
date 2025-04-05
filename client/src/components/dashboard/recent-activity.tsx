import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ActivityLog, Patient, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentActivity() {
  // Fetch recent activity logs
  const { data: activityLogs, isLoading: isLoadingLogs } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs/recent"],
  });

  // Fetch patients for mapping to activity logs
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch staff/users for mapping to activity logs
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });

  const isLoading = isLoadingLogs || isLoadingPatients || isLoadingUsers;

  // Map user and patient data to activity logs
  const activitiesWithDetails = activityLogs?.map(log => {
    const user = users?.find(u => u.id === log.userId);
    const patient = patients?.find(p => p.id === log.patientId);
    
    return {
      ...log,
      userName: user?.name || "Unknown User",
      userRole: user?.role || "",
      patientName: patient?.name || "Unknown Patient",
    };
  }) || [];

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "appointment":
        return { icon: "event_note", bgColor: "bg-blue-100", textColor: "text-blue-500" };
      case "prescription":
        return { icon: "medication", bgColor: "bg-green-100", textColor: "text-green-500" };
      case "medical-record":
        return { icon: "science", bgColor: "bg-purple-100", textColor: "text-purple-500" };
      case "registration":
        return { icon: "person_add", bgColor: "bg-gray-100", textColor: "text-gray-500" };
      default:
        return { icon: "info", bgColor: "bg-gray-100", textColor: "text-gray-500" };
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Patient Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="flow-root">
          <ul className="-mb-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex items-start space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <Skeleton className="h-4 w-40 inline-block" />
                            <Skeleton className="h-4 w-20 inline-block mx-1" />
                            <Skeleton className="h-4 w-32 inline-block" />
                          </div>
                          <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                        <div className="mt-2">
                          <Skeleton className="h-4 w-full max-w-[350px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : activitiesWithDetails.length === 0 ? (
              <li className="py-8 text-center text-gray-500">
                No recent activity found.
              </li>
            ) : (
              activitiesWithDetails.map((activity, index) => {
                const { icon, bgColor, textColor } = getActivityIcon(activity.activityType);
                const isLast = index === activitiesWithDetails.length - 1;
                
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span 
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                          aria-hidden="true"
                        ></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center ring-8 ring-white`}>
                            <span className={`material-icons ${textColor}`}>{icon}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm">
                              {activity.userName && (
                                <a href="#" className="font-medium text-gray-900">{activity.userName}</a>
                              )}
                              <span className="text-gray-500"> {activity.description}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {activity.timestamp && formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          {activity.details && (
                            <div className="mt-2 text-sm text-gray-700">
                              <p>{JSON.stringify(activity.details)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
