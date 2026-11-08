import type { InputHTMLAttributes } from 'react'

export function FormField({ label, icon, ...props }: { label: string; icon?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-[13px] font-bold">{label}</span>
      <span className="flex items-center gap-2 rounded-md border border-[#dce2ea] bg-white px-3 focus-within:border-[#2f73dc]">
        {icon && <img className="h-[18px] w-[18px] opacity-50" src={icon} alt="" />}
        <input className="min-w-0 flex-1 py-[10px] text-sm outline-none placeholder:text-[#a3aab5]" {...props} />
      </span>
    </label>
  )
}
