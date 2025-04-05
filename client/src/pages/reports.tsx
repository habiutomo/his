import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery } from "@tanstack/react-query";
import { Patient, Appointment, Department, MedicalRecord, Prescription } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { format, subMonths, isSameMonth, parseISO, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { CalendarIcon, DownloadIcon, FilterIcon } from "lucide-react";

export default function Reports() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("patient");

  // Fetch data for reports
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: medicalRecords, isLoading: isLoadingRecords } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
  });

  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

  const isLoading = isLoadingPatients || isLoadingAppointments || isLoadingDepartments || 
                    isLoadingRecords || isLoadingPrescriptions;

  // Patient Statistics Data
  const getPatientStatistics = () => {
    if (!patients) return null;

    // Get patient registrations by month for the last 6 months
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    
    const patientsByMonth = last6Months.map(month => {
      const count = patients.filter(patient => {
        const regDate = new Date(patient.registrationDate);
        return isSameMonth(regDate, month);
      }).length;
      
      return {
        month: format(month, 'MMM yyyy'),
        count,
      };
    }).reverse();

    return patientsByMonth;
  };

  // Appointment Statistics Data
  const getAppointmentStatistics = () => {
    if (!appointments) return null;

    // Filter appointments by selected month
    const monthAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return isSameMonth(appointmentDate, selectedMonth);
    });

    // Group by status
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };

    monthAppointments.forEach(appointment => {
      statusCounts[appointment.status as keyof typeof statusCounts]++;
    });

    const appointmentStatusData = [
      { name: 'Pending', value: statusCounts.pending, color: '#F59E0B' },
      { name: 'Confirmed', value: statusCounts.confirmed, color: '#10B981' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: '#EF4444' },
      { name: 'Completed', value: statusCounts.completed, color: '#6B7280' },
    ];

    // Group by purpose
    const purposeCounts: Record<string, number> = {};

    monthAppointments.forEach(appointment => {
      if (purposeCounts[appointment.purpose]) {
        purposeCounts[appointment.purpose]++;
      } else {
        purposeCounts[appointment.purpose] = 1;
      }
    });

    const appointmentPurposeData = Object.entries(purposeCounts).map(([purpose, count]) => ({
      name: purpose.charAt(0).toUpperCase() + purpose.slice(1),
      count,
    }));

    return { statusData: appointmentStatusData, purposeData: appointmentPurposeData };
  };

  // Department Statistics Data
  const getDepartmentStatistics = () => {
    if (!departments) return null;

    const departmentData = departments.map(department => ({
      name: department.name,
      occupancy: department.occupancy,
      utilization: department.staffUtilization,
    }));

    return departmentData;
  };

  // Calendar Event Data
  const getCalendarEvents = () => {
    if (!appointments) return [];

    return appointments.map(appointment => ({
      date: new Date(appointment.appointmentDate),
      status: appointment.status,
    }));
  };

  const patientStats = getPatientStatistics();
  const appointmentStats = getAppointmentStatistics();
  const departmentStats = getDepartmentStatistics();
  const calendarEvents = getCalendarEvents();

  // Count today's appointments
  const getTodayAppointments = () => {
    if (!appointments) return 0;
    
    const today = new Date();
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return isSameDay(appointmentDate, today);
    }).length;
  };

  // Count total patients
  const getTotalPatients = () => {
    return patients?.length || 0;
  };

  // Count active prescriptions
  const getActivePrescriptions = () => {
    if (!prescriptions) return 0;
    
    return prescriptions.filter(prescription => prescription.status === "active").length;
  };

  // Custom colors for charts
  const COLORS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#EF4444'];

  // Calendar day render function for appointment highlights
  const renderCalendarDay = (day: Date, selectedDay: Date, dayProps: any) => {
    const events = calendarEvents.filter(event => isSameDay(event.date, day));
    const hasEvents = events.length > 0;
    
    return (
      <div 
        {...dayProps} 
        className={`${dayProps.className} relative ${hasEvents ? 'font-bold' : ''}`}
      >
        {day.getDate()}
        {hasEvents && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
            {events.slice(0, 3).map((event, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${
                  event.status === 'confirmed' ? 'bg-green-500' :
                  event.status === 'pending' ? 'bg-yellow-500' :
                  event.status === 'cancelled' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}
              />
            ))}
            {events.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </div>
        )}
      </div>
    );
  };

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Reports & Analytics</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="outline">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Select Month:</span>
                  <div className="relative">
                    <Button variant="outline" className="pr-10">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedMonth, 'MMMM yyyy')}
                    </Button>
                    <div className="absolute top-full mt-1 z-50">
                      <Calendar
                        mode="single"
                        selected={selectedMonth}
                        onSelect={(date) => date && setSelectedMonth(date)}
                        initialFocus
                        className="hidden absolute bg-white shadow-md border rounded-md p-3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Patients</p>
                      {isLoading ? (
                        <Skeleton className="h-9 w-16 mt-1" />
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{getTotalPatients()}</h3>
                      )}
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="material-icons text-primary text-xl">people</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                      {isLoading ? (
                        <Skeleton className="h-9 w-16 mt-1" />
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{getTodayAppointments()}</h3>
                      )}
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="material-icons text-green-600 text-xl">event</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Prescriptions</p>
                      {isLoading ? (
                        <Skeleton className="h-9 w-16 mt-1" />
                      ) : (
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{getActivePrescriptions()}</h3>
                      )}
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="material-icons text-purple-600 text-xl">medication</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Report Tabs */}
            <Tabs defaultValue="patient" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="bg-white rounded-lg p-2 border">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="patient">Patient Statistics</TabsTrigger>
                  <TabsTrigger value="appointment">Appointment Analytics</TabsTrigger>
                  <TabsTrigger value="department">Department Performance</TabsTrigger>
                </TabsList>
              </div>
              
              {/* Patient Statistics Tab */}
              <TabsContent value="patient" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Registration Trend</CardTitle>
                    <CardDescription>Monthly patient registrations over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="w-full h-80 flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : patientStats && patientStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={patientStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="New Patients" fill="#2563EB" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        No patient data available for the selected period.
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gender Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-60 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : patients && patients.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Male', value: patients.filter(p => p.gender === 'male').length, color: '#2563EB' },
                                { name: 'Female', value: patients.filter(p => p.gender === 'female').length, color: '#EC4899' },
                                { name: 'Other', value: patients.filter(p => p.gender && p.gender !== 'male' && p.gender !== 'female').length, color: '#8B5CF6' },
                                { name: 'Not Specified', value: patients.filter(p => !p.gender).length, color: '#9CA3AF' },
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {patients && patients.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          No patient data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Age Group Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-60 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : patients && patients.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={[
                              { name: '0-18', value: patients.filter(p => p.dateOfBirth && calculateAge(p.dateOfBirth) <= 18).length },
                              { name: '19-35', value: patients.filter(p => p.dateOfBirth && calculateAge(p.dateOfBirth) > 18 && calculateAge(p.dateOfBirth) <= 35).length },
                              { name: '36-50', value: patients.filter(p => p.dateOfBirth && calculateAge(p.dateOfBirth) > 35 && calculateAge(p.dateOfBirth) <= 50).length },
                              { name: '51-65', value: patients.filter(p => p.dateOfBirth && calculateAge(p.dateOfBirth) > 50 && calculateAge(p.dateOfBirth) <= 65).length },
                              { name: '65+', value: patients.filter(p => p.dateOfBirth && calculateAge(p.dateOfBirth) > 65).length },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" name="Patients" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          No patient age data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Appointment Analytics Tab */}
              <TabsContent value="appointment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Appointment Status Distribution</CardTitle>
                        <div className="text-sm text-gray-500">
                          {format(selectedMonth, 'MMMM yyyy')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-60 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : appointmentStats?.statusData && appointmentStats.statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={appointmentStats.statusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {appointmentStats.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          No appointment data available for the selected month.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Appointment Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-60 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : appointmentStats?.purposeData && appointmentStats.purposeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={appointmentStats.purposeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" name="Appointments" fill="#7C3AED" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          No appointment type data available for the selected month.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Calendar</CardTitle>
                    <CardDescription>Overview of appointments for {format(selectedMonth, 'MMMM yyyy')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-md">
                      <Calendar
                        mode="single"
                        selected={selectedMonth}
                        onSelect={(date) => date && setSelectedMonth(date)}
                        className="mx-auto"
                        classNames={{
                          day_today: "bg-primary text-white font-bold",
                        }}
                        components={{
                          Day: ({ day, selected, ...props }) => renderCalendarDay(day, selected, props),
                        }}
                      />
                      
                      <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-600">Confirmed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-xs text-gray-600">Pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-xs text-gray-600">Cancelled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                          <span className="text-xs text-gray-600">Completed</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Department Performance Tab */}
              <TabsContent value="department" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Department Occupancy & Staff Utilization</CardTitle>
                      <Select
                        value={selectedDepartment}
                        onValueChange={setSelectedDepartment}
                      >
                        <SelectTrigger className="w-[180px]">
                          <div className="flex items-center">
                            <FilterIcon className="mr-2 h-4 w-4" />
                            {selectedDepartment === "all" ? (
                              <span>All Departments</span>
                            ) : (
                              <span>
                                {departments?.find(d => d.id.toString() === selectedDepartment)?.name || "Department"}
                              </span>
                            )}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments?.map(department => (
                            <SelectItem key={department.id} value={department.id.toString()}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="w-full h-80 flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : departmentStats && departmentStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart 
                          data={
                            selectedDepartment === "all" 
                              ? departmentStats 
                              : departmentStats.filter(d => departments?.find(dept => dept.id.toString() === selectedDepartment)?.name === d.name)
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="occupancy" name="Occupancy %" fill="#2563EB" />
                          <Bar dataKey="utilization" name="Staff Utilization %" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        No department data available.
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Average Occupancy Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-60 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : departmentStats && departmentStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart
                            data={[
                              { month: "Jan", value: 75 },
                              { month: "Feb", value: 82 },
                              { month: "Mar", value: 78 },
                              { month: "Apr", value: 69 },
                              { month: "May", value: 72 },
                              { month: "Jun", value: 78 }
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              name="Average Occupancy %" 
                              stroke="#2563EB" 
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          No occupancy trend data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Staff Distribution by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="w-full h-60 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : departments && departments.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={departments.map((dept, index) => ({
                                name: dept.name,
                                value: Math.floor(Math.random() * 20) + 5, // Simulated staff count for visualization
                                color: COLORS[index % COLORS.length]
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {departments.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          No staff distribution data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
