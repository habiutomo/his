import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Department, insertUserSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SearchIcon, PlusIcon, FilterIcon } from "lucide-react";

// Extended schema for the staff registration form
const staffFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirm Password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function Staff() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  // Fetch staff members
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch departments for the form
  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Form for creating a new staff member
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      role: "doctor",
      specialization: "",
      department: 0,
      avatar: "",
    },
  });

  // Mutation for creating a new staff member
  const createStaffMutation = useMutation({
    mutationFn: async (staffData: StaffFormValues) => {
      // Remove confirmPassword field
      const { confirmPassword, ...userData } = staffData;
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Staff member registered",
        description: "The staff member has been registered successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to register staff member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StaffFormValues) => {
    createStaffMutation.mutate(data);
  };

  // Filter staff members based on search term, role, and department
  const filteredStaff = staffMembers?.filter(staffMember => {
    const matchesSearch = !searchTerm || 
      staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staffMember.specialization && staffMember.specialization.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = !roleFilter || staffMember.role === roleFilter;
    const matchesDepartment = !departmentFilter || staffMember.department === departmentFilter;

    return matchesSearch && matchesRole && matchesDepartment;
  }) || [];

  // Get department details for each staff member
  const staffWithDepartmentDetails = filteredStaff.map(staffMember => {
    const department = departments?.find(dept => dept.id === staffMember.department);
    return {
      ...staffMember,
      departmentName: department?.name || "N/A",
    };
  });

  const isLoading = isLoadingStaff || isLoadingDepartments;

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Staff</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search staff..."
                    className="pl-8 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={roleFilter || ""} onValueChange={(value) => setRoleFilter(value || null)}>
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      {roleFilter ? (
                        <span className="capitalize">{roleFilter}</span>
                      ) : (
                        <span>All Roles</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={departmentFilter?.toString() || ""} 
                  onValueChange={(value) => setDepartmentFilter(value ? parseInt(value) : null)}
                >
                  <SelectTrigger className="w-[160px]">
                    <div className="flex items-center">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      {departmentFilter ? (
                        <span>
                          {departments?.find(d => d.id === departmentFilter)?.name || "Department"}
                        </span>
                      ) : (
                        <span>All Departments</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    {departments?.map(department => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Register New Staff Member</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Enter email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Enter password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Confirm password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="nurse">Nurse</SelectItem>
                                    <SelectItem value="receptionist">Receptionist</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value ? field.value.toString() : ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {isLoadingDepartments ? (
                                      <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                                    ) : departments?.length === 0 ? (
                                      <SelectItem value="none" disabled>No departments found</SelectItem>
                                    ) : (
                                      departments?.map((department) => (
                                        <SelectItem key={department.id} value={department.id.toString()}>
                                          {department.name}
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
                          name="specialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specialization (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Cardiology, Pediatrics" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="avatar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar URL (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter avatar URL" {...field} />
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
                            disabled={createStaffMutation.isPending}
                          >
                            {createStaffMutation.isPending ? "Registering..." : "Register Staff"}
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
                <CardTitle className="text-lg font-semibold text-gray-900">Staff Directory</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</TableHead>
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
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-6 w-16 rounded-full" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-4 w-32" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-4 w-32 mb-1" />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end space-x-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : staffWithDepartmentDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            {searchTerm || roleFilter || departmentFilter ? "No staff members found matching your criteria." : "No staff members in the system yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        staffWithDepartmentDetails.map((staff) => (
                          <TableRow key={staff.id}>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={staff.avatar} alt={staff.name} />
                                  <AvatarFallback className={
                                    staff.role === "doctor" ? "bg-primary-light text-white" :
                                    staff.role === "nurse" ? "bg-secondary-light text-white" :
                                    staff.role === "admin" ? "bg-purple-500 text-white" :
                                    "bg-gray-200"
                                  }>
                                    {staff.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                                  <div className="text-xs text-gray-500">@{staff.username}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                staff.role === "doctor" ? "primary" : 
                                staff.role === "nurse" ? "success" :
                                staff.role === "admin" ? "default" :
                                "secondary"
                              }>
                                {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{staff.departmentName}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{staff.specialization || "-"}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{staff.email}</div>
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
