export const PERMISSIONS = {
  // Bar
  BAR_DETAILS_VIEW: 'bar_details_view',
  BAR_DETAILS_UPDATE: 'bar_details_update',
  // Staff
  STAFF_VIEW: 'staff_view',
  STAFF_CREATE: 'staff_create',
  STAFF_UPDATE: 'staff_update',
  STAFF_DELETE: 'staff_delete',
  STAFF_DEACTIVATE: 'staff_deactivate',
  STAFF_RESET_PASSWORD: 'staff_reset_password',
  STAFF_EDIT_PERMISSIONS: 'staff_edit_permissions',
  // Attendance
  ATTENDANCE_VIEW_OWN: 'attendance_view_own',
  ATTENDANCE_VIEW_ALL: 'attendance_view_all',
  ATTENDANCE_CREATE: 'attendance_create',
  // Leave
  LEAVE_APPLY: 'leave_apply',
  LEAVE_VIEW_OWN: 'leave_view_own',
  LEAVE_VIEW_ALL: 'leave_view_all',
  LEAVE_APPROVE: 'leave_approve',
  // Payroll
  PAYROLL_VIEW_OWN: 'payroll_view_own',
  PAYROLL_VIEW_ALL: 'payroll_view_all',
  PAYROLL_CREATE: 'payroll_create',
  // Documents
  DOCUMENTS_VIEW_OWN: 'documents_view_own',
  DOCUMENTS_VIEW_ALL: 'documents_view_all',
  DOCUMENTS_SEND: 'documents_send',
  DOCUMENTS_MANAGE: 'documents_manage',
  // Menu / Inventory
  MENU_VIEW: 'menu_view',
  MENU_CREATE: 'menu_create',
  MENU_UPDATE: 'menu_update',
  MENU_DELETE: 'menu_delete',
  // Reservation
  RESERVATION_VIEW: 'reservation_view',
  RESERVATION_MANAGE: 'reservation_manage',
  RESERVATION_CREATE: 'reservation_create',
  // Events
  EVENTS_VIEW: 'events_view',
  EVENTS_CREATE: 'events_create',
  EVENTS_UPDATE: 'events_update',
  EVENTS_DELETE: 'events_delete',
  EVENTS_COMMENT_MANAGE: 'events_comment_manage',
  EVENTS_COMMENT_REPLY: 'events_comment_reply',
  // Tables
  TABLE_VIEW: 'table_view',
  TABLE_UPDATE: 'table_update',
  // Financials
  FINANCIALS_VIEW: 'financials_view',
  // Analytics / DSS
  ANALYTICS_BAR_VIEW: 'analytics_bar_view',
  // Reviews
  REVIEWS_VIEW: 'reviews_view',
  REVIEWS_REPLY: 'reviews_reply',
  // Bans
  BAN_VIEW: 'ban_view',
  BAN_BRANCH: 'ban_branch',
  BAN_LIFT: 'ban_lift',
  // Logs
  LOGS_VIEW: 'logs_view',
};

export const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    permissions: [],
  },
  {
    key: 'bar-management',
    label: 'Bar Management',
    path: '/bar-management',
    icon: 'Beer',
    permissions: ['bar_details_view'],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    path: '/inventory',
    icon: 'Package',
    permissions: ['menu_view'],
  },
  {
    key: 'inventory-requests',
    label: 'Inventory Requests',
    path: '/inventory-requests',
    icon: 'ClipboardCheck',
    permissions: [],
  },
  {
    key: 'menu',
    label: 'Menu',
    path: '/menu',
    icon: 'UtensilsCrossed',
    permissions: ['menu_view'],
  },
  {
    key: 'packages',
    label: 'Packages',
    path: '/packages',
    icon: 'Package',
    permissions: ['menu_view'],
  },
  {
    key: 'tables',
    label: 'Tables',
    path: '/tables',
    icon: 'Grid3x3',
    permissions: ['table_view'],
  },
  {
    key: 'reservations',
    label: 'Reservations',
    path: '/reservations',
    icon: 'CalendarCheck',
    permissions: ['reservation_view'],
  },
  {
    key: 'events',
    label: 'Events & Posts',
    path: '/events',
    icon: 'PartyPopper',
    permissions: ['events_view'],
  },
  {
    key: 'staff',
    label: 'Staff Management',
    path: '/staff',
    icon: 'Users',
    permissions: ['staff_view'],
  },
  {
    key: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: 'Clock',
    permissions: ['attendance_view_own', 'attendance_view_all'],
  },
  {
    key: 'leaves',
    label: 'Leaves',
    path: '/leaves',
    icon: 'CalendarOff',
    permissions: ['leave_view_own', 'leave_view_all'],
  },
  {
    key: 'payroll',
    label: 'Payroll',
    path: '/payroll',
    icon: 'Wallet',
    permissions: ['payroll_view_own', 'payroll_view_all'],
  },
  {
    key: 'deduction-settings',
    label: 'Deduction Settings',
    path: '/deduction-settings',
    icon: 'Settings',
    permissions: ['payroll_create'],
  },
  {
    key: 'payroll-settings',
    label: 'Payroll Settings',
    path: '/payroll-settings',
    icon: 'DollarSign',
    permissions: ['payroll_create'],
  },
  {
    key: 'documents',
    label: 'Documents',
    path: '/documents',
    icon: 'FileText',
    permissions: ['documents_view_own', 'documents_view_all'],
  },
  {
    key: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: 'UserCheck',
    permissions: ['ban_view'],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    path: '/reviews',
    icon: 'Star',
    permissions: ['reviews_view'],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: 'BarChart3',
    permissions: ['analytics_bar_view'],
  },
  {
    key: 'financials',
    label: 'Financials',
    path: '/financials',
    icon: 'DollarSign',
    permissions: ['financials_view'],
  },
  {
    key: 'audit-logs',
    label: 'Audit Logs',
    path: '/audit-logs',
    icon: 'ScrollText',
    permissions: ['logs_view'],
  },
  {
    key: 'branches',
    label: 'My Branches',
    path: '/branches',
    icon: 'GitBranch',
    permissions: ['bar_details_view'],
  },
  {
    key: 'subscription',
    label: 'Subscription',
    path: '/subscription',
    icon: 'Crown',
    permissions: ['bar_details_view'],
  },
  {
    key: 'subscription-approvals',
    label: 'Subscription Approvals',
    path: '/subscription-approvals',
    icon: 'ShieldCheck',
    permissions: [],
    roles: ['super_admin'],
  },
];

export const hasPermission = (userPermissions, requiredPermissions) => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  return requiredPermissions.some((p) => userPermissions.includes(p));
};

export const isOwnerRole = (role) => role === 'bar_owner';
