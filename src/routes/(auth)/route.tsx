import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../../stores/auth-store'

// (auth) 폴더 안의 화면은 모두 이 레이아웃을 거쳐요. 로그인하지 않았으면 /login으로 보내요.
export const Route = createFileRoute('/(auth)')({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().accessToken) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: () => <Outlet />,
})
