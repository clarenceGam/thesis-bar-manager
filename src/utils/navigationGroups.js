import {
  LayoutDashboard, Beer, Package, UtensilsCrossed, Grid3x3,
  CalendarCheck, PartyPopper, Users, Clock, CalendarOff,
  Wallet, FileText, UserCheck, Star, BarChart3, DollarSign,
  ScrollText, GitBranch, Crown, Settings as SettingsIcon,
  Store, UsersRound, TrendingUp, Building2,
} from 'lucide-react';

/**
 * Navigation Groups Configuration
 * Reorganizes navigation items into collapsible groups with hover support
 */

export const NAV_GROUPS = [
  // 📊 Overview - Standalone (no group)
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    isStandalone: true,
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        permissions: [],
      },
    ],
  },

  // 🍺 Bar Operations
  {
    id: 'bar-operations',
    label: 'Bar Operations',
    icon: Store,
    isStandalone: false,
    items: [
      {
        key: 'bar-management',
        label: 'Bar Management',
        path: '/bar-management',
        icon: Beer,
        permissions: ['bar_details_view'],
      },
      {
        key: 'menu',
        label: 'Menu',
        path: '/menu',
        icon: UtensilsCrossed,
        permissions: ['menu_view'],
      },
      {
        key: 'inventory',
        label: 'Inventory',
        path: '/inventory',
        icon: Package,
        permissions: ['menu_view'],
      },
      {
        key: 'tables',
        label: 'Tables',
        path: '/tables',
        icon: Grid3x3,
        permissions: ['table_view'],
      },
      {
        key: 'reservations',
        label: 'Reservations',
        path: '/reservations',
        icon: CalendarCheck,
        permissions: ['reservation_view'],
      },
    ],
  },

  // 📅 Events & Posts - Standalone
  {
    id: 'events',
    label: 'Events & Posts',
    icon: PartyPopper,
    isStandalone: true,
    items: [
      {
        key: 'events',
        label: 'Events & Posts',
        path: '/events',
        icon: PartyPopper,
        permissions: ['events_view'],
      },
    ],
  },

  // 👥 People & Payroll
  {
    id: 'people-payroll',
    label: 'People & Payroll',
    icon: UsersRound,
    isStandalone: false,
    items: [
      {
        key: 'staff',
        label: 'Staff Management',
        path: '/staff',
        icon: Users,
        permissions: ['staff_view'],
      },
      {
        key: 'attendance',
        label: 'Attendance',
        path: '/attendance',
        icon: Clock,
        permissions: ['attendance_view_own', 'attendance_view_all'],
      },
      {
        key: 'leaves',
        label: 'Leaves',
        path: '/leaves',
        icon: CalendarOff,
        permissions: ['leave_view_own', 'leave_view_all'],
      },
      {
        key: 'payroll',
        label: 'Payroll',
        path: '/payroll',
        icon: Wallet,
        permissions: ['payroll_view_own', 'payroll_view_all'],
      },
      {
        key: 'deduction-settings',
        label: 'Deduction Settings',
        path: '/deduction-settings',
        icon: SettingsIcon,
        permissions: ['payroll_create', 'deduction_settings_manage'],
      },
      {
        key: 'documents',
        label: 'Documents',
        path: '/documents',
        icon: FileText,
        permissions: ['documents_view_own', 'documents_view_all'],
      },
    ],
  },

  // 🛎️ Customers
  {
    id: 'customers',
    label: 'Customers',
    icon: UserCheck,
    isStandalone: false,
    items: [
      {
        key: 'customers',
        label: 'Customers',
        path: '/customers',
        icon: UserCheck,
        permissions: ['ban_view'],
      },
      {
        key: 'reviews',
        label: 'Reviews',
        path: '/reviews',
        icon: Star,
        permissions: ['reviews_view'],
      },
    ],
  },

  // 📈 Insights & Finance
  {
    id: 'insights-finance',
    label: 'Insights & Finance',
    icon: TrendingUp,
    isStandalone: false,
    items: [
      {
        key: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        icon: BarChart3,
        permissions: ['analytics_bar_view'],
      },
      {
        key: 'financials',
        label: 'Financials',
        path: '/financials',
        icon: DollarSign,
        permissions: ['financials_view'],
      },
      {
        key: 'audit-logs',
        label: 'Audit Logs',
        path: '/audit-logs',
        icon: ScrollText,
        permissions: ['logs_view'],
      },
    ],
  },

  // ⚙️ Settings & Account
  {
    id: 'settings-account',
    label: 'Settings & Account',
    icon: Building2,
    isStandalone: false,
    items: [
      {
        key: 'branches',
        label: 'My Branches',
        path: '/branches',
        icon: GitBranch,
        permissions: ['bar_details_view'],
      },
      {
        key: 'subscription',
        label: 'Subscription',
        path: '/subscription',
        icon: Crown,
        permissions: ['bar_details_view'],
      },
    ],
  },
];

/**
 * Get visible groups based on user permissions
 * @param {Array} userPermissions - User's permission array
 * @param {Function} hasPermission - Permission check function
 * @returns {Array} Filtered groups with only visible items
 */
export const getVisibleGroups = (userPermissions, hasPermission) => {
  return NAV_GROUPS.map((group) => {
    // Filter items based on permissions
    const visibleItems = group.items.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return hasPermission(item.permissions);
    });

    return {
      ...group,
      items: visibleItems,
    };
  }).filter((group) => group.items.length > 0); // Hide groups with no visible items
};

/**
 * Find which group contains a specific route
 * @param {string} currentPath - Current route path
 * @returns {string|null} Group ID or null
 */
export const findGroupForRoute = (currentPath) => {
  for (const group of NAV_GROUPS) {
    const hasRoute = group.items.some((item) => item.path === currentPath);
    if (hasRoute) return group.id;
  }
  return null;
};
