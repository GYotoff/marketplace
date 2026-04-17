import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ProgressionPopup from '@/components/ui/ProgressionPopup'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ProgressionPopup />
    </div>
  )
}
