import { LoginForm } from './login-form'

export default async function Page({ searchParams }: PageProps<'/login'>) {
  const { redirect } = await searchParams
  // 같은 사이트 경로만 허용해요. //로 시작하면 다른 사이트로 나갈 수 있어서 막아요.
  const safe = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
  return <LoginForm redirect={safe} />
}
