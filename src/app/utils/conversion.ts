import ccxt from "ccxt";

/**
 * Retourne le taux de conversion d'une crypto donnée en EUR.
 * Exemple : symbol = "MATIC" ou "ETH"
 *
 * Si la paire directe "MATIC/EUR" n'existe pas ou est invalide,
 * elle utilise un fallback via MATIC/USDT + USDT/EUR.
 */
export async function getCryptoToEurRate(symbol: string): Promise<{ rate: number; datetime: string }> {
  const exchange = new ccxt.kraken();
  await exchange.loadMarkets();

  const directSymbol = `${symbol}/EUR`;
  let rate: number | undefined;
  let datetime: string | undefined;

  try {
    const tickerDirect = await exchange.fetchTicker(directSymbol);
    rate = tickerDirect.last;
    if (!rate || rate === 0) {
      const prev = parseFloat((tickerDirect.info as any).prevClosePrice);
      if (!isNaN(prev) && prev > 0) {
        rate = prev;
      }
    }
    datetime = tickerDirect.datetime;
  } catch (error) {
    console.warn(`Paire directe non disponible (${directSymbol}), tentative fallback...`);
  }

  // Fallback via USDT
  if (!rate || rate === 0) {
    const tickerCryptoUsdt = await exchange.fetchTicker(`${symbol}/USDT`);
    const tickerUsdtEur = await exchange.fetchTicker("USDT/EUR");

    let priceCryptoUsdt = tickerCryptoUsdt.last || parseFloat((tickerCryptoUsdt.info as any).prevClosePrice);
    let priceUsdtEur = tickerUsdtEur.last || parseFloat((tickerUsdtEur.info as any).prevClosePrice);

    if (!priceCryptoUsdt || !priceUsdtEur) {
      throw new Error(`Impossible d'obtenir le taux de conversion pour ${symbol} -> EUR.`);
    }

    rate = priceCryptoUsdt * priceUsdtEur;
    datetime = tickerCryptoUsdt.datetime;
  }

  return {
    rate,
    datetime: datetime || new Date().toISOString(),
  };
}

/**
 * Convertit un montant en EUR en une crypto donnée (ex: ETH, MATIC)
 */
export async function convertEurToCrypto(eur: number, symbol: string): Promise<{ amount: number; datetime: string }> {
  const { rate, datetime } = await getCryptoToEurRate(symbol);
  return { amount: eur / rate, datetime };
}

/**
 * Convertit un montant en crypto (ex: MATIC) en Wei (1 crypto = 10^18 Wei).
 */
export function convertCryptoToWei(amount: number | string | null): bigint {
  if (amount === null) return 0n;
  const priceStr = typeof amount === "string" ? amount : amount.toString();
  const [whole, fraction = ""] = priceStr.split(".");
  const fractionPadded = (fraction + "000000000000000000").slice(0, 18);
  return BigInt(whole + fractionPadded);
}
