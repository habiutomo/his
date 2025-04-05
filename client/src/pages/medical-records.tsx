import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MedicalRecord, Patient, User, insertMedicalRecordSchema } from "@shared/schema";
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
import { SearchIcon, PlusIcon, FileIcon, FileTextIcon } from "lucide-react";

// Extended schema for the medical record form with typesafe vitals
const vitalsSchema = z.object({
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  temperature: z.string().optional(),
  respiratoryRate: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygenSaturation: z.string().optional(),
});

const medicalRecordFormSchema = insertMedicalRecordSchema.extend({
  vitals: vitalsSchema.optional(),
});

type MedicalRecordFormValues = z.infer<typeof medicalRecordFormSchema>;

export default function MedicalRecords() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch medical records
  const { data: medicalRecords, isLoading: isLoadingRecords } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
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

  // Form for creating a new medical record
  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordFormSchema),
    defaultValues: {
      patientId: 0,
      doctorId: user?.role === "doctor" ? user.id : 0,
      diagnosis: "",
      symptoms: "",
      treatment: "",
      notes: "",
      vitals: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        respiratoryRate: "",
        weight: "",
        height: "",
        oxygenSaturation: "",
      },
      attachments: [],
    },
  });

  // Mutation for creating a new medical record
  const createMedicalRecordMutation = useMutation({
    mutationFn: async (recordData: MedicalRecordFormValues) => {
      const res = await apiRequest("POST", "/api/medical-records", recordData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Medical record created",
        description: "The medical record has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create medical record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MedicalRecordFormValues) => {
    createMedicalRecordMutation.mutate(data);
  };

  // Filter medical records based on search term
  const filteredRecords = medicalRecords?.filter(record => {
    const patient = patients?.find(p => p.id === record.patientId);
    const doctor = doctors?.find(d => d.id === record.doctorId);
    
    return !searchTerm || 
      (patient?.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor?.name && doctor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.symptoms && record.symptoms.toLowerCase().includes(searchTerm.toLowerCase()));
  }) || [];

  // Get patient and doctor details for each medical record
  const recordsWithDetails = filteredRecords.map(record => {
    const patient = patients?.find(p => p.id === record.patientId);
    const doctor = doctors?.find(d => d.id === record.doctorId);
    return {
      ...record,
      patientName: patient?.name || "Unknown",
      patientId: patient?.patientId || "Unknown",
      doctorName: doctor?.name || "Unknown",
    };
  }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

  const isLoading = isLoadingRecords || isLoadingPatients || isLoadingDoctors;

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Medical Records</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search records..."
                    className="pl-8 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      New Medical Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[650px]">
                    <DialogHeader>
                      <DialogTitle>Create New Medical Record</DialogTitle>
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
                        
                        <FormField
                          control={form.control}
                          name="symptoms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Symptoms</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Patient reported symptoms"
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
                          name="diagnosis"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Diagnosis</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Clinical diagnosis"
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
                          name="treatment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Treatment Plan</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Prescribed treatment plan"
                                  className="resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Vitals</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <FormField
                              control={form.control}
                              name="vitals.bloodPressure"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Blood Pressure</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 120/80 mmHg" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="vitals.heartRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Heart Rate</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 72 bpm" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="vitals.temperature"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Temperature</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 98.6 °F" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="vitals.respiratoryRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Respiratory Rate</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 16 bpm" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="vitals.oxygenSaturation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>O₂ Saturation</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 98%" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="vitals.weight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weight</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 70 kg" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any additional notes or observations"
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
                            disabled={createMedicalRecordMutation.isPending}
                          >
                            {createMedicalRecordMutation.isPending ? "Saving..." : "Save Record"}
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
                <CardTitle className="text-lg font-semibold text-gray-900">All Medical Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</TableHead>
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
                              <Skeleton className="h-5 w-48" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-6 w-6 rounded-full" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end space-x-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : recordsWithDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            {searchTerm ? "No medical records found matching your search criteria." : "No medical records in the system yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        recordsWithDetails.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{record.patientName}</div>
                              <div className="text-xs text-gray-500">{record.patientId}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">Dr. {record.doctorName}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(new Date(record.recordDate), "MMM d, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {record.diagnosis || <Badge variant="outline">No diagnosis</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              {record.attachments && record.attachments.length > 0 ? (
                                <Badge variant="secondary">
                                  <FileIcon className="h-3 w-3 mr-1" />
                                  {record.attachments.length}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">None</Badge>
                              )}
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
