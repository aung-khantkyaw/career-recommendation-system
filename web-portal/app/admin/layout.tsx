'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Cpu, 
  Activity, 
  LogOut,
  TrendingUp,
  Building2,
  Settings,
  Key
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

const navGroups = [
  {
    label: 'Main',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/users', icon: Users, label: 'User Management' },
      { href: '/admin/careers', icon: Briefcase, label: 'Career Data' },
      { href: '/admin/job-postings', icon: Building2, label: 'Job Postings' },
    ]
  },
  {
    label: 'AI & Analytics',
    items: [
      { href: '/admin/recommendations', icon: TrendingUp, label: 'Recommendations' },
      { href: '/admin/jobs', icon: Cpu, label: 'AI Jobs' },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/admin/api-keys', icon: Key, label: 'API Keys' },
      { href: '/admin/system', icon: Activity, label: 'System Monitor' },
    ]
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">Career AI</span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton 
                            isActive={isActive}
                            tooltip={item.label}
                            render={<Link href={item.href} />}
                          >
                            <Icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Logout"
                  render={<Link href="/login" />}
                >
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1">
          <div className="flex items-center gap-2 p-4 border-b lg:hidden">
            <SidebarTrigger />
            <span className="font-semibold">Career AI Admin</span>
          </div>
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
