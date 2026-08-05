import {
  FaTachometerAlt,
  FaBoxOpen,
  FaShoppingCart,
  FaUserCheck,
  FaHeart,
  FaUserCircle,
  FaUsers,
  FaBell,
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { LuChartBar } from 'react-icons/lu';
import { HiOutlineViewGrid } from 'react-icons/hi';

/**
 * Role-based navigation used by Sidebar / TopNavbar.
 * `match` controls active-state highlighting (path prefix vs exact).
 * This is config only — no routing changes.
 */
export const NAV_CONFIG = {
  FARMER: [
    {
      to: '/farmer/dashboard',
      label: 'Dashboard',
      icon: <FaTachometerAlt size={17} />,
      match: (p) => p === '/farmer/dashboard',
    },
    {
      to: '/farmer/products',
      label: 'My Products',
      icon: <FaBoxOpen size={17} />,
      match: (p) => p.startsWith('/farmer/products'),
    },
    {
      to: '/farmer/orders',
      label: 'Orders',
      icon: <FaShoppingCart size={17} />,
      match: (p) => p.startsWith('/farmer/orders'),
    },
    {
      to: '/farmer/verification',
      label: 'Verification',
      icon: <FaUserCheck size={17} />,
      match: (p) => p.startsWith('/farmer/verification'),
    },
    {
      to: '/farmer/profile',
      label: 'My Profile',
      icon: <FaUserCircle size={17} />,
      match: (p) => p === '/farmer/profile',
    },
  ],
  BUYER: [
    {
      to: '/buyer/dashboard',
      label: 'Dashboard',
      icon: <MdDashboard size={17} />,
      match: (p) => p === '/buyer/dashboard',
    },
    {
      to: '/buyer/products',
      label: 'Browse Products',
      icon: <HiOutlineViewGrid size={17} />,
      match: (p) => p.startsWith('/buyer/products'),
    },
    {
      to: '/buyer/orders',
      label: 'My Orders',
      icon: <FaShoppingCart size={17} />,
      match: (p) => p.startsWith('/buyer/orders'),
    },
    {
      to: '/buyer/wishlist',
      label: 'Wishlist',
      icon: <FaHeart size={17} />,
      match: (p) => p.startsWith('/buyer/wishlist'),
    },
  ],
  ADMIN: [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: <LuChartBar size={17} />,
      match: (p) => p === '/admin/dashboard',
    },
    {
      to: '/admin/users',
      label: 'Users',
      icon: <FaUsers size={17} />,
      match: (p) => p.startsWith('/admin/users'),
    },
    {
      to: '/admin/products',
      label: 'Products',
      icon: <FaBoxOpen size={17} />,
      match: (p) => p.startsWith('/admin/products'),
    },
    {
      to: '/admin/orders',
      label: 'Orders',
      icon: <FaShoppingCart size={17} />,
      match: (p) => p.startsWith('/admin/orders'),
    },
    {
      to: '/admin/verification',
      label: 'Verification',
      icon: <FaUserCheck size={17} />,
      match: (p) => p.startsWith('/admin/verification'),
    },
  ],
};

/** Common items shown for every role (bottom of the sidebar). */
export const COMMON_NAV = [
  {
    to: '/notifications',
    label: 'Notifications',
    icon: <FaBell size={17} />,
    match: (p) => p === '/notifications',
  },
];

/** Role label used in badges / breadcrumbs. */
export const ROLE_LABELS = {
  FARMER: 'Farmer',
  BUYER: 'Buyer',
  ADMIN: 'Administrator',
};
