// lib/logger.ts
import pino from "pino";
import { Logtail } from "@logtail/node";

// Remplacez "YOUR_LOGTAIL_SOURCE_TOKEN" par votre token de source Logtail
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN_API!);

// Création du logger Pino avec le niveau de log souhaité
const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

// Surcharge de la méthode info avec une signature compatible
const originalInfo = logger.info.bind(logger);
logger.info = ((...args: Parameters<typeof originalInfo>): void => {
  let message: string;
  // args[0] peut être une string ou un objet
  if (typeof args[0] === "string") {
    message = args[0];
  } else {
    try {
      message = JSON.stringify(args[0]);
    } catch {
      message = String(args[0]);
    }
  }
  // Envoi du message à Logtail
  logtail.info(message).catch((err: unknown) => {
    console.error("Erreur d'envoi vers Logtail (info) :", err);
  });
  // Appel de la méthode d'origine avec les mêmes arguments
  originalInfo(...args);
}) as typeof originalInfo;

// Surcharge de la méthode error avec une signature compatible
const originalError = logger.error.bind(logger);
logger.error = ((...args: Parameters<typeof originalError>): void => {
  let message: string;
  if (typeof args[0] === "string") {
    message = args[0];
  } else {
    try {
      message = JSON.stringify(args[0]);
    } catch {
      message = String(args[0]);
    }
  }
  logtail.error(message).catch((err: unknown) => {
    console.error("Erreur d'envoi vers Logtail (error) :", err);
  });
  originalError(...args);
}) as typeof originalError;

// lib/clientLogger.ts
export async function sendClientLog(level: 'info' | 'error', message: string, extra?: any) {
    try {
        await fetch('/api/logs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level, message, extra }),
        });
    } catch (err) {
        // En cas d'erreur, on peut choisir d'afficher en console
        console.error('Erreur lors de l\'envoi du log client:', err);
    }
}

export default logger;
