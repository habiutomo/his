import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Appointment, Patient, User, insertAppointmentSchema } from "@shared/schema";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, SearchIcon, PlusIcon, FilterIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Extended schema for the appointment form
const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentTime: z.string().min(1, "Please select a time"),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Fetch patients for the appointment form
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch doctors for the appointment form
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });

  // Only include doctors in the staff list
  const doctorsList = doctors?.filter(staff => staff.role === "doctor") || [];

  // Form for creating a new appointment
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: 0,
      doctorId: user?.role === "doctor" ? user.id : 0,
      appointmentDate: new Date(),
      appointmentTime: "09:00",
      purpose: "",
      status: "pending",
      notes: "",
    },
  });

  // Mutation for creating a new appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: AppointmentFormValues) => {
      // Combine date and time
      const date = new Date(appointmentData.appointmentDate);
      const [hours, minutes] = appointmentData.appointmentTime.split(":").map(Number);
      date.setHours(hours, minutes);

      // Create the actual payload
      const payload = {
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: date,
        purpose: appointmentData.purpose,
        status: appointmentData.status,
        notes: appointmentData.notes,
      };

      const res = await apiRequest("POST", "/api/appointments", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment created",
        description: "The appointment has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormValues) => {
    createAppointmentMutation.mutate(data);
  };

  // Filter appointments based on search term and status
  const filteredAppointments = appointments?.filter(appointment => {
    const matchesSearch = !searchTerm || 
      patients?.find(p => p.id === appointment.patientId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctors?.find(d => d.id === appointment.doctorId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  // Get patient and doctor details for each appointment
  const appointmentsWithDetails = filteredAppointments.map(appointment => {
    const patient = patients?.find(p => p.id === appointment.patientId);
    const doctor = doctors?.find(d => d.id === appointment.doctorId);
    return {
      ...appointment,
      patientName: patient?.name || "Unknown",
      patientAvatar: patient?.avatar,
      doctorName: doctor?.name || "Unknown",
      doctorAvatar: doctor?.avatar,
    };
  }).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

  const isLoading = isLoadingAppointments || isLoadingPatients || isLoadingDoctors;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className={`md:hidden fixed inset-0 z-40 ${mobileSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black opacity-50" onClick={() => setMobileSidebarOpen(false)}></div>
        <div className="absolute inset-y-0 left-0 w-64">
          <Sidebar />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto bg-neutral-light p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Appointments</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search appointments..."
                    className="pl-8 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      {statusFilter ? (
                        <span className="capitalize">{statusFilter}</span>
                      ) : (
                        <span>All Status</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Schedule Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Schedule New Appointment</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="patientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Patient</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a patient" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {isLoadingPatients ? (
                                      <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                                    ) : patients?.length === 0 ? (
                                      <SelectItem value="none" disabled>No patients found</SelectItem>
                                    ) : (
                                      patients?.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id.toString()}>
                                          {patient.name} ({patient.patientId})
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="doctorId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Doctor</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a doctor" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {isLoadingDoctors ? (
                                      <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
                                    ) : doctorsList.length === 0 ? (
                                      <SelectItem value="none" disabled>No doctors found</SelectItem>
                                    ) : (
                                      doctorsList.map((doctor) => (
                                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                          Dr. {doctor.name} ({doctor.specialization || "General"})
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="appointmentDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => 
                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="appointmentTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="purpose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purpose</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select purpose" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="consultation">Consultation</SelectItem>
                                  <SelectItem value="follow-up">Follow-up</SelectItem>
                                  <SelectItem value="check-up">Check-up</SelectItem>
                                  <SelectItem value="lab-review">Lab Review</SelectItem>
                                  <SelectItem value="procedure">Procedure</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any additional information about the appointment"
                                  className="resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            type="submit"
                            disabled={createAppointmentMutation.isPending}
                          >
                            {createAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">All Appointments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="ml-4">
                                  <Skeleton className="h-4 w-32 mb-1" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="ml-4">
                                  <Skeleton className="h-4 w-32 mb-1" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-6 w-16 rounded-full" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end space-x-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : appointmentsWithDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            {searchTerm || statusFilter ? "No appointments found matching your criteria." : "No appointments scheduled yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        appointmentsWithDetails.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
                                  <AvatarFallback>{appointment.patientName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={appointment.doctorAvatar} alt={appointment.doctorName} />
                                  <AvatarFallback>{appointment.doctorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">Dr. {appointment.doctorName}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(new Date(appointment.appointmentDate), "MMM d, yyyy")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(appointment.appointmentDate), "h:mm a")}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 capitalize">{appointment.purpose}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                appointment.status === "confirmed" ? "success" :
                                appointment.status === "pending" ? "warning" :
                                appointment.status === "cancelled" ? "destructive" :
                                appointment.status === "completed" ? "default" : 
                                "outline"
                              }>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm">Edit</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
