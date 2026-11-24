'use client'

import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormField } from '../../components/form-field'
import { authMutations, errorMessage } from '../../lib/api'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const signup = useMutation(authMutations.signup())
  const change = (key: keyof typeof form) => (event: { target: { value: string } }) => { setForm({ ...form, [key]: event.target.value }); signup.reset() }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    signup.mutate({ email: form.email.trim(), password: form.password, nickname: form.nickname.trim() }, { onSuccess: () => router.push('/login') })
  }

  return (
    <main className="mx-auto w-full max-w-[420px] flex-1 px-5 py-14">
      <h1 className="mb-8 text-[27px] font-bold tracking-[-.06em]">회원가입</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-[#e7ebf1] bg-white p-6">
        <FormField label="이메일" icon="/icons/mail.svg" type="email" placeholder="noco@umc.com" autoComplete="email" required value={form.email} onChange={change('email')} />
        <FormField label="비밀번호" icon="/icons/lock.svg" type="password" placeholder="대·소문자, 숫자, 특수문자 포함 8자 이상" autoComplete="new-password" required value={form.password} onChange={change('password')} />
        <FormField label="닉네임" icon="/icons/person.svg" placeholder="2~12자" required minLength={2} maxLength={12} value={form.nickname} onChange={change('nickname')} />
        <button type="submit" disabled={!form.email || !form.password || !form.nickname.trim() || signup.isPending} className="mt-2 w-full cursor-pointer rounded-md bg-[#2f73dc] py-3 text-sm font-bold text-white disabled:cursor-default disabled:opacity-40">가입하기</button>
        {signup.isError && <p role="alert" className="mt-4 text-center text-xs text-[#d64545]">{errorMessage(signup.error)}</p>}
        <p className="mt-4 text-center text-xs text-[#6b7280]">이미 계정이 있나요? <Link href="/login" className="font-bold text-[#2f73dc]">로그인</Link></p>
      </form>
    </main>
  )
}
