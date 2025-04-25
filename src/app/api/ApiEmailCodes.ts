import nodemailer from 'nodemailer'

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

interface DownloadCode {
  email: string
  code: string
  downloaded: boolean
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'emailCodes.json')

/**
 * Génère un code unique lié à l'email fourni,
 * l'enregistre dans le fichier JSON et renvoie ce code.
 */
export async function generateDownloadCode(email: string): Promise<string> {
  // Générer un code hexadécimal aléatoire de 32 caractères
  const code = crypto.randomBytes(16).toString('hex')
  const record: DownloadCode = {
    email,
    code,
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
