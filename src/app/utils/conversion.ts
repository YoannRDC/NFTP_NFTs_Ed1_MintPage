import ccxt from "ccxt";

/**
 * Convertit un montant en EUR en POL (MATIC) en utilisant la paire "MATIC/EUR" de Binance.
 * Si cette paire n'est pas disponible, le prix est calculé à partir des paires "MATIC/USDT" et "USDT/EUR".
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

    let priceInEur: number | undefined = undefined;
    const symbolDirect = "MATIC/EUR";
    console.log(`Tentative de récupération du ticker pour la paire ${symbolDirect}...`);

    try {
      const tickerDirect = await exchange.fetchTicker(symbolDirect);
      console.log("Ticker direct :", tickerDirect);
      priceInEur = tickerDirect.last;
    } catch (error) {
      console.error(`Erreur lors de la récupération du ticker pour ${symbolDirect}:`, error);
    }

    // Si le ticker direct n'est pas disponible, on utilise un fallback avec MATIC/USDT et USDT/EUR.
    if (priceInEur === undefined || typeof priceInEur !== "number") {
      console.log(
        `La paire ${symbolDirect} n'est pas disponible ou retourne un prix indéfini. Utilisation du fallback via MATIC/USDT et USDT/EUR.`
      );
      const symbolMaticUsdt = "MATIC/USDT";
      const symbolUsdtEur = "USDT/EUR";

      // Récupération du ticker pour MATIC/USDT.
      console.log(`Récupération du ticker pour la paire ${symbolMaticUsdt}...`);
      const tickerMaticUsdt = await exchange.fetchTicker(symbolMaticUsdt);
      console.log("Ticker MATIC/USDT :", tickerMaticUsdt);
      const priceMaticUsdt = tickerMaticUsdt.last;
      if (priceMaticUsdt === undefined || typeof priceMaticUsdt !== "number") {
        throw new Error(`Le prix pour ${symbolMaticUsdt} n'est pas disponible.`);
      }

      // Récupération du ticker pour USDT/EUR.
      console.log(`Récupération du ticker pour la paire ${symbolUsdtEur}...`);
      const tickerUsdtEur = await exchange.fetchTicker(symbolUsdtEur);
      console.log("Ticker USDT/EUR :", tickerUsdtEur);
      const priceUsdtEur = tickerUsdtEur.last;
      if (priceUsdtEur === undefined || typeof priceUsdtEur !== "number") {
        throw new Error(`Le prix pour ${symbolUsdtEur} n'est pas disponible.`);
      }

      // Calcul du prix en EUR de MATIC via les deux paires.
      priceInEur = priceMaticUsdt * priceUsdtEur;
      console.log(
        `Prix dérivé pour MATIC/EUR via fallback: ${priceInEur} EUR (MATIC/USDT: ${priceMaticUsdt}, USDT/EUR: ${priceUsdtEur})`
      );
    } else {
      console.log(`Ticker direct pour ${symbolDirect} a donné un prix: ${priceInEur}`);
    }

    if (priceInEur === undefined || typeof priceInEur !== "number") {
      throw new Error("Le prix n'est pas disponible après fallback.");
    }

    const amountInPOL = eur / priceInEur;
    console.log(
      `Conversion réussie : ${eur} EUR équivaut à ${amountInPOL} POL (prix MATIC/EUR: ${priceInEur})`
    );
    console.log("=== Fin de la conversion ===");
    return amountInPOL;
  } catch (error) {
    console.error("Erreur lors de la conversion EUR vers POL:", error);
    throw error;
  }
}
