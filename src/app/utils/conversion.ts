export async function convertPolToEur(maticAmount: number): Promise<number | null> {
  try {
    const headers: HeadersInit = {}; // Déclare un objet HeadersInit

    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=polygon&vs_currencies=eur",
      { headers }
    );

    const data = await response.json();
    const maticPrice = data?.polygon?.eur;

    if (!maticPrice) return null;

    return maticAmount * maticPrice;
  } catch (error) {
    console.error("Erreur lors de la conversion POL ➝ EUR", error);
    return null;
  }
}
