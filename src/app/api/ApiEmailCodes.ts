import nodemailer from 'nodemailer'

import { createClient } from 'redis';

const redis =  await createClient({ url: process.env.REDIS_URL }).connect();

interface DownloadCode {
  email: string
  nftId: string
  code: string
  offererName: string
  downloaded: boolean
  createdAt: string
}

export async function storeCode(email: string, nftId: string, code: string, offererName: string): Promise<string> {
  const record: DownloadCode = {
    email,
    nftId,
    code,
    offererName,
    downloaded: false,
    createdAt: new Date().toISOString(),
  }

  // On stocke l'objet dans Redis avec la clé "nft_code:{code}"
  await redis.set(`nft_code:${code}`, JSON.stringify(record))

  console.log("storeCode:", record)

  return code
}


export async function markNFTAsDownloaded(code: string): Promise<boolean> {
  const key = `nft_code:${code}`
  const data = await redis.get(key)
  if (!data) return false

  const record: DownloadCode = JSON.parse(data)

  if (!record.downloaded) {
    record.downloaded = true
    await redis.set(key, JSON.stringify(record))
  }

  console.log("markNFTAsDownloaded:", record)

  return true
}


export async function sendDownloadEmail(
  toEmail: string,
  tokenId: string,
  downloadCode: string,
  offererName: string,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST_NFTP,
    port: parseInt(process.env.SMTP_PORT_NFTP || '465', 10),        
    secure: process.env.SMTP_SECURE_NFTP === 'true',     
    auth: {
      user: process.env.SMTP_USER_NFTP,
      pass: process.env.SMTP_PASS_NFTP
    }
  })

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
      <h2 style="color:#333;">Bonjour,</h2>
      <p><strong>${offererName}</strong> vous a offert un NFT pour votre anniversaire !</p>
      <p>Voici le lien pour le télécharger :</p>
      <p style="text-align:center;">
        <a 
          href="https://www.authentart.com/happy_birthday_cakes_download?code=${downloadCode}&offererName=${encodeURIComponent(offererName)}&tokenId=${tokenId}"
          style="
            display:inline-block;
            background-color:#0050ef;
            color:#ffffff;
            padding:12px 24px;
            border-radius:6px;
            text-decoration:none;
            font-weight:bold;
          "
        >
          Télécharger mon NFT 🚀
        </a>
      </p>
      <p style="font-size:0.9em;color:#666;">
        Ou copiez-collez ce lien :<br>
        <code>https://www.authentart.com/happy_birthday_cakes_download?code=${downloadCode}&offererName=${encodeURIComponent(offererName)}&tokenId=${tokenId}</code>
      </p>
      <p>Si vous ne connaissez rien au NFT, vous allez enfin découvrir ce que c'est en 2 étapes faciles !</p>
      <p>Tout le monde se souvient de son premier NFT !<br>
      Vous aurez désormais le vôtre :)</p>
      <p>Bonne journée,<br>L’équipe AuthentArt.com</p>
    </div>
  `;

  const text = `
    Bonjour,

    ${offererName} vous a offert un NFT pour votre anniversaire !

    Voici le lien pour le télécharger : https://www.authentart.com/happy_birthday_cakes_download?code=${downloadCode}&offererName=${encodeURIComponent(offererName)}&tokenId=${tokenId}

    Si vous ne connaissez rien au NFT, vous allez enfin découvrir ce que c'est en 2 étapes facile !

    Tout le monde se souvient de son premier NFT 😉 !

    Bonne journée,
    L’équipe AuthentArt.com
      `

  await transporter.sendMail({
    from: `<${offererName} "Happy Birthday Cakes !" <${process.env.SMTP_USER_NFTP}>`,
    to: toEmail,
    subject: `🎨 ${offererName} vous a offert un NFT !`,
    html,
    text
  });

}
