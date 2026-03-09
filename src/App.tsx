import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { ThemeProvider } from "next-themes";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Support from "./pages/Support";
import Timetable from "./pages/Timetable";
import Subscriptions from "./pages/Subscriptions";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import Settings from "./pages/Settings";
import Certificates from "./pages/Certificates";
import Reports from "./pages/Reports";
import Announcements from "./pages/Announcements";
import Notifications from "./pages/Notifications";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <AppSettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="students" element={<Students />} />
                    <Route path="teachers" element={<Teachers />} />
                    <Route path="support" element={<Support />} />
                    <Route path="timetable" element={<Timetable />} />
                    <Route path="subscriptions" element={<Subscriptions />} />
                    <Route path="chats" element={<Chats />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="certificates" element={<Certificates />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="invoices" element={<Invoices />} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
