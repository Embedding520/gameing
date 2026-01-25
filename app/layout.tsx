import type { Metadata } from 'next'
import './globals.css'
import './components/BackgroundStyles.css'
import ClientLayout from './components/ClientLayout'

export const metadata: Metadata = {
  title: '娱乐中心',
  description: '多游戏娱乐平台 - 休闲游戏、策略游戏、益智游戏应有尽有',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
