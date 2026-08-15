import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid, HiOutlineChatAlt2, HiOutlineUserGroup,
  HiOutlineSpeakerphone, HiOutlineLightningBolt, HiOutlineTable,
  HiOutlineUsers, HiOutlineCog, HiOutlineLogout
} from 'react-icons/hi';

const navItems = [
  { path: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { path: '/conversations', icon: HiOutlineChatAlt2, label: 'Conversations', badge: true },
  { path: '/contacts', icon: HiOutlineUserGroup, label: 'Contacts' },
  { path: '/campaigns', icon: HiOutlineSpeakerphone, label: 'Campaigns' },
  { path: '/automation', icon: HiOutlineLightningBolt, label: 'Automation' },
  { path: '/spreadsheet', icon: HiOutlineTable, label: 'CRM Spreadsheet' },
  { path: '/team', icon: HiOutlineUsers, label: 'Team Management' },
  { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const workspaceName = user?.workspace?.name || 'My Workspace';
  const initials = workspaceName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">W</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">WaCRM</div>
          <div className="sidebar-logo-badge">Workspace</div>
        </div>
      </div>

      {/* Section Title */}
      <div className="sidebar-section-title">Main Menu</div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="sidebar-link-icon" />
            <span>{item.label}</span>
            {item.badge && unreadCount > 0 && (
              <span className="sidebar-badge">{unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-workspace">
          <div className="sidebar-workspace-avatar">{initials}</div>
          <div className="sidebar-workspace-info">
            <div className="sidebar-workspace-name">{workspaceName}</div>
            <div className="sidebar-workspace-plan">Business</div>
          </div>
        </div>
        <button className="sidebar-signout" onClick={logout}>
          <HiOutlineLogout />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
