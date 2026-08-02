'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Cpu, 
  Activity, 
  LogOut,
  Menu,
  X
} from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'User Management' },
  { href: '/admin/careers', icon: Briefcase, label: 'Career Data' },
  { href: '/admin/jobs', icon: Cpu, label: 'AI Jobs' },
  { href: '/admin/system', icon: Activity, label: 'System Monitor' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <span className="font-bold">Career AI Admin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b hidden lg:flex items-center space-x-2">
              <Briefcase className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold">Career AI</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded ml-auto">Admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
              <Link href="/login">
                <Button variant="outline" className="w-full" onClick={() => setSidebarOpen(false)}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
