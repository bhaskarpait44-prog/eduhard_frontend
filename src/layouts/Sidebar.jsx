// src/components/layout/Sidebar.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useUiStore from '@/store/uiStore'
import useAuth from '@/hooks/useAuth'
import { APP_NAME, ROUTES, ROLES } from '@/constants/app'
import { cn } from '@/utils/helpers'

/* ─────────────────────────── nav config ─────────────────────────── */
const getNavGroups = (user) => {
  const isTeacher    = user?.role === ROLES.TEACHER
  const isAccountant = user?.role === ROLES.ACCOUNTANT
  const isLibrarian  = user?.role === ROLES.LIBRARIAN
  const can = (permission) => user?.role === ROLES.ADMIN || (Array.isArray(user?.permissions) && user.permissions.includes(permission))

  if (isTeacher) {
    return [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard',   icon: 'LayoutDashboard', path: `${ROUTES.TEACHER_ROOT}/dashboard` },
          { label: 'My Classes',  icon: 'School2',         path: ROUTES.TEACHER_CLASSES },
          { label: 'Timetable',   icon: 'CalendarRange',   path: ROUTES.TEACHER_TIMETABLE },
        ],
      },
      {
        label: 'Attendance',
        items: [
          { label: 'Mark Attendance',      icon: 'ClipboardCheck', path: ROUTES.TEACHER_ATTENDANCE_MARK },
          { label: 'Attendance Register',  icon: 'Table2',         path: ROUTES.TEACHER_ATTENDANCE_REGISTER },
          { label: 'Attendance Reports',   icon: 'BarChart3',      path: ROUTES.TEACHER_ATTENDANCE_REPORTS },
        ],
      },
      {
        label: 'Academics',
        items: [
          { label: 'Enter Marks',       icon: 'PenSquare',          path: ROUTES.TEACHER_MARKS_ENTER },
          { label: 'Marks Summary',     icon: 'LineChart',           path: ROUTES.TEACHER_MARKS_SUMMARY },
          { label: 'Student List',      icon: 'Users',               path: ROUTES.TEACHER_STUDENTS },
          { label: 'Student Remarks',   icon: 'MessageSquareQuote',  path: ROUTES.TEACHER_STUDENT_REMARKS },
          { label: 'Homework',          icon: 'NotebookPen',         path: ROUTES.TEACHER_HOMEWORK },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Chat',   icon: 'MessageSquare', path: ROUTES.TEACHER_CHAT },
          { label: 'Notice', icon: 'BellRing',      path: ROUTES.TEACHER_NOTICES },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Leave Application', icon: 'PlaneTakeoff', path: ROUTES.TEACHER_LEAVE },
          { label: 'My Library',        icon: 'Library',      path: ROUTES.LIBRARY_MY_BOOKS },
          { label: 'My Profile',        icon: 'UserRound',    path: ROUTES.TEACHER_PROFILE },
        ],
      },
    ]
  }

  if (isLibrarian) {
    return [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.LIBRARY_DASHBOARD },
          { label: 'Book Catalog', icon: 'Library', path: ROUTES.LIBRARY_BOOKS },
        ],
      },
      {
        label: 'Circulation',
        items: [
          { label: 'Issue Register', icon: 'BookOpenCheck', path: ROUTES.LIBRARY_ISSUES },
          { label: 'Reservations Queue', icon: 'Clock', path: '/library/reservations' },
          { label: 'Fine Collection', icon: 'CircleDollarSign', path: ROUTES.LIBRARY_FINES },
        ],
      },
      {
        label: 'Settings',
        items: [
          { label: 'Library Settings', icon: 'Settings2', path: ROUTES.LIBRARY_SETTINGS },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Notices', icon: 'BellRing', path: ROUTES.LIBRARY_NOTICES },  // BUG-07
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'My Library', icon: 'UserRound', path: '/library/my-books' },
          { label: 'My Profile', icon: 'UserRound', path: '/library/profile' },
        ],
      },
    ]
  }

  if (isAccountant) {
    return [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.ACCOUNTANT_DASHBOARD },
          { label: 'Fee Collection', icon: 'IndianRupee', path: ROUTES.ACCOUNTANT_COLLECTION },
        ],
      },
      {
        label: 'Student Fees',
        items: [
          { label: 'Search Student', icon: 'Search', path: ROUTES.ACCOUNTANT_STUDENTS },
          { label: 'Invoices', icon: 'FileStack', path: ROUTES.ACCOUNTANT_INVOICES },
          { label: 'Receipts', icon: 'Receipt', path: ROUTES.ACCOUNTANT_RECEIPTS },
        ],
      },
      {
        label: 'Finance',
        items: [
          { label: 'Fee Structure', icon: 'NotebookTabs', path: ROUTES.ACCOUNTANT_FEE_STRUCTURE },
          ...(can('fees.edit') ? [{ label: 'Manage Structure', icon: 'PencilRuler', path: ROUTES.ACCOUNTANT_FEE_STRUCTURE_MANAGE }] : []),
          { label: 'Defaulters', icon: 'TriangleAlert', path: ROUTES.ACCOUNTANT_DEFAULTERS },
          { label: 'Fee Notices', icon: 'BellRing', path: ROUTES.ACCOUNTANT_NOTICES },
          ...(can('fees.waive') ? [{ label: 'Concessions', icon: 'BadgePercent', path: ROUTES.ACCOUNTANT_CONCESSIONS }] : []),
          { label: 'Carry Forward', icon: 'ArrowRightLeft', path: ROUTES.ACCOUNTANT_CARRY_FORWARD },
          ...(can('fees.refund') ? [{ label: 'Refunds', icon: 'Undo2', path: ROUTES.ACCOUNTANT_REFUNDS }] : []),
          { label: 'Cheques', icon: 'Landmark', path: ROUTES.ACCOUNTANT_CHEQUES },
          { label: 'UPI Confirmations', icon: 'QrCode', path: ROUTES.ACCOUNTANT_UPI_CONFIRMATIONS },
          { label: 'Expenses', icon: 'Receipt', path: ROUTES.ACCOUNTANT_EXPENSES },
          { label: 'Payroll', icon: 'Banknote', path: ROUTES.ACCOUNTANT_PAYROLL },
        ],
      },
      {
        label: 'Reports',
        items: [
          ...(can('fees.report') ? [{ label: 'Reports', icon: 'BarChart3', path: ROUTES.ACCOUNTANT_REPORTS }] : []),
          ...(can('fees.report') ? [{ label: 'Daily Report', icon: 'CalendarClock', path: ROUTES.ACCOUNTANT_REPORT_DAILY }] : []),
          ...(can('fees.report') ? [{ label: 'Monthly Report', icon: 'CalendarDays', path: ROUTES.ACCOUNTANT_REPORT_MONTHLY }] : []),
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'My Profile', icon: 'UserRound', path: ROUTES.ACCOUNTANT_PROFILE },
        ],
      },
    ]
  }

  if (user?.role === ROLES.RECEPTIONIST) {
    return [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.RECEPTIONIST_DASHBOARD },
          { label: 'Visitor Log', icon: 'Contact', path: ROUTES.RECEPTIONIST_VISITORS },
        ],
      },
      {
        label: 'Academic',
        items: [
          { label: 'Student Search', icon: 'Search', path: ROUTES.RECEPTIONIST_STUDENTS },
          { label: 'Notices', icon: 'BellRing', path: ROUTES.RECEPTIONIST_NOTICES },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'My Profile', icon: 'UserRound', path: ROUTES.RECEPTIONIST_PROFILE },
        ],
      },
    ]
  }

  return [
    {
      label: null,
      items: [
        { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.DASHBOARD, roles: [] },
      ],
    },
    {
      label: 'Academics',
      items: [
        { label: 'Classes',       icon: 'School',         path: ROUTES.CLASSES,      roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Students',      icon: 'Users',          path: ROUTES.STUDENTS,     roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Academic Calendar', icon: 'Calendar',   path: ROUTES.ACADEMIC_CALENDAR, roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.ACCOUNTANT, ROLES.RECEPTIONIST] },
        { label: 'Enrollment',    icon: 'BookOpenCheck',  path: ROUTES.ENROLLMENTS,  roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Attendance',    icon: 'CalendarCheck',  path: ROUTES.ATTENDANCE,   roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Subjects',      icon: 'BookOpen',       path: ROUTES.SUBJECTS,     roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Exams & Results', icon: 'ClipboardList', path: ROUTES.EXAMS,       roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Certificates', icon: 'Award',            path: ROUTES.ADMIN_CERTIFICATES, roles: [ROLES.ADMIN] },
      ],
    },
    {
      label: 'Alumni Management',
      items: [
        { 
          label: 'Alumni Management', 
          icon: 'GraduationCap', 
          path: '#',           
          roles: [ROLES.ADMIN, ROLES.TEACHER],
          children: [
            { label: 'Dashboard',        icon: 'LayoutDashboard',path: ROUTES.ALUMNI,            roles: [ROLES.ADMIN, ROLES.TEACHER] },
            { label: 'Directory',        icon: 'Users',          path: ROUTES.ALUMNI_DIRECTORY,  roles: [ROLES.ADMIN, ROLES.TEACHER] },
            { label: 'Events',           icon: 'CalendarHeart',  path: ROUTES.ALUMNI_EVENTS,     roles: [ROLES.ADMIN] },
            { label: 'Left Students',    icon: 'LogOut',         path: ROUTES.STUDENTS_LEFT,     roles: [ROLES.ADMIN, ROLES.TEACHER] },
            { label: 'Graduated',        icon: 'Award',          path: ROUTES.STUDENTS_GRADUATED,roles: [ROLES.ADMIN, ROLES.TEACHER] },
          ]
        },
      ],
    },
    {
      label: 'Finance',
      items: [
        { 
          label: 'Fee Management', 
          icon: 'Wallet', 
          path: '#',           
          roles: [ROLES.ADMIN],
          children: [
            { label: 'Fee Collection',   icon: 'IndianRupee',    path: ROUTES.FEES,                  roles: [ROLES.ADMIN] },
            { label: 'Fee Structure',    icon: 'NotebookTabs',   path: ROUTES.FEE_STRUCTURES,        roles: [ROLES.ADMIN] },
            { label: 'Fee Report',       icon: 'BarChart3',      path: ROUTES.FEE_REPORT,            roles: [ROLES.ADMIN] },
            { label: 'UPI Confirmations', icon: 'QrCode',        path: ROUTES.FEE_UPI_CONFIRMATIONS, roles: [ROLES.ADMIN] },
          ]
        },
      ],
    },
    {
      label: 'Library Portal',
      items: [
        { label: 'Enter Library',      icon: 'Library', path: ROUTES.LIBRARY_DASHBOARD, roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.STAFF, ROLES.ACCOUNTANT] },
      ],
    },
    {
      label: 'Teachers',
      items: [
        { 
          label: 'Teachers', 
          icon: 'UsersRound', 
          path: '#',           
          roles: [ROLES.ADMIN],
          children: [
            { label: 'Admit Teacher',   icon: 'UserPlus',       path: ROUTES.TEACHER_NEW,           roles: [ROLES.ADMIN] },
            { label: 'Teacher List',    icon: 'List',           path: ROUTES.TEACHERS,              roles: [ROLES.ADMIN] },
            { label: 'Teacher Control', icon: 'ShieldEllipsis', path: ROUTES.ADMIN_TEACHER_CONTROL, roles: [ROLES.ADMIN] },
          ]
        },
      ],
    },
    {
      label: 'Parent Portal',
      items: [
        { label: 'My Wards', icon: 'Users', path: ROUTES.PARENT_DASHBOARD, roles: [ROLES.PARENT] },
      ],
    },
      {
        label: 'Support',
        items: [
          { label: 'Feedback', icon: 'MessageSquare', path: ROUTES.FEEDBACK },
        ],
      },
      {
        label: 'Administration',
      items: [
        { label: 'Sessions',   icon: 'CalendarDays',       path: ROUTES.SESSIONS,          roles: [ROLES.ADMIN] },
        { label: 'Online Admissions', icon: 'ClipboardList', path: '/admin/admissions',     roles: [ROLES.ADMIN] },
        { label: 'Families',   icon: 'Users',              path: ROUTES.ADMIN_FAMILIES,    roles: [ROLES.ADMIN, ROLES.ACCOUNTANT] },
        { label: 'Inventory',  icon: 'Package',            path: ROUTES.ADMIN_INVENTORY,   roles: [ROLES.ADMIN, ROLES.ACCOUNTANT] },
        { label: 'Transport',  icon: 'Bus',                path: ROUTES.ADMIN_TRANSPORT,   roles: [ROLES.ADMIN, ROLES.ACCOUNTANT] },
        { label: 'Staff Attendance', icon: 'UserCheck',    path: ROUTES.STAFF_ATTENDANCE,  roles: [ROLES.ADMIN, ROLES.ACCOUNTANT] },
        { label: 'Notices',    icon: 'BellRing',           path: ROUTES.ADMIN_NOTICES,     roles: [ROLES.ADMIN] },
        { label: 'Compliance Report', icon: 'FileCheck', path: ROUTES.COMPLIANCE_REPORT, roles: [ROLES.ADMIN] },
        { label: 'Promotions', icon: 'ArrowUpWideNarrow',  path: ROUTES.ADMIN_PROMOTIONS,  roles: [ROLES.ADMIN] },
        { label: 'Users',      icon: 'UserCog',            path: ROUTES.USERS,             roles: [ROLES.ADMIN] },
        { label: 'Audit Logs', icon: 'ScrollText',         path: ROUTES.AUDIT,             roles: [ROLES.ADMIN] },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Settings', icon: 'Settings', path: ROUTES.SETTINGS, roles: [ROLES.ADMIN] },
      ],
    },
  ]
}

