import { Suspense } from 'react'
import { PlatformClient } from '@/components/platform-client'

export default function PlatformPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f6f1] text-emerald-900">
          Жүктелуде...
        </div>
      }
    >
      <PlatformClient />
    </Suspense>
  )
}
