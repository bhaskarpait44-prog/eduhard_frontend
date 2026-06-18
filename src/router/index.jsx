import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES, ROLES } from '@/constants/app'
import useAuthStore from '@/store/authStore'
import AppLayout from '@/layouts/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import StudentLayout from '@/layouts/StudentLayout'
import AccountantLayout from '@/layouts/AccountantLayout'
import LibraryLayout from '@/layouts/LibraryLayout'
import ParentLayout from '@/layouts/ParentLayout'
import ReceptionistLayout from '@/layouts/ReceptionistLayout'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const AdmissionsPortal = lazy(() => import('@/pages/public/AdmissionsPortal'))
const AdmissionStatus = lazy(() => import('@/pages/public/AdmissionStatus'))

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const AdminDashboard = DashboardPage
const StaffDashboard = lazy(() => import('@/pages/PlaceholderPage'))
const ReceptionistDashboard = lazy(() => import('@/pages/receptionist/ReceptionistDashboard'))
const ReceptionistVisitorLog = lazy(() => import('@/pages/receptionist/VisitorLog'))
const ReceptionistStudentSearch = lazy(() => import('@/pages/receptionist/StudentSearch'))
const ReceptionistNotices = lazy(() => import('@/pages/receptionist/ReceptionistNotices'))
const ParentDashboard = lazy(() => import('@/pages/parent/ParentDashboard'))
const ParentWards = lazy(() => import('@/pages/parent/ParentWards'))
const ParentAttendance = lazy(() => import('@/pages/parent/ParentAttendance'))
const ParentFees = lazy(() => import('@/pages/parent/ParentFees'))
const ParentResults = lazy(() => import('@/pages/parent/ParentResults'))
const ParentNotices = lazy(() => import('@/pages/parent/ParentNotices'))
const TeacherDashboard = lazy(() => import('@/pages/teacher/TeacherDashboard'))
const TeacherMyClasses = lazy(() => import('@/pages/teacher/TeacherMyClasses'))
const TeacherMarkAttendance = lazy(() => import('@/pages/teacher/attendance/MarkAttendance'))
const TeacherAttendanceRegister = lazy(() => import('@/pages/teacher/attendance/AttendanceRegister'))
const TeacherAttendanceReports = lazy(() => import('@/pages/teacher/attendance/AttendanceReports'))
const TeacherEnterMarks = lazy(() => import('@/pages/teacher/marks/EnterMarks'))
const TeacherMarksSummary = lazy(() => import('@/pages/teacher/marks/MarksSummary'))
const TeacherStudentList = lazy(() => import('@/pages/teacher/students/StudentList'))
const TeacherStudentDetail = lazy(() => import('@/pages/teacher/students/StudentDetail'))
const TeacherStudentRemarks = lazy(() => import('@/pages/teacher/students/StudentRemarks'))
const TeacherTimetable = lazy(() => import('@/pages/teacher/TeacherTimetable'))
const TeacherHomeworkList = lazy(() => import('@/pages/teacher/homework/HomeworkList'))
const TeacherChat = lazy(() => import('@/pages/teacher/TeacherChat'))
const TeacherNoticeList = lazy(() => import('@/pages/teacher/notices/NoticeList'))
const TeacherNoticeForm = lazy(() => import('@/pages/teacher/notices/NoticeForm'))
const TeacherLeave = lazy(() => import('@/pages/teacher/TeacherLeave'))
const TeacherProfile = lazy(() => import('@/pages/teacher/TeacherProfile'))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'))
const SessionsPage = lazy(() => import('@/pages/sessions/SessionsPage'))
const CreateSessionPage = lazy(() => import('@/pages/sessions/CreateSessionPage'))
const SessionDetailPage = lazy(() => import('@/pages/sessions/SessionDetailPage'))
const StudentsPage = lazy(() => import('@/pages/students/StudentsPage'))
const AdmitStudentPage = lazy(() => import('@/pages/students/AdmitStudentPage'))
const AdmissionsManagementPage = lazy(() => import('@/pages/students/AdmissionsManagementPage'))
const BulkAdmissionPage = lazy(() => import('@/pages/students/BulkAdmissionPage'))
const StudentDetailPage = lazy(() => import('@/pages/students/StudentDetailPage'))
const EditStudentPage    = lazy(() => import('@/pages/students/EditStudentPage'))
const StudentFullDetailsPage = lazy(() => import('@/pages/students/StudentFullDetailsPage'))
const LeftStudentsPage   = lazy(() => import('@/pages/students/LeftStudentsPage'))
const GraduatedStudentsPage = lazy(() => import('@/pages/students/GraduatedStudentsPage'))
const SubjectsPage = lazy(() => import('@/pages/subjects/SubjectsPage'))
const EnrollmentsPage = lazy(() => import('@/pages/enrollments/EnrollmentsPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const FeeStructurePage = lazy(() => import('@/pages/fees/FeeStructurePage'))
const FeeReportPage = lazy(() => import('@/pages/fees/FeeReportPage'))
const ExamsPage = lazy(() => import('@/pages/exams/ExamsPage'))
const ExamAnalyticsPage = lazy(() => import('@/pages/exams/ExamAnalyticsPage'))
const StudentRiskPage = lazy(() => import('@/pages/analytics/StudentRiskPage'))
const AuditPage = lazy(() => import('@/pages/audit/AuditPage'))
const StudentFeePage = lazy(() => import('@/pages/fees/StudentFeePage'))
const UpiConfirmationsPage = lazy(() => import('@/pages/fees/UpiConfirmationsPage'))
const FeedbackList = lazy(() => import('@/pages/feedback/FeedbackList'))
const ClassListPage = lazy(() => import('@/pages/classes/ClassListPage'))
const UserManagementHomePage = lazy(() => import('@/pages/admin/users/UserManagementHomePage'))
const UserListPage = lazy(() => import('@/pages/admin/users/UserListPage'))
const CreateUserPage = lazy(() => import('@/pages/admin/users/CreateUserPage'))
const BulkImportPage = lazy(() => import('@/pages/admin/users/BulkImportPage'))
const CreateTeacherPage = lazy(() => import('@/pages/admin/CreateTeacherPage'))
const TeacherDetailPage = lazy(() => import('@/pages/admin/TeacherDetailPage'))
const ClassDetailPage = lazy(() => import('@/pages/classes/ClassDetailPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AdminTeacherControlPage = lazy(() => import('@/pages/admin/AdminTeacherControlPage'))
const AdminNoticePage = lazy(() => import('@/pages/admin/AdminNoticePage'))
const AdminPromotionPage = lazy(() => import('@/pages/admin/AdminPromotionPage'))
const CertificatesPage = lazy(() => import('@/pages/admin/CertificatesPage'))
const FamilyManager = lazy(() => import('@/pages/admin/families/FamilyManager'))
const InventoryManager = lazy(() => import('@/pages/admin/inventory/InventoryManager'))
const TransportManager = lazy(() => import('@/pages/admin/transport/TransportManager'))
const StaffAttendancePage = lazy(() => import('@/pages/staff/StaffAttendancePage'))
const AccountantDashboard = lazy(() => import('@/pages/accountant/AccountantDashboard'))
const ExpenseTracker = lazy(() => import('@/pages/accountant/expenses/ExpenseTracker'))
const PayrollDashboard = lazy(() => import('@/pages/accountant/payroll/PayrollDashboard'))
const FeeCollection = lazy(() => import('@/pages/accountant/collection/FeeCollection'))
const StudentFeeList = lazy(() => import('@/pages/accountant/students/StudentFeeList'))
const StudentFeeDetail = lazy(() => import('@/pages/accountant/students/StudentFeeDetail'))
const FeeStructureView = lazy(() => import('@/pages/accountant/structure/FeeStructureView'))
const FeeStructureManage = lazy(() => import('@/pages/accountant/structure/FeeStructureManage'))
const AllInvoices = lazy(() => import('@/pages/accountant/invoices/AllInvoices'))
const OverdueInvoices = lazy(() => import('@/pages/accountant/invoices/OverdueInvoices'))
const DueTodayInvoices = lazy(() => import('@/pages/accountant/invoices/DueTodayInvoices'))
const ReceiptList = lazy(() => import('@/pages/accountant/receipts/ReceiptList'))
const ReceiptDetail = lazy(() => import('@/pages/accountant/receipts/ReceiptDetail'))
const DefaulterList = lazy(() => import('@/pages/accountant/defaulters/DefaulterList'))
const ReminderManager = lazy(() => import('@/pages/accountant/defaulters/ReminderManager'))
const ConcessionList = lazy(() => import('@/pages/accountant/concessions/ConcessionList'))
const ApplyConcession = lazy(() => import('@/pages/accountant/concessions/ApplyConcession'))
const ReportsHome = lazy(() => import('@/pages/accountant/reports/ReportsHome'))
const DailyReport = lazy(() => import('@/pages/accountant/reports/DailyReport'))
const MonthlyReport = lazy(() => import('@/pages/accountant/reports/MonthlyReport'))
const ClassWiseReport = lazy(() => import('@/pages/accountant/reports/ClassWiseReport'))
const SessionSummary = lazy(() => import('@/pages/accountant/reports/SessionSummary'))
const DefaulterReport = lazy(() => import('@/pages/accountant/reports/DefaulterReport'))
const ConcessionReport = lazy(() => import('@/pages/accountant/reports/ConcessionReport'))
const CustomReport = lazy(() => import('@/pages/accountant/reports/CustomReport'))
const CarryForward = lazy(() => import('@/pages/accountant/CarryForward'))
const RefundList = lazy(() => import('@/pages/accountant/refunds/RefundList'))
const ProcessRefund = lazy(() => import('@/pages/accountant/refunds/ProcessRefund'))
const ChequeManagement = lazy(() => import('@/pages/accountant/cheques/ChequeManagement'))
const AccountantProfile = lazy(() => import('@/pages/accountant/AccountantProfile'))
const AccountantNotices = lazy(() => import('@/pages/accountant/AccountantNotices'))

const LibraryDashboardPage = lazy(() => import('@/pages/library/LibraryDashboardPage'))
const BookCatalogPage = lazy(() => import('@/pages/library/BookCatalogPage'))
const IssueRegisterPage = lazy(() => import('@/pages/library/IssueRegisterPage'))
const FineCollectionPage = lazy(() => import('@/pages/library/FineCollectionPage'))
const LibrarySettingsPage = lazy(() => import('@/pages/library/LibrarySettingsPage'))
const MyBooksPage = lazy(() => import('@/pages/library/MyBooksPage'))
const LibrarianProfile = lazy(() => import('@/pages/library/LibrarianProfile'))
const BulkImportBooksPage = lazy(() => import('@/pages/library/BulkImportBooksPage'))

const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'))
const MyAttendance = lazy(() => import('@/pages/student/attendance/MyAttendance'))
const MyResults = lazy(() => import('@/pages/student/results/MyResults'))
const StudentReportCard = lazy(() => import('@/pages/student/results/ReportCard'))
const MyFees = lazy(() => import('@/pages/student/fees/MyFees'))
const StudentPaymentHistory = lazy(() => import('@/pages/student/fees/PaymentHistory'))
const StudentTimetable = lazy(() => import('@/pages/student/StudentTimetable'))
const StudentHomeworkList = lazy(() => import('@/pages/student/homework/HomeworkList'))
const StudentSubmissions = lazy(() => import('@/pages/student/homework/MySubmissions'))
const StudentChat = lazy(() => import('@/pages/student/StudentChat'))
const StudentNotices = lazy(() => import('@/pages/student/StudentNotices'))
const MyProfile = lazy(() => import('@/pages/student/profile/MyProfile'))
const CorrectionRequest = lazy(() => import('@/pages/student/profile/CorrectionRequest'))
const ChangePassword = lazy(() => import('@/pages/student/profile/ChangePassword'))
const AcademicHistory = lazy(() => import('@/pages/student/AcademicHistory'))
const StudyMaterials = lazy(() => import('@/pages/student/StudyMaterials'))
const AcademicCalendarPage = lazy(() => import('@/pages/academicCalendar/AcademicCalendarPage'))
const ComplianceReportPage = lazy(() => import('@/pages/compliance/ComplianceReportPage'))
const StudentCalendarPage = lazy(() => import('@/pages/student/StudentCalendarPage'))

const AlumniDashboard = lazy(() => import('@/pages/alumni/AlumniDashboard'))
const AlumniDirectoryPage = lazy(() => import('@/pages/alumni/AlumniDirectoryPage'))
const AlumniProfilePage = lazy(() => import('@/pages/alumni/AlumniProfilePage'))
const AlumniEventsPage = lazy(() => import('@/pages/alumni/AlumniEventsPage'))

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2"
      style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }}
    />
  </div>
)

const Lazy = ({ component: Component, ...props }) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
)

