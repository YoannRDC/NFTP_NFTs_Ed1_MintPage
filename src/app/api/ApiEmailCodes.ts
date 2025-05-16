import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import { TransactionStatus } from '../constants';
import crypto from 'crypto'

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export interface GiftRecord {
  txHashRef:string;
  email: string;
  tokenId: string;
  code: string;
  offererName: string;
  status: TransactionStatus;
  createdAt: string;
}

export async function createGiftInBDD(
  txHashRef: string,
  email: string,
  tokenId: string,
  offererName: string,
  status: TransactionStatus
): Promise<GiftRecord> {

  const code = crypto.randomBytes(16).toString('hex');
  const record: GiftRecord = {
    txHashRef,
    email,
    tokenId,
    code,
    offererName,
    status,
    createdAt: new Date().toISOString(),
  };

  await redis.set(`nft_gift:${txHashRef}`, JSON.stringify(record));
  console.log("→ Gift enregistré en BDD :", record);

  return record;
}

export async function updateGiftStatus(txHashRef: string, status: TransactionStatus): Promise<boolean> {
  const key = `nft_gift:${txHashRef}`;
  const data = await redis.get(key);
  if (!data) return false;

  const record: GiftRecord = JSON.parse(data);
  if (record.status !== status) {
    record.status = status;
    await redis.set(key, JSON.stringify(record));
    console.log(`→ Statut mis à jour pour ${txHashRef}: ${status}`);
  }
  return true;
}

export async function sendDownloadEmail(giftRecord: GiftRecord): Promise<"ok" | "error"> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST_NFTP,
    port: parseInt(process.env.SMTP_PORT_NFTP || '465', 10),
    secure: process.env.SMTP_SECURE_NFTP === 'true',
    auth: {
      user: process.env.SMTP_USER_NFTP,
      pass: process.env.SMTP_PASS_NFTP,
    },
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
      <h2 style="color:#333;">Bonjour,</h2>
      <p><strong>${giftRecord.offererName}</strong> vous a offert un NFT pour votre anniversaire !</p>
      <p>Voici le lien pour le télécharger :</p>
      <p style="text-align:center;">
        <a 
          href="https://www.authentart.com/happy_birthday_cakes_download?paymentTxHash=${giftRecord.txHashRef}&code=${giftRecord.code}&offererName=${encodeURIComponent(giftRecord.offererName)}&tokenId=${giftRecord.tokenId}"
          style="display:inline-block;background-color:#0050ef;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Télécharger mon NFT 🚀
        </a>
      </p>
      <p style="font-size:0.9em;color:#666;">
        Ou copiez-collez ce lien :<br>
        <code>https://www.authentart.com/happy_birthday_cakes_download?paymentTxHash=${giftRecord.txHashRef}&code=${giftRecord.code}&offererName=${encodeURIComponent(giftRecord.offererName)}&tokenId=${giftRecord.tokenId}</code>
      </p>
      <p>Si vous ne connaissez rien au NFT, vous allez enfin découvrir ce que c'est en 2 étapes faciles !</p>
      <p>Tout le monde se souvient de son premier NFT !<br>Vous aurez désormais le vôtre :)</p>
      <p><strong>Transaction ref:</strong> ${giftRecord.txHashRef}</p>
      <p>Bonne journée,<br>L’équipe AuthentArt.com</p>
    </div>
  `;

  const text = `
Bonjour,

${giftRecord.offererName} vous a offert un NFT pour votre anniversaire !

Voici le lien pour le télécharger :
https://www.authentart.com/happy_birthday_cakes_download?paymentTxHash=${giftRecord.txHashRef}&code=${giftRecord.code}&offererName=${encodeURIComponent(giftRecord.offererName)}&tokenId=${giftRecord.tokenId}

Tout le monde se souvient de son premier NFT 😉

Transaction ref: ${giftRecord.txHashRef}

Bonne journée,
L’équipe AuthentArt.com
  `;

  try {
    const result = await transporter.sendMail({
      from: `"${giftRecord.offererName} 🎉 Happy Birthday Cakes" <${process.env.SMTP_USER_NFTP}>`,
      to: giftRecord.email,
      subject: `🎨 ${giftRecord.offererName} vous a offert un NFT !`,
      html,
      text,
    });

    console.log("→ Email envoyé :", result.messageId);
    return "ok";
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi de l'email :", err);
    return "error";
  }
}
