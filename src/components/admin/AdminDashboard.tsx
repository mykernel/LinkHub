import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, HardDrive } from 'lucide-react'

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : '/api'

interface SystemStats {
  totalUsers: number
  activeUsers: number
  disabledUsers: number
  totalStorageSize: number
  storageFormatted: string
  systemStatus: string
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('获取统计数据失败')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">加载失败</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                重试
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">系统概览</h1>
        <p className="text-muted-foreground mt-2">
          管理系统用户、书签和统计信息
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              已注册用户总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              30天内登录过的用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">禁用用户</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.disabledUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              被管理员禁用的用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储使用</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storageFormatted || '0 MB'}</div>
            <p className="text-xs text-muted-foreground">
              用户数据存储总量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
            <CardDescription>当前系统运行状况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">服务状态</span>
              <Badge variant={stats?.systemStatus === 'healthy' ? 'default' : 'destructive'}>
                {stats?.systemStatus === 'healthy' ? '正常' : '异常'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">用户活跃率</span>
              <span className="text-sm text-muted-foreground">
                {stats?.totalUsers ?
                  `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%` :
                  '0%'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">存储详情</span>
              <span className="text-sm text-muted-foreground">
                {stats?.totalStorageSize ?
                  `${stats.totalStorageSize.toLocaleString()} 字节` :
                  '0 字节'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用管理功能</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={fetchStats}
              className="w-full text-left px-3 py-2 rounded border hover:bg-muted"
            >
              🔄 刷新统计数据
            </button>
            <button className="w-full text-left px-3 py-2 rounded border hover:bg-muted">
              📊 导出系统报告
            </button>
            <button className="w-full text-left px-3 py-2 rounded border hover:bg-muted">
              🛠️ 系统维护模式
            </button>
            <button className="w-full text-left px-3 py-2 rounded border hover:bg-muted">
              💾 数据备份
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>用户分布概览</CardTitle>
          <CardDescription>用户状态分布情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm flex-1">活跃用户</span>
              <span className="text-sm font-medium">{stats?.activeUsers || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm flex-1">非活跃用户</span>
              <span className="text-sm font-medium">
                {(stats?.totalUsers || 0) - (stats?.activeUsers || 0) - (stats?.disabledUsers || 0)}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              <span className="text-sm flex-1">禁用用户</span>
              <span className="text-sm font-medium">{stats?.disabledUsers || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}