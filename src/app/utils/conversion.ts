import ccxt from "ccxt";

/**
 * Retourne le taux de conversion de POL (MATIC) en EUR.
 * La valeur retournée correspond au prix d'une unité de POL en EUR.
 * Si la paire "MATIC/EUR" ne fournit pas de prix valide, un fallback est utilisé via "MATIC/USDT" et "USDT/EUR".
 * Cette fonction doit être exécutée côté serveur.
 *
 * @returns Un objet contenant le taux de conversion (rate) et le datetime associé.
 */
export async function getPolEuroRate(): Promise<{ rate: number; datetime: string }> {
    console.log("getPolEuroRate()");
  const exchange = new ccxt.kraken();
  console.log("getPolEuroRate()_0");
  await exchange.loadMarkets();
  console.log("getPolEuroRate()_A");
  let priceInEur: number | undefined = undefined;
  let usedDatetime: string | undefined = undefined;
  const symbolDirect = "POL/EUR";
  try {
    console.log("getPolEuroRate()_1");
    const tickerDirect = await exchange.fetchTicker(symbolDirect);
    console.log("getPolEuroRate()_2");
    priceInEur = tickerDirect.last;
    console.log("priceInEur:", priceInEur);
    // Si le prix direct n'est pas valide, essayer avec prevClosePrice
    if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
      const prev = parseFloat((tickerDirect.info as any).prevClosePrice);
      if (!isNaN(prev) && prev > 0) {
        priceInEur = prev;
      }
    }
    usedDatetime = tickerDirect.datetime;
  } catch (error) {
    console.error(`Erreur lors de la récupération du ticker pour ${symbolDirect}:`, error);
  }
  
  // Si le ticker direct n'est pas disponible ou ne fournit pas un prix valide, utiliser le fallback.
  if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
    const symbolMaticUsdt = "MATIC/USDT";
    const symbolUsdtEur = "USDT/EUR";
    const tickerMaticUsdt = await exchange.fetchTicker(symbolMaticUsdt);
    let priceMaticUsdt = tickerMaticUsdt.last;
    if (priceMaticUsdt === undefined || typeof priceMaticUsdt !== "number" || priceMaticUsdt === 0) {
      const prev = parseFloat((tickerMaticUsdt.info as any).prevClosePrice);
      if (!isNaN(prev) && prev > 0) {
        priceMaticUsdt = prev;
      }
    }
    if (priceMaticUsdt === undefined || typeof priceMaticUsdt !== "number" || priceMaticUsdt === 0) {
      throw new Error(`Le prix pour ${symbolMaticUsdt} n'est pas disponible.`);
    }
    const tickerUsdtEur = await exchange.fetchTicker(symbolUsdtEur);
    let priceUsdtEur = tickerUsdtEur.last;
    if (priceUsdtEur === undefined || typeof priceUsdtEur !== "number" || priceUsdtEur === 0) {
      const prev = parseFloat((tickerUsdtEur.info as any).prevClosePrice);
      if (!isNaN(prev) && prev > 0) {
        priceUsdtEur = prev;
      }
    }
    if (priceUsdtEur === undefined || typeof priceUsdtEur !== "number" || priceUsdtEur === 0) {
      throw new Error(`Le prix pour ${symbolUsdtEur} n'est pas disponible.`);
    }
    priceInEur = priceMaticUsdt * priceUsdtEur;
    usedDatetime = tickerMaticUsdt.datetime;
  }
  
  if (priceInEur === undefined || typeof priceInEur !== "number" || priceInEur === 0) {
    throw new Error("Le prix n'est pas disponible après fallback.");
  }
  
  return { rate: priceInEur, datetime: usedDatetime || new Date().toISOString() };
}

/**
 * Convertit un montant en EUR en POL (MATIC) en utilisant le taux de conversion récupéré via getPolEuroRate.
 *
 * @param eur Montant en euros à convertir
 * @returns Un objet contenant le montant converti en POL et le datetime associé.
 */
export async function convertEurToPOL(eur: number): Promise<{ amount: number; datetime: string }> {
  const { rate, datetime } = await getPolEuroRate();
  const amountInPOL = eur / rate;
  return { amount: amountInPOL, datetime };
}

/**
 * Convertit un montant en POL en Wei (1 POL = 10^18 Wei).
 *
 * @param priceInPol Montant en POL à convertir (number, string ou null)
 * @returns Le montant en Wei sous forme de bigint.
 */
export function convertPriceInPolToWei(priceInPol: number | string | null): bigint {
  if (priceInPol === null) return 0n;
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
