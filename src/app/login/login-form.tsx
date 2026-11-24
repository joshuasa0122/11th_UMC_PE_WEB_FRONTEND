'use client'

import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormField } from '../../components/form-field'
import { authMutations, errorMessage } from '../../lib/api'

export function LoginForm({ redirect }: { redirect: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // 토큰 저장은 authMutations.login의 onSuccess가 하고, 여기서는 화면 이동만 해요.
  const login = useMutation(authMutations.login())

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    login.mutate({ email: email.trim(), password }, { onSuccess: () => router.push(redirect) })
  }

  return (
    <main className="mx-auto w-full max-w-[420px] flex-1 px-5 py-14">
      <h1 className="mb-2 text-[27px] font-bold tracking-[-.06em]">로그인</h1>
      <p className="mb-8 text-[13px] text-[#6b7280]">UMCine 계정으로 평점과 즐겨찾기를 관리해요.</p>
      <form onSubmit={handleSubmit} className="rounded-lg border border-[#e7ebf1] bg-white p-6">
        <FormField label="이메일" icon="/icons/mail.svg" type="email" placeholder="noco@umc.com" autoComplete="email" required value={email} onChange={(event) => { setEmail(event.target.value); login.reset() }} />
        <FormField label="비밀번호" icon="/icons/lock.svg" type="password" placeholder="비밀번호를 입력해 주세요" autoComplete="current-password" required value={password} onChange={(event) => { setPassword(event.target.value); login.reset() }} />
        <button type="submit" disabled={!email || !password || login.isPending} className="mt-2 w-full cursor-pointer rounded-md bg-[#2f73dc] py-3 text-sm font-bold text-white disabled:cursor-default disabled:opacity-40">{login.isPending ? '로그인 중...' : '로그인'}</button>
        {login.isError && <p role="alert" className="mt-4 text-center text-xs text-[#d64545]">{errorMessage(login.error)}</p>}
        <p className="mt-4 text-center text-xs text-[#6b7280]">계정이 없나요? <Link href="/signup" className="font-bold text-[#2f73dc]">회원가입</Link></p>
      </form>
    </main>
  )
}
