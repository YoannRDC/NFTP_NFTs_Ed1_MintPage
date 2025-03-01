import ccxt from "ccxt";

/**
 * Convertit un montant en EUR en POL (MATIC) en utilisant la paire "MATIC/EUR" de Binance.
 * Si cette paire ne fournit pas de prix (ticker.last), on essaie d'utiliser ticker.info.prevClosePrice.
 * Si cela échoue, on utilise un fallback via MATIC/USDT et USDT/EUR.
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
      if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
        // Utilisation de ticker.info.prevClosePrice en fallback
        const prev = parseFloat((tickerDirect.info as any).prevClosePrice);
        if (!isNaN(prev) && prev > 0) {
          priceInEur = prev;
          console.log(`Utilisation de ticker.info.prevClosePrice pour ${symbolDirect} : ${priceInEur}`);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du ticker pour ${symbolDirect}:`, error);
    }

    // Si le ticker direct n'est pas disponible ou ne fournit pas un prix valide, utiliser le fallback.
    if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
      console.log(
        `La paire ${symbolDirect} n'est pas disponible ou retourne un prix indéfini/0. Utilisation du fallback via MATIC/USDT et USDT/EUR.`
      );
      const symbolMaticUsdt = "MATIC/USDT";
      const symbolUsdtEur = "USDT/EUR";

      // Récupération du ticker pour MATIC/USDT.
      console.log(`Récupération du ticker pour la paire ${symbolMaticUsdt}...`);
      const tickerMaticUsdt = await exchange.fetchTicker(symbolMaticUsdt);
      console.log("Ticker MATIC/USDT :", tickerMaticUsdt);
      let priceMaticUsdt = tickerMaticUsdt.last;
      if (priceMaticUsdt === undefined || typeof priceMaticUsdt !== "number" || priceMaticUsdt === 0) {
        const prev = parseFloat((tickerMaticUsdt.info as any).prevClosePrice);
        if (!isNaN(prev) && prev > 0) {
          priceMaticUsdt = prev;
          console.log(`Utilisation de ticker.info.prevClosePrice pour ${symbolMaticUsdt} : ${priceMaticUsdt}`);
        }
      }
      if (priceMaticUsdt === undefined || typeof priceMaticUsdt !== "number" || priceMaticUsdt === 0) {
        throw new Error(`Le prix pour ${symbolMaticUsdt} n'est pas disponible.`);
      }

      // Récupération du ticker pour USDT/EUR.
      console.log(`Récupération du ticker pour la paire ${symbolUsdtEur}...`);
      const tickerUsdtEur = await exchange.fetchTicker(symbolUsdtEur);
      console.log("Ticker USDT/EUR :", tickerUsdtEur);
      let priceUsdtEur = tickerUsdtEur.last;
      if (priceUsdtEur === undefined || typeof priceUsdtEur !== "number" || priceUsdtEur === 0) {
        const prev = parseFloat((tickerUsdtEur.info as any).prevClosePrice);
        if (!isNaN(prev) && prev > 0) {
          priceUsdtEur = prev;
          console.log(`Utilisation de ticker.info.prevClosePrice pour ${symbolUsdtEur} : ${priceUsdtEur}`);
        }
      }
      if (priceUsdtEur === undefined || typeof priceUsdtEur !== "number" || priceUsdtEur === 0) {
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

    if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
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