/* ─────────────────────────── sub-components ─────────────────────── */
const NavIcon = ({ name, size = 17 }) => {
  const LucideIcon = Icons[name]
  return LucideIcon ? <LucideIcon size={size} /> : null
}

const NavItem = ({ item, collapsed }) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const location = useLocation()
  
  // Check if any child is active
  const isChildActive = hasChildren && item.children.some(child => location.pathname === child.path)

  const [isClicked, setIsClicked] = useState(isChildActive && !collapsed)
  const [prevIsChildActive, setPrevIsChildActive] = useState(isChildActive)
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed)

  if (isChildActive !== prevIsChildActive || collapsed !== prevCollapsed) {
    setPrevIsChildActive(isChildActive)
    setPrevCollapsed(collapsed)
    if (isChildActive && !collapsed) {
      setIsClicked(true)
    }
  }

  const [coords, setCoords] = useState({ top: 0, left: 0, bottom: 'auto' })
  const itemRef = useRef(null)

  const updateCoords = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect()
      const isBottomHalf = rect.top > window.innerHeight / 2
      setCoords({
        top: isBottomHalf ? 'auto' : rect.top,
        bottom: isBottomHalf ? window.innerHeight - rect.bottom : 'auto',
        left: rect.right
      })
    }
  }

  const handleMouseEnter = () => {
    if (hasChildren && collapsed) {
      updateCoords()
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (hasChildren && collapsed && !isClicked) {
      setIsOpen(false)
    }
  }

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault()
      if (collapsed) {
        updateCoords()
        setIsClicked(!isClicked)
        setIsOpen(true)
      } else {
        setIsClicked(!isClicked)
      }
    }
  }

  // Close when clicking outside (only for flyout mode)
  useEffect(() => {
    if (!isClicked || !collapsed) return
    const handleOutsideClick = (e) => {
      if (itemRef.current && !itemRef.current.contains(e.target)) {
        setIsClicked(false)
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isClicked, collapsed])

  const showSubmenu = hasChildren && (collapsed ? (isOpen || isClicked) : isClicked)

  return (
    <div 
      ref={itemRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavLink
        to={item.path}
        title={collapsed && !hasChildren ? item.label : undefined}
        onClick={handleClick}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
            'text-sm font-medium select-none outline-none',
            'transition-all duration-200 ease-out cursor-pointer',
            collapsed && 'justify-center px-0 mx-auto w-10 h-10 rounded-xl',
            // Highlight if active path OR a child is active OR flyout/dropdown is clicked open
            ((isActive && item.path !== '#') || isChildActive || isClicked)
              ? 'bg-[var(--color-sidebar-active)] text-white shadow-[0_4px_14px_rgba(16,185,129,0.25)]'
              : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-text-primary)]'
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className="shrink-0 transition-transform duration-200"
              style={{
                opacity   : ((isActive && item.path !== '#') || isChildActive || isClicked) ? 1 : 0.75,
                transform : ((isActive && item.path !== '#') || isChildActive || isClicked) ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <NavIcon name={item.icon} size={17} />
            </span>

            {!collapsed && (
              <span className="truncate leading-none tracking-[-0.01em]">
                {item.label}
              </span>
            )}

            {!collapsed && hasChildren && (
              collapsed ? (
                <Icons.ChevronRight 
                  size={14} 
                  className={cn('ml-auto transition-transform duration-200 opacity-50 group-hover:opacity-100', showSubmenu && 'translate-x-1')} 
                />
              ) : (
                <Icons.ChevronDown 
                  size={14} 
                  className={cn('ml-auto transition-transform duration-200 opacity-50 group-hover:opacity-100', showSubmenu && 'rotate-180')} 
                />
              )
            )}

            {/* Collapsed Tooltip (for non-children items) */}
            {collapsed && !hasChildren && (
              <div
                className={cn(
                  'absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                  'whitespace-nowrap pointer-events-none z-50',
                  'opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0',
                  'transition-all duration-150 ease-out'
                )}
                style={{
                  backgroundColor : 'var(--color-sidebar-card)',
                  color           : 'var(--color-text-primary)',
                  border          : '1px solid var(--color-sidebar-border)',
                  boxShadow       : '0 8px 24px rgba(15,23,42,0.18)',
                }}
              >
                {item.label}
              </div>
            )}
          </>
        )}
      </NavLink>

      {/* Flyout Submenu (only in collapsed mode) */}
      <AnimatePresence>
        {collapsed && showSubmenu && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className={cn(
              'fixed z-[9999] rounded-2xl p-2',
              'min-w-[240px] shadow-2xl',
              'border border-[var(--color-sidebar-border)]'
            )}
            style={{
              top: coords.top,
              bottom: coords.bottom,
              left: coords.left + 8,
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              backgroundColor : 'var(--color-sidebar-bg)',
              boxShadow: '0 15px 45px rgba(0,0,0,0.18)'
            }}
          >
            {/* Invisible bridge */}
            <div className="absolute top-0 -left-6 w-6 h-full" />
            
            <div className="space-y-1">
              {item.children.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsClicked(false);
                    setIsOpen(false);
                  }}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all",
                    isActive 
                      ? "bg-[var(--color-sidebar-active)] text-white shadow-md" 
                      : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  <span className="shrink-0 opacity-80">
                    <NavIcon name={child.icon} size={16} />
                  </span>
                  <span className="whitespace-nowrap">{child.label}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accordion Dropdown Submenu (only in expanded mode) */}
      <AnimatePresence initial={false}>
        {!collapsed && showSubmenu && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden mt-1 ml-4 pl-3 border-l border-[var(--color-sidebar-border)] space-y-0.5"
          >
            {item.children.map(child => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all",
                  isActive 
                    ? "bg-[var(--color-sidebar-active)] text-white shadow-sm" 
                    : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <span className="shrink-0 opacity-80">
                  <NavIcon name={child.icon} size={15} />
                </span>
                <span className="truncate">{child.label}</span>
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────── Sidebar ────────────────────────────── */
const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, hasRole } = useAuth()
  const overlayRef = useRef(null)
  const location   = useLocation()

  useEffect(() => {
    if (mobileOpen) onMobileClose?.()
  }, [location.pathname])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onMobileClose?.()
  }

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join('') || '?'

  const navGroups = useMemo(() => {
    const groups = getNavGroups(user)
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => !item.roles || item.roles.length === 0 || hasRole(...item.roles)),
      }))
      .filter(group => group.items.length > 0)
  }, [user, hasRole])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-40 lg:hidden"
          style={{
            backgroundColor : 'rgba(0,0,0,0.45)',
            backdropFilter  : 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            animation       : 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex-col',
          'hidden lg:flex',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
        style={{
          backgroundColor : 'var(--color-sidebar-bg)',
          borderRight     : '1px solid var(--color-sidebar-border)',
        }}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          toggleCollapsed={toggleSidebar}
          user={user}
          initials={initials}
          navGroups={navGroups}
          isMobile={false}
        />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col w-[280px]',
          'lg:hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          backgroundColor : 'var(--color-sidebar-bg)',
          borderRight     : '1px solid var(--color-sidebar-border)',
          boxShadow       : mobileOpen ? '0 0 60px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <SidebarContent
          collapsed={false}
          toggleCollapsed={onMobileClose}
          user={user}
          initials={initials}
          navGroups={navGroups}
          isMobile
          onClose={onMobileClose}
        />
      </aside>
    </>
  )
}

