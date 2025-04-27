import { NextResponse } from "next/server"
import { sendDownloadEmail } from "../ApiEmailCodes"

export async function POST(req: Request) {
    try {
      const { email, downloadCode, offererName } = await req.json();
      await sendDownloadEmail(email, downloadCode, offererName)
      return NextResponse.json({ success: true })
    } catch (err: any) {
      console.error('[ApiEmailCodes]', err)
      return NextResponse.json(
        { error: err.message || 'Erreur interne' },
        { status: 500 }
      )
    }
  }