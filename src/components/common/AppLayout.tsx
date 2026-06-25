import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import styles from './AppLayout.module.css'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  )
}