/* ─────────────────────────── SidebarContent ─────────────────────── */
const SidebarContent = ({ collapsed, toggleCollapsed, user, initials, navGroups, isMobile, onClose }) => (
  <div className="flex flex-col h-full overflow-hidden">

    {/* Logo / brand row */}
    <div
      className={cn(
        'flex items-center h-[60px] shrink-0 px-4',
        collapsed && !isMobile ? 'justify-center px-0' : 'gap-3'
      )}
      // style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
    >
      {/* Logo mark */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background : 'linear-gradient(135deg,var(--color-brand) 0%,var(--color-brand-light) 100%)',
          boxShadow  : '0 4px 12px rgba(0,0,0,0.18)',
        }}
      >
        <Icons.GraduationCap size={17} color="#fff" />
      </div>

      {(!collapsed || isMobile) && (
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold truncate leading-tight tracking-[-0.02em]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {APP_NAME}
          </p>
          <p
            className="text-[10px] truncate leading-tight uppercase tracking-[0.15em] mt-0.5"
            style={{ color: 'var(--color-sidebar-muted)' }}
          >
            {user?.role === ROLES.TEACHER
              ? 'Teacher Portal'
              : user?.role === ROLES.ACCOUNTANT
                ? 'Accountant Portal'
                : 'Academic Suite'}
          </p>
        </div>
      )}

      {/* Mobile close */}
      {isMobile && (
        <button
          onClick={onClose}
          className="p-2 rounded-xl transition-all duration-150 ml-auto"
          style={{ color: 'var(--color-sidebar-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-muted)' }}
        >
          <Icons.X size={17} />
        </button>
      )}

      {/* Desktop collapse toggle */}
      {!isMobile && !collapsed && (
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-lg transition-all duration-150 ml-auto"
          style={{ color: 'var(--color-sidebar-muted)' }}
          title="Collapse sidebar"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-muted)' }}
        >
          <Icons.PanelLeftClose size={15} />
        </button>
      )}
    </div>

    {/* Expand button when collapsed */}
    {!isMobile && collapsed && (
      <button
        onClick={toggleCollapsed}
        className="mt-3 mx-auto flex w-9 h-9 items-center justify-center rounded-xl transition-all duration-150"
        style={{
          color           : 'var(--color-sidebar-muted)',
          backgroundColor : 'var(--color-sidebar-card)',
          border          : '1px solid var(--color-sidebar-border)',
        }}
        title="Expand sidebar"
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-card)'; e.currentTarget.style.color = 'var(--color-sidebar-muted)' }}
      >
        <Icons.PanelLeftOpen size={15} />
      </button>
    )}

    {/* Nav */}
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-5 scrollbar-thin">
      {navGroups.map((group, index) => (
        <div key={`${group.label || 'root'}-${index}`}>
          {group.label && !collapsed && (
            <p
              className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--color-sidebar-muted)' }}
            >
              {group.label}
            </p>
          )}
          {group.label && collapsed && index > 0 && (
            <div
              className="mx-auto mb-2 w-5 h-px"
              style={{ backgroundColor: 'var(--color-sidebar-border)' }}
            />
          )}
          <ul className="space-y-0.5">
            {group.items.map((item, itemIdx) => (
              <li key={item.path || `${item.label}-${itemIdx}`}>
                <NavItem item={item} collapsed={collapsed && !isMobile} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>

  </div>
)

export default Sidebar
