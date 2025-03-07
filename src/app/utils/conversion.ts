import ccxt from "ccxt";

/**
 * Convertit un montant en EUR en POL (MATIC) en utilisant la paire "MATIC/EUR" de Binance.
 * Si cette paire ne fournit pas de prix (ticker.last), on essaie d'utiliser ticker.info.prevClosePrice.
 * Si cela échoue, on utilise un fallback via MATIC/USDT et USDT/EUR.
 * Cette fonction doit être exécutée côté serveur.
 *
 * @param eur Montant en euros à convertir
 * @returns Un objet contenant le montant converti et le datetime associé.
 */
export async function convertEurToPOL(eur: number): Promise<{ amount: number; datetime: string }> {
  const exchange = new ccxt.kraken();

  try {
    await exchange.loadMarkets();
    let priceInEur: number | undefined = undefined;
    let usedDatetime: string | undefined = undefined;
    const symbolDirect = "MATIC/EUR";
    try {
      const tickerDirect = await exchange.fetchTicker(symbolDirect);
      //console.log("Ticker direct :", tickerDirect);
      priceInEur = tickerDirect.last;
      // Si le prix direct n'est pas valide, essayer avec prevClosePrice
      if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
        const prev = parseFloat((tickerDirect.info as any).prevClosePrice);
        if (!isNaN(prev) && prev > 0) {
          priceInEur = prev;
          //console.log(`Utilisation de ticker.info.prevClosePrice pour ${symbolDirect} : ${priceInEur}`);
        }
      }
      usedDatetime = tickerDirect.datetime;
    } catch (error) {
      console.error(`Erreur lors de la récupération du ticker pour ${symbolDirect}:`, error);
    }

    // Si le ticker direct n'est pas disponible ou ne fournit pas un prix valide, utiliser le fallback.
    if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
      //console.log(`La paire ${symbolDirect} n'est pas disponible ou retourne un prix indéfini/0. Utilisation du fallback via MATIC/USDT et USDT/EUR.`);
      const symbolMaticUsdt = "MATIC/USDT";
      const symbolUsdtEur = "USDT/EUR";
      const tickerMaticUsdt = await exchange.fetchTicker(symbolMaticUsdt);
      //console.log("Ticker MATIC/USDT :", tickerMaticUsdt);
      let priceMaticUsdt = tickerMaticUsdt.last;
      if (priceMaticUsdt === undefined || typeof priceMaticUsdt !== "number" || priceMaticUsdt === 0) {
        const prev = parseFloat((tickerMaticUsdt.info as any).prevClosePrice);
        if (!isNaN(prev) && prev > 0) {
          priceMaticUsdt = prev;
          //console.log(`Utilisation de ticker.info.prevClosePrice pour ${symbolMaticUsdt} : ${priceMaticUsdt}`);
        }
      }
      if (priceMaticUsdt === undefined || typeof priceMaticUsdt !== "number" || priceMaticUsdt === 0) {
        throw new Error(`Le prix pour ${symbolMaticUsdt} n'est pas disponible.`);
      }
      const tickerUsdtEur = await exchange.fetchTicker(symbolUsdtEur);
      //console.log("Ticker USDT/EUR :", tickerUsdtEur);
      let priceUsdtEur = tickerUsdtEur.last;
      if (priceUsdtEur === undefined || typeof priceUsdtEur !== "number" || priceUsdtEur === 0) {
        const prev = parseFloat((tickerUsdtEur.info as any).prevClosePrice);
        if (!isNaN(prev) && prev > 0) {
          priceUsdtEur = prev;
          //console.log(`Utilisation de ticker.info.prevClosePrice pour ${symbolUsdtEur} : ${priceUsdtEur}`);
        }
      }
      if (priceUsdtEur === undefined || typeof priceUsdtEur !== "number" || priceUsdtEur === 0) {
        throw new Error(`Le prix pour ${symbolUsdtEur} n'est pas disponible.`);
      }
      priceInEur = priceMaticUsdt * priceUsdtEur;
      //console.log(`Prix dérivé pour MATIC/EUR via fallback: ${priceInEur} EUR (MATIC/USDT: ${priceMaticUsdt}, USDT/EUR: ${priceUsdtEur})`);
      // On choisit la datetime de MATIC/USDT en fallback.
      usedDatetime = tickerMaticUsdt.datetime;
    } else {
      console.log(`Ticker direct pour ${symbolDirect} a donné un prix: ${priceInEur}`);
    }

    if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
      throw new Error("Le prix n'est pas disponible après fallback.");
    }

    const amountInPOL = eur / priceInEur;
    //console.log(`Conversion réussie : ${eur} EUR équivaut à ${amountInPOL} POL (prix MATIC/EUR: ${priceInEur})`);
    return { amount: amountInPOL, datetime: usedDatetime || new Date().toISOString() };
  } catch (error) {
    console.error("Erreur lors de la conversion EUR vers POL:", error);
    throw error;
  }
}

// Fonction de conversion de POL en Wei (1 POL = 10^18 Wei)
export function convertPriceInPolToWei(priceInPol: number | string | null): bigint {
  if (priceInPol === null) return 0n;
  // Convertir en chaîne de caractères
  const priceStr = typeof priceInPol === "string" ? priceInPol : priceInPol.toString();
  const parts = priceStr.split(".");
  const whole = parts[0];
  let fraction = parts[1] || "";
  // On complète la partie fractionnaire jusqu'à 18 décimales
  if (fraction.length < 18) {
    fraction = fraction.padEnd(18, "0");
  } else {
    fraction = fraction.slice(0, 18);
  }
  return BigInt(whole + fraction);
}