import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import StatCard from "@/components/dashboard/stat-card";
import AppointmentList from "@/components/dashboard/appointment-list";
import TaskList from "@/components/dashboard/task-list";
import RecentActivity from "@/components/dashboard/recent-activity";
import DepartmentStats from "@/components/dashboard/department-stats";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Appointment, Prescription, MedicalRecord, Patient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Fetch data for stat cards
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });
  
  const { data: medicalRecords, isLoading: isLoadingRecords } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
  });

  // Calculate stats
  const todayAppointments = appointments?.filter(app => {
    const appointmentDate = new Date(app.appointmentDate);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  }).length || 0;

  const newPatients = patients?.filter(patient => {
    const registrationDate = new Date(patient.registrationDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return registrationDate >= yesterday;
  }).length || 0;

  const pendingReports = medicalRecords?.filter(record => {
    // Assuming some field indicating report status, use what fits your schema
    return !record.diagnosis || record.diagnosis === "pending";
  }).length || 0;

  const activePrescriptions = prescriptions?.filter(prescription => {
    return prescription.status === "active";
  }).length || 0;

  const isLoadingStats = isLoadingAppointments || isLoadingPatients || 
                       isLoadingPrescriptions || isLoadingRecords;

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
            {/* Dashboard Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}. Here's what's happening today.</p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {isLoadingStats ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index}>
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))
              ) : (
                <>
                  <StatCard 
                    title="Today's Appointments" 
                    value={todayAppointments}
                    icon="calendar_today"
                    color="primary"
                  />
                  
                  <StatCard 
                    title="New Patients" 
                    value={newPatients}
                    icon="person_add"
                    color="secondary"
                  />
                  
                  <StatCard 
                    title="Pending Reports" 
                    value={pendingReports}
                    icon="pending_actions"
                    color="warning"
                  />
                  
                  <StatCard 
                    title="Prescriptions" 
                    value={activePrescriptions}
                    icon="medication"
                    color="accent"
                  />
                </>
              )}
            </div>
            
            {/* Upcoming Appointments and Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <AppointmentList />
              <TaskList />
            </div>
            
            {/* Recent Patient Activity and Department Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivity />
              <DepartmentStats />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
