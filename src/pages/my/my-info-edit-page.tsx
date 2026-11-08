import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { FormField } from '../../components/form-field'
import { useProfileStore } from '../../stores/profile-store'

export function MyInfoEditPage() {
  const { profile, updateProfile } = useProfileStore()
  const [form, setForm] = useState(profile)
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    updateProfile({ nickname: form.nickname.trim(), email: form.email.trim(), bio: form.bio.trim() })
    navigate('/me')
  }

  return (
    <main className="mx-auto w-full max-w-[560px] flex-1 px-5 py-14">
      <h1 className="mb-8 text-[27px] font-bold tracking-[-.06em]">내 정보 수정</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-[#e7ebf1] bg-white p-6">
        <FormField label="닉네임" icon="/icons/person.svg" required maxLength={20} value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} />
        <FormField label="이메일" icon="/icons/mail.svg" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <label className="mb-4 block">
          <span className="mb-2 block text-[13px] font-bold">소개</span>
          <textarea className="h-24 w-full resize-none rounded-md border border-[#dce2ea] px-3 py-[10px] text-sm outline-none focus:border-[#2f73dc]" maxLength={100} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        </label>
        <div className="flex justify-end gap-2">
          <Link to="/me" className="rounded-md border border-[#dce2ea] px-4 py-2 text-xs font-bold">취소</Link>
          <button type="submit" disabled={!form.nickname.trim() || !form.email.trim()} className="cursor-pointer rounded-md bg-[#2f73dc] px-4 py-2 text-xs font-bold text-white disabled:cursor-default disabled:opacity-40">저장</button>
        </div>
      </form>
    </main>
  )
}
