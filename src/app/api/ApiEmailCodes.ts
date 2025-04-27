import nodemailer from 'nodemailer'

import fs from 'fs/promises'
import path from 'path'

interface DownloadCode {
  email: string
  nftId: string
  code: string
  offererName: string
  downloaded: boolean
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'emailCodes.json')

/**
 * Génère un code unique lié à l'email fourni,
 * l'enregistre dans le fichier JSON et renvoie ce code.
 */
export async function storeCode(email: string, nftId: string, code:string, offererName:string): Promise<string> {
  // Générer un code hexadécimal aléatoire de 32 caractères
  const record: DownloadCode = {
    email,
    nftId,
    code,
    offererName,
    downloaded: false,
    createdAt: new Date().toISOString(),
  }

  // Lire l'ancien fichier (ou initialiser un tableau vide)
  let all: DownloadCode[] = []
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf-8')
    all = JSON.parse(raw) as DownloadCode[]
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err
    // sinon le fichier n'existait pas → on part sur un tableau vide
    await fs.mkdir(DATA_DIR, { recursive: true })
  }

  // Ajouter le nouvel enregistrement et sauvegarder
  all.push(record)
  await fs.writeFile(FILE_PATH, JSON.stringify(all, null, 2), 'utf-8')

  console.log("storeCode. Email:",email,", nftId:", nftId, ", code:", code, ", offererName:", offererName);

  return code
}

/**
 * Marque le NFT comme téléchargé pour le code fourni.
 * Retourne true si la mise à jour a eu lieu, false si le code est introuvable.
 */
export async function markNFTAsDownloaded(code: string): Promise<boolean> {
  // Charger les enregistrements existants
  let all: DownloadCode[] = []
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf-8')
    all = JSON.parse(raw) as DownloadCode[]
  } catch (err: any) {
    // si le fichier n'existe pas, aucun code à mettre à jour
    if (err.code === 'ENOENT') return false
    throw err
  }

  // Trouver l'entrée correspondante
  const idx = all.findIndex(r => r.code === code)
  if (idx === -1) return false

  // Mettre à jour le flag downloaded
  if (!all[idx].downloaded) {
    all[idx].downloaded = true
    // (optionnel) ajouter une date de téléchargement : all[idx].downloadedAt = new Date().toISOString()
    await fs.writeFile(FILE_PATH, JSON.stringify(all, null, 2), 'utf-8')
  }

  return true
}

export async function sendDownloadEmail(
  toEmail: string,
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
          href="https://www.authentart.com/download?code=${downloadCode}&offererName=${encodeURIComponent(offererName)}"
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
        <code>https://www.authentart.com/download?code=${downloadCode}&offererName=${encodeURIComponent(offererName)}</code>
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

    Voici le lien pour le télécharger : https://www.authentart.com/download?code=${downloadCode}&offererName=${encodeURIComponent(offererName)}

    Si vous ne connaissez rien au NFT, vous allez enfin découvrir ce que c'est en 2 étapes facile !

    Tout le monde se souvient de son premier NFT !
    Vous aurez désormais le votre :)

    Bonne journée,
    L’équipe AuthentArt.com
      `

  await transporter.sendMail({
    from: `<${offererName} "Happy Birthday Cakes !" <${process.env.SMTP_USER_NFTP}>`,
    to: toEmail,
    subject: '🎨 ${offererName} vous a offert un NFT !',
    html,
    text
  })
}
