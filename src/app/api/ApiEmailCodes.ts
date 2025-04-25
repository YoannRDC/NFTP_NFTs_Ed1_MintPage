import nodemailer from 'nodemailer'

export async function sendDownloadEmail(
  toEmail: string,
  downloadCode: string
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
      <p>Merci pour votre achat ! Voici votre code unique pour télécharger votre NFT :</p>
      <p style="text-align:center;">
        <a 
          href="https://www.authentart.com/download_happy_birthday_cake?code=${downloadCode}" 
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
        Ou copiez-collez ce code : <code>${downloadCode}</code>
      </p>
      <p>Bonne journée,<br>L’équipe MonNFTShop</p>
    </div>
  `

  const text = `
Bonjour,

Merci pour votre achat ! Voici votre code pour télécharger votre NFT : ${downloadCode}

Copiez-collez ce code à : https://www.authentart.com/download?code=${downloadCode}

Bonne journée,
L’équipe MonNFTShop
  `

  await transporter.sendMail({
    from: `"Happy Birthday Cakes !" <${process.env.SMTP_USER_NFTP}>`,
    to: toEmail,
    subject: '🎨 Votre NFT vous attend !',
    html,
    text
  })
}
