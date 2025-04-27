import { NextResponse } from "next/server"
import { sendDownloadEmail } from "../ApiEmailCodes"

export async function POST(req: Request) {
    try {
      const { email, tokenId, downloadCode, offererName } = await req.json();
      console.log("email: ", email)
      console.log("tokenId: ", tokenId)
      console.log("downloadCode: ", downloadCode)
      console.log("offererName: ", offererName)
      await sendDownloadEmail(email, tokenId, downloadCode, offererName)
      return NextResponse.json({ success: true })
    } catch (err: any) {
      console.error('[ApiEmailCodes]', err)
      return NextResponse.json(
        { error: err.message || 'Erreur interne' },
        { status: 500 }
      )
    }
  }