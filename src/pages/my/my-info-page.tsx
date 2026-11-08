import { Link } from 'react-router'
import { useProfileStore } from '../../stores/profile-store'

export function MyInfoPage() {
  const profile = useProfileStore((state) => state.profile)

  return (
    <main className="mx-auto w-full max-w-[560px] flex-1 px-5 py-14">
      <h1 className="mb-8 text-[27px] font-bold tracking-[-.06em]">내 정보</h1>
      <section className="rounded-lg border border-[#e7ebf1] bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#eef3fb]"><img className="h-8 w-8 opacity-60" src="/icons/person.svg" alt="" /></span>
          <div>
            <p className="text-lg font-bold">{profile.nickname}</p>
            <p className="text-[13px] text-[#6b7280]">{profile.email}</p>
          </div>
        </div>
        <dl className="border-t border-[#edf0f5] pt-4 text-sm">
          <dt className="mb-1 text-[13px] font-bold text-[#59606a]">소개</dt>
          <dd>{profile.bio || '소개가 없어요.'}</dd>
        </dl>
        <Link to="/me/edit" className="mt-6 inline-flex items-center gap-1 rounded-md border border-[#dce2ea] px-4 py-2 text-xs font-bold hover:border-[#2f73dc]">
          <img className="h-4 w-4" src="/icons/edit.svg" alt="" />정보 수정
        </Link>
      </section>
    </main>
  )
}
