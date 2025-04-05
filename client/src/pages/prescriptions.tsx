import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Prescription, Patient, User, insertPrescriptionSchema } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { SearchIcon, PlusIcon, FileTextIcon, XIcon } from "lucide-react";

// Define medication type
const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

type Medication = z.infer<typeof medicationSchema>;

// Extended schema for the prescription form
const prescriptionFormSchema = insertPrescriptionSchema.extend({
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

export default function Prescriptions() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch prescriptions
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

  // Fetch patients for the form
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch doctors for the form
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });

  // Only include doctors in the staff list
  const doctorsList = doctors?.filter(staff => staff.role === "doctor") || [];

  // Form for creating a new prescription
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      patientId: 0,
      doctorId: user?.role === "doctor" ? user.id : 0,
      instructions: "",
      status: "active",
      medications: [
        { name: "", dosage: "", frequency: "", duration: "", notes: "" }
      ],
    },
  });

  // Field array for medications
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  // Mutation for creating a new prescription
  const createPrescriptionMutation = useMutation({
    mutationFn: async (prescriptionData: PrescriptionFormValues) => {
      const res = await apiRequest("POST", "/api/prescriptions", prescriptionData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prescription created",
        description: "The prescription has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      setOpenDialog(false);
      form.reset({
        patientId: 0,
        doctorId: user?.role === "doctor" ? user.id : 0,
        instructions: "",
        status: "active",
        medications: [
          { name: "", dosage: "", frequency: "", duration: "", notes: "" }
        ],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create prescription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrescriptionFormValues) => {
    createPrescriptionMutation.mutate(data);
  };

  // Filter prescriptions based on search term and status
  const filteredPrescriptions = prescriptions?.filter(prescription => {
    const patient = patients?.find(p => p.id === prescription.patientId);
    const doctor = doctors?.find(d => d.id === prescription.doctorId);
    
    const matchesSearch = !searchTerm || 
      (patient?.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor?.name && doctor.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !statusFilter || prescription.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  // Get patient and doctor details for each prescription
  const prescriptionsWithDetails = filteredPrescriptions.map(prescription => {
    const patient = patients?.find(p => p.id === prescription.patientId);
    const doctor = doctors?.find(d => d.id === prescription.doctorId);
    
    // Count medications if they exist
    const medicationCount = prescription.medications 
      ? Array.isArray(prescription.medications) 
        ? prescription.medications.length 
        : 0
      : 0;
    
    return {
      ...prescription,
      patientName: patient?.name || "Unknown",
      patientId: patient?.patientId || "Unknown",
      doctorName: doctor?.name || "Unknown",
      medicationCount,
    };
  }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  const isLoading = isLoadingPrescriptions || isLoadingPatients || isLoadingDoctors;

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Prescriptions</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search prescriptions..."
                    className="pl-8 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center">
                      {statusFilter ? (
                        <span className="capitalize">{statusFilter}</span>
                      ) : (
                        <span>All Status</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      New Prescription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[650px]">
                    <DialogHeader>
                      <DialogTitle>Create New Prescription</DialogTitle>
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
                                <FormLabel>Prescribing Doctor</FormLabel>
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
                        
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-medium">Medications</h3>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => append({ name: "", dosage: "", frequency: "", duration: "", notes: "" })}
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add Medication
                            </Button>
                          </div>
                          
                          {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-md mb-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-medium">Medication {index + 1}</h4>
                                {fields.length > 1 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => remove(index)}
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`medications.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Medication Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter medication name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`medications.${index}.dosage`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Dosage</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., 500mg" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`medications.${index}.frequency`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Frequency</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., Twice daily" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`medications.${index}.duration`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Duration (Optional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., 7 days" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`medications.${index}.notes`}
                                  render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                      <FormLabel>Notes (Optional)</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Any special instructions for this medication"
                                          className="resize-none"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                          
                          {form.formState.errors.medications && !Array.isArray(form.formState.errors.medications) && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.medications?.message}</p>
                          )}
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="instructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>General Instructions</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="General instructions for the patient"
                                  className="resize-none"
                                  {...field} 
                                />
                              </FormControl>
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
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
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
                            disabled={createPrescriptionMutation.isPending}
                          >
                            {createPrescriptionMutation.isPending ? "Saving..." : "Save Prescription"}
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
                <CardTitle className="text-lg font-semibold text-gray-900">All Prescriptions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medications</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-5 w-36" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-5 w-36" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-5 w-24" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-6 w-8 rounded-full" />
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
                      ) : prescriptionsWithDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            {searchTerm || statusFilter ? "No prescriptions found matching your criteria." : "No prescriptions in the system yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        prescriptionsWithDetails.map((prescription) => (
                          <TableRow key={prescription.id}>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{prescription.patientName}</div>
                              <div className="text-xs text-gray-500">{prescription.patientId}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">Dr. {prescription.doctorName}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(new Date(prescription.issueDate), "MMM d, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="secondary">
                                {prescription.medicationCount} medication{prescription.medicationCount !== 1 ? 's' : ''}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                prescription.status === "active" ? "success" :
                                prescription.status === "completed" ? "default" :
                                prescription.status === "cancelled" ? "destructive" : 
                                "outline"
                              }>
                                {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm">
                                  <FileTextIcon className="h-4 w-4 mr-1" />
                                  View
                                </Button>
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
