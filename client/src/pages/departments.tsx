import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Department, User, insertDepartmentSchema } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { SearchIcon, PlusIcon, Users, Building } from "lucide-react";

// Extended schema for the department form
const departmentFormSchema = insertDepartmentSchema.extend({});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function Departments() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch staff to count staff members in each department
  const { data: staff, isLoading: isLoadingStaff } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });

  // Form for creating a new department
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 100,
      occupancy: 0,
      staffUtilization: 0,
    },
  });

  // Mutation for creating a new department
  const createDepartmentMutation = useMutation({
    mutationFn: async (departmentData: DepartmentFormValues) => {
      const res = await apiRequest("POST", "/api/departments", departmentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Department created",
        description: "The department has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepartmentFormValues) => {
    createDepartmentMutation.mutate(data);
  };

  // Filter departments based on search term
  const filteredDepartments = departments?.filter(department => {
    return !searchTerm || 
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()));
  }) || [];

  // Count staff in each department
  const departmentsWithStaffCount = filteredDepartments.map(department => {
    const departmentStaff = staff?.filter(s => s.department === department.id) || [];
    return {
      ...department,
      staffCount: departmentStaff.length,
    };
  });

  const isLoading = isLoadingDepartments || isLoadingStaff;

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Departments</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search departments..."
                    className="pl-8 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Create New Department</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter department name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Department description"
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
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacity (Beds/Patients)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min={0}
                                  step={1}
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="occupancy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Occupancy (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="e.g., 75"
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="staffUtilization"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Staff Utilization (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="e.g., 85"
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            type="submit"
                            disabled={createDepartmentMutation.isPending}
                          >
                            {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="p-5 pb-4">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full rounded-full" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16 rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : departmentsWithStaffCount.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-500">
                  {searchTerm ? "No departments found matching your search criteria." : "No departments in the system yet."}
                </div>
              ) : (
                departmentsWithStaffCount.map((department) => (
                  <Card key={department.id} className="overflow-hidden">
                    <CardHeader className="p-5 pb-4">
                      <CardTitle className="flex items-center text-lg font-semibold">
                        <Building className="h-5 w-5 mr-2 text-primary" />
                        {department.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{department.description}</p>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">Occupancy</span>
                            <span className="text-sm font-medium text-gray-700">{department.occupancy}%</span>
                          </div>
                          <Progress value={department.occupancy} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">Staff Utilization</span>
                            <span className="text-sm font-medium text-gray-700">{department.staffUtilization}%</span>
                          </div>
                          <Progress value={department.staffUtilization} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm text-gray-700">{department.staffCount} Staff</span>
                          </div>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Department Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Count</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Utilization</TableHead>
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
                              <Skeleton className="h-5 w-10" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-5 w-16" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-5 w-24" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-5 w-24" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end space-x-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : departmentsWithStaffCount.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            {searchTerm ? "No departments found matching your search criteria." : "No departments in the system yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        departmentsWithStaffCount.map((department) => (
                          <TableRow key={department.id}>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{department.name}</div>
                              <div className="text-xs text-gray-500">{department.description}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{department.staffCount}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{department.capacity}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div className="bg-primary rounded-full h-2.5" style={{ width: `${department.occupancy}%` }}></div>
                                </div>
                                <span className="text-sm text-gray-900">{department.occupancy}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div className="bg-primary rounded-full h-2.5" style={{ width: `${department.staffUtilization}%` }}></div>
                                </div>
                                <span className="text-sm text-gray-900">{department.staffUtilization}%</span>
                              </div>
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
