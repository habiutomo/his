import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Appointment, Patient, User } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppointmentList() {
  // Fetching appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Fetching patients for mapping patient data to appointments
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetching doctors for mapping doctor data to appointments
  const { data: staff, isLoading: isLoadingStaff } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });

  const isLoading = isLoadingAppointments || isLoadingPatients || isLoadingStaff;

  // Map patient and doctor data to appointments
  const appointmentsWithDetails = appointments?.map(appointment => {
    const patient = patients?.find(p => p.id === appointment.patientId);
    const doctor = staff?.find(s => s.id === appointment.doctorId);
    return {
      ...appointment,
      patientName: patient?.name || "Unknown Patient",
      patientId: patient?.patientId || "Unknown ID",
      patientAvatar: patient?.avatar,
      doctorName: doctor?.name || "Unknown Doctor",
    };
  }).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()) || [];

  // Only take the first 4 appointments for the dashboard
  const upcomingAppointments = appointmentsWithDetails.slice(0, 4);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Appointments</CardTitle>
        <Button variant="link" className="text-sm text-primary hover:text-primary-dark">View all</Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-4">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-3 w-10" />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : upcomingAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                    No upcoming appointments
                  </TableCell>
                </TableRow>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
                          <AvatarFallback>{appointment.patientName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                          <div className="text-sm text-gray-500">{appointment.patientId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(appointment.appointmentDate), "hh:mm a")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(appointment.appointmentDate), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.purpose}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        appointment.status === "confirmed" ? "success" :
                        appointment.status === "pending" ? "warning" :
                        appointment.status === "cancelled" ? "destructive" :
                        "outline"
                      }>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="link" className="text-primary hover:text-primary-dark mr-3">View</Button>
                      <Button variant="link" className="text-gray-500 hover:text-gray-700">Reschedule</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