const DashboardGate = () => {
  const role = useAuthStore((state) => state.user?.role)

  if (role === ROLES.STUDENT) {
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />
  }

  if (role === ROLES.TEACHER) {
    return <Lazy component={TeacherDashboard} />
  }

  if (role === ROLES.ACCOUNTANT) {
    return <Navigate to={ROUTES.ACCOUNTANT_DASHBOARD} replace />
  }

  if (role === ROLES.LIBRARIAN) {
    return <Navigate to={ROUTES.LIBRARY_DASHBOARD} replace />
  }

  if (role === ROLES.PARENT) {
    return <Navigate to={ROUTES.PARENT_DASHBOARD} replace />
  }

  if (role === ROLES.STAFF) {
    return <Navigate to={ROUTES.STAFF_DASHBOARD} replace />
  }

  if (role === ROLES.RECEPTIONIST) {
    return <Navigate to="/receptionist/dashboard" replace />
  }

  return <Lazy component={DashboardPage} />
}

const StaffShell = () => {
  const role = useAuthStore((state) => state.user?.role)
  if (role === ROLES.STUDENT) {
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />
  }
  if (role === ROLES.STAFF || role === ROLES.RECEPTIONIST) {
    return <Navigate to={role === ROLES.RECEPTIONIST ? "/receptionist/dashboard" : ROUTES.DASHBOARD} replace />
  }
  return <AppLayout />
}

