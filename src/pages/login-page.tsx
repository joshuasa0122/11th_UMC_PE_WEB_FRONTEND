import { useState, type FormEvent } from 'react'
import { FormField } from '../components/form-field'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(`${email} 계정으로 로그인을 요청했어요.`)
  }

  return (
    <main className="mx-auto w-full max-w-[420px] flex-1 px-5 py-14">
      <h1 className="mb-2 text-[27px] font-bold tracking-[-.06em]">로그인</h1>
      <p className="mb-8 text-[13px] text-[#6b7280]">UMCine 계정으로 평점과 북마크를 관리해요.</p>
      <form onSubmit={handleSubmit} className="rounded-lg border border-[#e7ebf1] bg-white p-6">
        <FormField label="이메일" icon="/icons/mail.svg" type="email" placeholder="noco@umc.com" autoComplete="email" required value={email} onChange={(event) => { setEmail(event.target.value); setMessage('') }} />
        <FormField label="비밀번호" icon="/icons/lock.svg" type="password" placeholder="비밀번호를 입력해 주세요" autoComplete="current-password" required value={password} onChange={(event) => { setPassword(event.target.value); setMessage('') }} />
        <button type="submit" disabled={!email || !password} className="mt-2 w-full cursor-pointer rounded-md bg-[#2f73dc] py-3 text-sm font-bold text-white disabled:cursor-default disabled:opacity-40">로그인</button>
        {message && <p role="status" className="mt-4 text-center text-xs text-[#2f73dc]">{message}</p>}
      </form>
    </main>
  )
}
