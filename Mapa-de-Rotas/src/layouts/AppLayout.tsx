import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
