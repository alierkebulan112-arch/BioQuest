import { appAuth } from '@/lib/app-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await appAuth.currentUser()
  return NextResponse.json({ user })
}
