'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormField } from '../../../../components/form-field'
import { StatusMessage } from '../../../../components/status-message'
import { authMutations, errorMessage, memberQueries } from '../../../../lib/api'

export default function MyInfoEditPage() {
  const { data } = useQuery(memberQueries.me())
  return (
    <main className="mx-auto w-full max-w-[560px] flex-1 px-5 py-14">
      <h1 className="mb-8 text-[27px] font-bold tracking-[-.06em]">내 정보 수정</h1>
      {data ? <EditForm nickname={data.nickname} email={data.email} /> : <StatusMessage>내 정보를 불러오는 중이에요...</StatusMessage>}
    </main>
  )
}

function EditForm({ nickname: initialNickname, email }: { nickname: string; email: string }) {
  const [nickname, setNickname] = useState(initialNickname)
  const router = useRouter()
  const update = useMutation(authMutations.updateMe())

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    update.mutate({ nickname: nickname.trim() }, { onSuccess: () => router.push('/me') })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#e7ebf1] bg-white p-6">
      <FormField label="이메일" icon="/icons/mail.svg" type="email" value={email} disabled />
      <FormField label="닉네임" icon="/icons/person.svg" required minLength={2} maxLength={12} value={nickname} onChange={(event) => { setNickname(event.target.value); update.reset() }} />
      {update.isError && <p role="alert" className="mb-3 text-xs text-[#d64545]">{errorMessage(update.error)}</p>}
      <div className="flex justify-end gap-2">
        <Link href="/me" className="rounded-md border border-[#dce2ea] px-4 py-2 text-xs font-bold">취소</Link>
        <button type="submit" disabled={nickname.trim().length < 2 || update.isPending} className="cursor-pointer rounded-md bg-[#2f73dc] px-4 py-2 text-xs font-bold text-white disabled:cursor-default disabled:opacity-40">저장</button>
      </div>
    </form>
  )
}
