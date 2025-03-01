import ccxt from "ccxt";

/**
 * Convertit un montant en EUR en POL (MATIC) en utilisant la paire "MATIC/EUR" de Binance.
 * Cette fonction doit être exécutée côté serveur.
 * @param eur Montant en euros à convertir
 * @returns Le montant équivalent en POL
 */
export async function convertEurToPOL(eur: number): Promise<number> {
  const exchange = new ccxt.binance();

  try {
    console.log("=== Début de la conversion EUR vers POL ===");
    console.log("Chargement des marchés sur Binance...");
    const markets = await exchange.loadMarkets();
    console.log("Marchés chargés :", markets);

    console.log("Liste des symboles disponibles sur Binance :");
    console.log(exchange.symbols);

    const symbol = "MATIC/EUR";
    if (!exchange.symbols.includes(symbol)) {
      console.error(`La paire ${symbol} n'est pas disponible sur Binance.`);
      throw new Error(`La paire ${symbol} n'est pas disponible sur Binance.`);
    }

    console.log(`Récupération du ticker pour la paire ${symbol}...`);
    const ticker = await exchange.fetchTicker(symbol);
    console.log("Ticker reçu :", ticker);

    const priceInEur = ticker.last;
    console.log(`Dernier prix (ticker.last) pour ${symbol} :`, priceInEur);

    if (priceInEur === undefined || typeof priceInEur !== "number") {
      throw new Error("Le prix n'est pas disponible.");
    }

    const amountInPOL = eur / priceInEur;
    console.log(`Conversion réussie : ${eur} EUR équivalent à ${amountInPOL} POL (avec un prix de ${priceInEur} EUR par POL)`);
    console.log("=== Fin de la conversion ===");
    return amountInPOL;
  } catch (error) {
    console.error("Erreur lors de la conversion EUR vers POL:", error);
    throw error;
  }
}
