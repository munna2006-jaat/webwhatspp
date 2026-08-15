import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ unreadCount }) {
  return (
    <div className="app-layout">
      <Sidebar unreadCount={unreadCount} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