const router = createBrowserRouter([
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <Lazy component={ForgotPasswordPage} /> },
  { path: ROUTES.RESET_PASSWORD, element: <Lazy component={ResetPasswordPage} /> },
  { path: ROUTES.ADMISSIONS, element: <Lazy component={AdmissionsPortal} /> },
  { path: ROUTES.ADMISSION_STATUS, element: <Lazy component={AdmissionStatus} /> },

  {
    path: ROUTES.STUDENT_ROOT,
    element: (
      <ProtectedRoute roles={[ROLES.STUDENT]}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Lazy component={StudentDashboard} /> },
      { path: 'calendar', element: <Lazy component={StudentCalendarPage} /> },
      { path: 'attendance', element: <Lazy component={MyAttendance} /> },
      { path: 'results', element: <Lazy component={MyResults} /> },
      { path: 'results/report-card', element: <Lazy component={StudentReportCard} /> },
      { path: 'fees', element: <Lazy component={MyFees} /> },
      { path: 'fees/payments', element: <Lazy component={StudentPaymentHistory} /> },
      { path: 'timetable', element: <Lazy component={StudentTimetable} /> },
      { path: 'homework', element: <Lazy component={StudentHomeworkList} /> },
      { path: 'homework/submissions', element: <Lazy component={StudentSubmissions} /> },
      { path: 'chat', element: <Lazy component={StudentChat} /> },
      { path: 'notices', element: <Lazy component={StudentNotices} /> },
      { path: 'profile', element: <Lazy component={MyProfile} /> },
      { path: 'profile/correction', element: <Lazy component={CorrectionRequest} /> },
      { path: 'profile/password', element: <Lazy component={ChangePassword} /> },
      { path: 'history', element: <Lazy component={AcademicHistory} /> },
      { path: 'materials', element: <Lazy component={StudyMaterials} /> },
      { path: 'achievements', element: <Navigate to="../profile" replace /> },
      { path: 'my-library', element: <Lazy component={MyBooksPage} /> },
    ],
  },

  {
    path: ROUTES.ACCOUNTANT_ROOT,
    element: (
      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
        <AccountantLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Lazy component={AccountantDashboard} /> },
      { path: 'expenses', element: <Lazy component={ExpenseTracker} /> },
      { path: 'payroll', element: <Lazy component={PayrollDashboard} /> },
      { path: 'collect', element: <Lazy component={FeeCollection} /> },
      { path: 'students', element: <Lazy component={StudentFeeList} /> },
      { path: 'students/:id/fees', element: <Lazy component={StudentFeeDetail} /> },
      { path: 'fee-structure', element: <Lazy component={FeeStructureView} /> },
      { path: 'fee-structure/manage', element: <Lazy component={FeeStructureManage} /> },
      { path: 'invoices', element: <Lazy component={AllInvoices} /> },
      { path: 'invoices/overdue', element: <Lazy component={OverdueInvoices} /> },
      { path: 'invoices/due-today', element: <Lazy component={DueTodayInvoices} /> },
      { path: 'receipts', element: <Lazy component={ReceiptList} /> },
      { path: 'receipts/:id', element: <Lazy component={ReceiptDetail} /> },
      { path: 'defaulters', element: <Lazy component={DefaulterList} /> },
      { path: 'defaulters/reminders', element: <Lazy component={ReminderManager} /> },
      { path: 'notices', element: <Lazy component={AccountantNotices} /> },
      { path: 'concessions', element: <Lazy component={ConcessionList} /> },
      { path: 'concessions/apply', element: <Lazy component={ApplyConcession} /> },
      { path: 'reports', element: <Lazy component={ReportsHome} /> },
      { path: 'reports/daily', element: <Lazy component={DailyReport} /> },
      { path: 'reports/monthly', element: <Lazy component={MonthlyReport} /> },
      { path: 'reports/classwise', element: <Lazy component={ClassWiseReport} /> },
      { path: 'reports/session', element: <Lazy component={SessionSummary} /> },
      { path: 'reports/defaulters', element: <Lazy component={DefaulterReport} /> },
      { path: 'reports/concessions', element: <Lazy component={ConcessionReport} /> },
      { path: 'reports/custom', element: <Lazy component={CustomReport} /> },
      { path: 'carry-forward', element: <Lazy component={CarryForward} /> },
      { path: 'refunds', element: <Lazy component={RefundList} /> },
      { path: 'refunds/process', element: <Lazy component={ProcessRefund} /> },
      { path: 'cheques', element: <Lazy component={ChequeManagement} /> },
      { path: 'upi-confirmations', element: <Lazy component={UpiConfirmationsPage} /> },
      { path: 'profile', element: <Lazy component={AccountantProfile} /> },
    ],
  },

  {
    path: '/receptionist',
    element: (
      <ProtectedRoute roles={[ROLES.RECEPTIONIST]}>
        <ReceptionistLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Lazy component={ReceptionistDashboard} /> },
      { path: 'visitors', element: <Lazy component={ReceptionistVisitorLog} /> },
      { path: 'students', element: <Lazy component={ReceptionistStudentSearch} /> },
      { path: 'notices', element: <Lazy component={ReceptionistNotices} /> },
      { path: 'profile', element: <Lazy component={PlaceholderPage} /> },
    ],
  },

  {
    path: ROUTES.LIBRARY_ROOT,
    element: (
      <ProtectedRoute roles={[ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER, ROLES.STAFF, ROLES.ACCOUNTANT]}>
        <LibraryLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Lazy component={LibraryDashboardPage} /> },
      { path: 'books', element: (
        <ProtectedRoute roles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
          <Lazy component={BookCatalogPage} />
        </ProtectedRoute>
      )},
      { path: 'books/import', element: (
        <ProtectedRoute roles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
          <Lazy component={BulkImportBooksPage} />
        </ProtectedRoute>
      )},
      { path: 'issues', element: (
        <ProtectedRoute roles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
          <Lazy component={IssueRegisterPage} />
        </ProtectedRoute>
      )},
      { path: 'fines', element: (
        <ProtectedRoute roles={[ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.ACCOUNTANT]}>
          <Lazy component={FineCollectionPage} />
        </ProtectedRoute>
      )},
      { path: 'settings', element: (
        <ProtectedRoute roles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
          <Lazy component={LibrarySettingsPage} />
        </ProtectedRoute>
      )},
      { path: 'my-books', element: <Lazy component={MyBooksPage} /> },
      { path: 'profile', element: <Lazy component={LibrarianProfile} /> },
    ],
  },

  {
    path: ROUTES.PARENT_ROOT,
    element: (
      <ProtectedRoute roles={[ROLES.PARENT]}>
        <ParentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Lazy component={ParentDashboard} /> },
      { path: 'wards', element: <Lazy component={ParentWards} /> },
      { path: 'attendance', element: <Lazy component={ParentAttendance} /> },
      { path: 'fees', element: <Lazy component={ParentFees} /> },
      { path: 'results', element: <Lazy component={ParentResults} /> },
      { path: 'notices', element: <Lazy component={ParentNotices} /> },
    ],
  },

  {
    path: '/',
    element: (
      <ProtectedRoute>
        <StaffShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      { path: ROUTES.DASHBOARD, element: <DashboardGate /> },

      {
        path: '/admin/dashboard',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdminDashboard} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STAFF_DASHBOARD,
        element: (
          <ProtectedRoute roles={[ROLES.STAFF]}>
            <Lazy component={StaffDashboard} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.RECEPTIONIST_DASHBOARD,
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST]}>
            <Lazy component={ReceptionistDashboard} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/librarian/dashboard',
        element: (
          <ProtectedRoute roles={[ROLES.LIBRARIAN]}>
            <Lazy component={LibraryDashboardPage} />
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.CLASSES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={ClassListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.CLASS_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={ClassDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUBJECTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={SubjectsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={StudentsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdmitStudentPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_IMPORT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={BulkAdmissionPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/admissions',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdmissionsManagementPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_FULL_DETAILS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={StudentFullDetailsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={StudentDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENT_EDIT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={EditStudentPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENTS_LEFT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={LeftStudentsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STUDENTS_GRADUATED,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={GraduatedStudentsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ALUMNI,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={AlumniDashboard} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ALUMNI_DIRECTORY,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={AlumniDirectoryPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ALUMNI_PROFILE,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={AlumniProfilePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ALUMNI_EVENTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={AlumniEventsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ENROLLMENTS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={EnrollmentsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ATTENDANCE,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={AttendancePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.STAFF_ATTENDANCE,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <Lazy component={StaffAttendancePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SESSIONS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={SessionsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SESSION_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CreateSessionPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SESSION_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={SessionDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={SettingsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_TEACHER_CONTROL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdminTeacherControlPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_NOTICES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdminNoticePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_FAMILIES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <Lazy component={FamilyManager} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_INVENTORY,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <Lazy component={InventoryManager} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_TRANSPORT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <Lazy component={TransportManager} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_PROMOTIONS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AdminPromotionPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_CERTIFICATES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CertificatesPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.EXAMS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={ExamsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: '/exams/:id/analytics',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={ExamAnalyticsPage} />
          </ProtectedRoute>
        ),
      },
      { path: ROUTES.RESULTS, element: <Navigate to={ROUTES.EXAMS} replace /> },
      {
        path: ROUTES.AI_RISK_ANALYSIS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER]}>
            <Lazy component={StudentRiskPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.AUDIT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={AuditPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.COMPLIANCE_REPORT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={ComplianceReportPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.FEES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={StudentFeePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.FEE_STRUCTURES,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={FeeStructurePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.FEE_REPORT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={FeeReportPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.FEE_UPI_CONFIRMATIONS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={UpiConfirmationsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ACADEMIC_CALENDAR,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.ACCOUNTANT, ROLES.RECEPTIONIST]}>
            <Lazy component={AcademicCalendarPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.FEEDBACK,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.ACCOUNTANT, ROLES.PARENT, ROLES.STUDENT]}>
            <Lazy component={FeedbackList} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USERS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={UserManagementHomePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_MANAGE,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={UserListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CreateUserPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_IMPORT,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={BulkImportPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHERS,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CreateTeacherPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={CreateTeacherPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Lazy component={TeacherDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_CLASSES,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherMyClasses} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_ATTENDANCE_MARK,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherMarkAttendance} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_ATTENDANCE_REGISTER,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherAttendanceRegister} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_ATTENDANCE_REPORTS,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherAttendanceReports} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_MARKS_ENTER,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherEnterMarks} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_MARKS_SUMMARY,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherMarksSummary} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_STUDENTS,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherStudentList} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_STUDENT_DETAIL,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherStudentDetail} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_STUDENT_REMARKS,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherStudentRemarks} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_TIMETABLE,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherTimetable} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_HOMEWORK,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherHomeworkList} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_CHAT,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherChat} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_NOTICES,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherNoticeList} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_NOTICE_NEW,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherNoticeForm} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_LEAVE,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherLeave} />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEACHER_PROFILE,
        element: (
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <Lazy component={TeacherProfile} />
          </ProtectedRoute>
        ),
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])

export default router
