import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut, Users, BarChart3, Settings, Home, Wrench } from 'lucide-react'
import { AdminUserManagement } from './admin/AdminUserManagement'
import { AdminDashboard } from './admin/AdminDashboard'
import { AdminDefaultTools } from './admin/AdminDefaultTools'

type AdminView = 'dashboard' | 'users' | 'default-tools' | 'settings'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const [activeView, setActiveView] = useState<AdminView>('dashboard')

  const navigation = [
    { id: 'dashboard' as AdminView, name: '系统概览', icon: BarChart3 },
    { id: 'users' as AdminView, name: '用户管理', icon: Users },
    { id: 'default-tools' as AdminView, name: '默认书签', icon: Wrench },
    { id: 'settings' as AdminView, name: '系统设置', icon: Settings },
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard />
      case 'users':
        return <AdminUserManagement />
      case 'default-tools':
        return <AdminDefaultTools />
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">系统设置</h2>
            <p className="text-muted-foreground">系统设置功能开发中...</p>
          </div>
        )
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">
                [ADMIN] LinkHub 管理后台
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <span>管理员: {user?.username}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              )
            })}

            <div className="pt-4 mt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => window.location.href = '/'}
              >
                <Home className="mr-3 h-4 w-4" />
                返回用户页面
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}