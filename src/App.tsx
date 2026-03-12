import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RoleGuard from "@/components/RoleGuard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CourseTracks from "./pages/CourseTracks";
import CourseCategories from "./pages/CourseCategories";
import CourseLevels from "./pages/CourseLevels";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Admins from "./pages/Admins";
import RoleManagement from "./pages/RoleManagement";
import Support from "./pages/Support";
import SupportDepartments from "./pages/SupportDepartments";
import SupportPriorities from "./pages/SupportPriorities";
import Timetable from "./pages/Timetable";
import AttendLesson from "./pages/AttendLesson";
import Subscriptions from "./pages/Subscriptions";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import Settings from "./pages/Settings";
import Certificates from "./pages/Certificates";
import Reports from "./pages/Reports";
import Library from "./pages/Library";
import Announcements from "./pages/Announcements";
import Notifications from "./pages/Notifications";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import ExpenseCategories from "./pages/ExpenseCategories";
import InvoiceView from "./pages/InvoiceView";
import LandingPage from "./pages/LandingPage";
import CalculatorPage from "./pages/Calculator";
import NotFound from "./pages/NotFound";
import ErrorDetails from "./pages/ErrorDetails";
import ErrorDocs from "./pages/ErrorDocs";
import Media from "./pages/Media";
import LandingPageManager from "./pages/LandingPageManager";
import Policies from "./pages/Policies";
import WebsitePages from "./pages/WebsitePages";
import BlogPosts from "./pages/BlogPosts";
import ActivityLog from "./pages/ActivityLog";
import WebhookLog from "./pages/WebhookLog";
import ErrorLog from "./pages/ErrorLog";
import AuditTrail from "./pages/AuditTrail";
import StudentReports from "./pages/StudentReports";
import PublicBlogPost from "./pages/PublicBlogPost";
import PublicBlogArchive from "./pages/PublicBlogArchive";
import PublicPage from "./pages/PublicPage";
import PublicContact from "./pages/PublicContact";
import PublicRouteGuard from "./components/PublicRouteGuard";
import WebsiteModeGuard from "./components/WebsiteModeGuard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <AuthProvider>
            <AppSettingsProvider>
              <SessionProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<PublicRouteGuard><LandingPage /></PublicRouteGuard>} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />}/>
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="courses" element={<Courses />} />
                        <Route path="courses/tracks" element={<RoleGuard allowed={['admin']}><CourseTracks /></RoleGuard>} />
                        <Route path="courses/categories" element={<RoleGuard allowed={['admin']}><CourseCategories /></RoleGuard>} />
                        <Route path="courses/levels" element={<RoleGuard allowed={['admin']}><CourseLevels /></RoleGuard>} />
                        <Route path="courses/:id" element={<CourseDetail />} />
                        <Route path="students" element={<RoleGuard allowed={['admin', 'teacher']}><Students /></RoleGuard>} />
                        <Route path="teachers" element={<RoleGuard allowed={['admin']}><Teachers /></RoleGuard>} />
                        <Route path="admins" element={<RoleGuard allowed={['admin']}><Admins /></RoleGuard>} />
                        <Route path="roles" element={<RoleGuard allowed={['admin']}><RoleManagement /></RoleGuard>} />
                        <Route path="support" element={<RoleGuard allowed={['admin']}><Support /></RoleGuard>} />
                        <Route path="support/departments" element={<RoleGuard allowed={['admin']}><SupportDepartments /></RoleGuard>} />
                        <Route path="support/priorities" element={<RoleGuard allowed={['admin']}><SupportPriorities /></RoleGuard>} />
                        <Route path="timetable" element={<Timetable />} />
                        <Route path="attend-lesson" element={<AttendLesson />} />
                        <Route path="subscriptions" element={<RoleGuard allowed={['admin']}><Subscriptions /></RoleGuard>} />
                        <Route path="chats" element={<Chats />} />
                        <Route path="attendance" element={<RoleGuard allowed={['admin', 'teacher']}><Attendance /></RoleGuard>} />
                        <Route path="settings" element={<RoleGuard allowed={['admin']}><Settings /></RoleGuard>} />
                        <Route path="certificates" element={<Certificates />} />
                        <Route path="reports" element={<RoleGuard allowed={['admin']}><Reports /></RoleGuard>} />
                        <Route path="library" element={<Library />} />
                        <Route path="invoices" element={<RoleGuard allowed={['admin']}><Invoices /></RoleGuard>} />
                        <Route path="expenses" element={<RoleGuard allowed={['admin']}><Expenses /></RoleGuard>} />
                        <Route path="expenses/categories" element={<RoleGuard allowed={['admin']}><ExpenseCategories /></RoleGuard>} />
                        <Route path="calculator" element={<RoleGuard allowed={['admin']}><CalculatorPage /></RoleGuard>} />
                        <Route path="announcements" element={<Announcements />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="error/:code" element={<ErrorDetails />} />
                        <Route path="error-docs" element={<RoleGuard allowed={['admin']}><ErrorDocs /></RoleGuard>} />
                        <Route path="media" element={<RoleGuard allowed={['admin']}><Media /></RoleGuard>} />
                        <Route path="landing-page" element={<RoleGuard allowed={['admin']}><WebsiteModeGuard><LandingPageManager /></WebsiteModeGuard></RoleGuard>} />
                        <Route path="policies" element={<RoleGuard allowed={['admin']}><WebsiteModeGuard><Policies /></WebsiteModeGuard></RoleGuard>} />
                        <Route path="website-pages" element={<RoleGuard allowed={['admin']}><WebsiteModeGuard><WebsitePages /></WebsiteModeGuard></RoleGuard>} />
                        <Route path="blog" element={<RoleGuard allowed={['admin']}><WebsiteModeGuard><BlogPosts /></WebsiteModeGuard></RoleGuard>} />
                        <Route path="activity-log" element={<RoleGuard allowed={['admin']}><ActivityLog /></RoleGuard>} />
                        <Route path="webhook-log" element={<RoleGuard allowed={['admin']}><WebhookLog /></RoleGuard>} />
                        <Route path="error-log" element={<RoleGuard allowed={['admin']}><ErrorLog /></RoleGuard>} />
                        <Route path="audit-trail" element={<RoleGuard allowed={['admin']}><AuditTrail /></RoleGuard>} />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                      <Route path="/invoice/:id" element={<InvoiceView />} />
                      <Route path="/blogs" element={<PublicRouteGuard><PublicBlogArchive /></PublicRouteGuard>} />
                      <Route path="/blogs/:slug" element={<PublicRouteGuard><PublicBlogPost /></PublicRouteGuard>} />
                      <Route path="/pages/:slug" element={<PublicRouteGuard><PublicPage /></PublicRouteGuard>} />
                      <Route path="/page/:slug" element={<PublicRouteGuard><PublicPage /></PublicRouteGuard>} />
                      <Route path="/policies/:slug" element={<PublicRouteGuard><PublicPage /></PublicRouteGuard>} />
                      <Route path="/policy/:slug" element={<PublicRouteGuard><PublicPage /></PublicRouteGuard>} />
                      <Route path="/contact" element={<PublicRouteGuard><PublicContact /></PublicRouteGuard>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </SessionProvider>
            </AppSettingsProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);


export default App;
