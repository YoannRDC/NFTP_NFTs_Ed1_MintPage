import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import { TransactionStatus } from '../constants';
import crypto from 'crypto'

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export interface NFTtxRecord {
  txHashRef:string;
  email: string;
  tokenId: string;
  code: string;
  offererName: string;
  status: TransactionStatus;
  createdAt: string;
}

export async function createNFTtxInBDD(
  txHashRef: string,
  email: string,
  tokenId: string,
  offererName: string,
  status: TransactionStatus
): Promise<NFTtxRecord> {

  const redisKey = `nft_tx:${txHashRef}`;

  // 🔍 Vérifie si l'entrée existe déjà
  const existing = await redis.get(redisKey);
  if (existing) {
    console.log("⚠️ Enregistrement déjà existant pour cette transaction. Retour de l'entrée existante.");
    return JSON.parse(existing) as NFTtxRecord;
  }

  const code = crypto.randomBytes(16).toString('hex');
  const record: NFTtxRecord = {
    txHashRef,
    email,
    tokenId,
    code,
    offererName,
    status,
    createdAt: new Date().toISOString(),
  };

  await redis.set(`nft_tx:${txHashRef}`, JSON.stringify(record));
  console.log("→ NFT tx enregistrée en BDD :", record);

  return record;
}

export async function updateNFTtxStatus(txHashRef: string, status: TransactionStatus): Promise<boolean> {
  const key = `nft_tx:${txHashRef}`;
  const data = await redis.get(key);
  if (!data) return false;

  const record: NFTtxRecord = JSON.parse(data);
  if (record.status !== status) {
    record.status = status;
    await redis.set(key, JSON.stringify(record));
    console.log(`→ Statut mis à jour pour ${txHashRef}: ${status}`);
  }
  return true;
}

export async function sendDownloadEmail(nftTxRecord: NFTtxRecord): Promise<"ok" | "error"> {

  console.log ("sending email: ", nftTxRecord)
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
      <p><strong>${nftTxRecord.offererName}</strong> vous a offert un NFT pour votre anniversaire !</p>
      <p>Voici le lien pour le télécharger :</p>
      <p style="text-align:center;">
        <a 
          href="https://www.authentart.com/happy_birthday_cakes_download?paymentTxHash=${nftTxRecord.txHashRef}&code=${nftTxRecord.code}&offererName=${encodeURIComponent(nftTxRecord.offererName)}&tokenId=${nftTxRecord.tokenId}"
          style="display:inline-block;background-color:#0050ef;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Télécharger mon NFT 🚀
        </a>
      </p>
      <p style="font-size:0.9em;color:#666;">
        Ou copiez-collez ce lien :<br>
        <code>https://www.authentart.com/happy_birthday_cakes_download?paymentTxHash=${nftTxRecord.txHashRef}&code=${nftTxRecord.code}&offererName=${encodeURIComponent(nftTxRecord.offererName)}&tokenId=${nftTxRecord.tokenId}</code>
      </p>
      <p>Si vous ne connaissez rien au NFT, vous allez enfin découvrir ce que c'est en 2 étapes faciles !</p>
      <p>Tout le monde se souvient de son premier NFT !<br>Vous aurez désormais le vôtre :)</p>
      <p><strong>Transaction ref:</strong> ${nftTxRecord.txHashRef}</p>
      <p>Bonne journée,<br>L’équipe AuthentArt.com</p>
    </div>
  `;

  const text = `
Bonjour,

${nftTxRecord.offererName} vous a offert un NFT pour votre anniversaire !

Voici le lien pour le télécharger :
https://www.authentart.com/happy_birthday_cakes_download?paymentTxHash=${nftTxRecord.txHashRef}&code=${nftTxRecord.code}&offererName=${encodeURIComponent(nftTxRecord.offererName)}&tokenId=${nftTxRecord.tokenId}

Tout le monde se souvient de son premier NFT 😉

Transaction ref: ${nftTxRecord.txHashRef}

Bonne journée,
L’équipe AuthentArt.com
  `;

  try {
    const result = await transporter.sendMail({
      from: `"${nftTxRecord.offererName} 🎉 Happy Birthday Cakes" <${process.env.SMTP_USER_NFTP}>`,
      to: nftTxRecord.email,
      subject: `🎨 ${nftTxRecord.offererName} vous a offert un NFT !`,
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
