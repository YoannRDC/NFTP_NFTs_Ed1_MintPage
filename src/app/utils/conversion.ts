import ccxt from "ccxt";

/**
 * Convertit un montant en EUR en POL (MATIC) en utilisant le ticker MATIC/EUR de Binance.
 * @param eur Montant en euros à convertir
 * @returns Le montant équivalent en POL
 */
export async function convertEurToPOL(eur: number): Promise<number> {
  const exchange = new ccxt.binance();

  try {
    // Récupération des données du ticker pour le pair MATIC/EUR
    const ticker = await exchange.fetchTicker("MATIC/EUR");
    const priceInEur = ticker.last;

    // Vérifier que ticker.last est bien un nombre
    if (priceInEur === undefined || typeof priceInEur !== "number") {
      throw new Error("Le prix n'est pas disponible.");
    }

    // Calcul : combien de POL pour le montant donné en EUR
    const amountInPOL = eur / priceInEur;
    return amountInPOL;
  } catch (error) {
    console.error("Erreur lors de la conversion EUR vers POL:", error);
    throw error;
  }
}
