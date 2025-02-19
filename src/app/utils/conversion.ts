export async function convertPolToEur(maticAmount: number): Promise<number | null> {
  try {
    const headers: HeadersInit = {};

    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=polygon&vs_currencies=eur",
      { headers }
    );

    const data = await response.json();
    console.log("API Response Data:", data); // 🔍 Vérifie la structure de la réponse

    // Vérifie comment est structuré l'objet retourné
    const maticPrice = data?.polygon?.eur;

    console.log("Extracted MATIC Price:", maticPrice); // 🔍 Vérifie si la valeur est bien extraite

    if (!maticPrice) return null;

    return maticAmount * maticPrice;
  } catch (error) {
    console.error("Erreur lors de la conversion POL ➝ EUR", error);
    return null;
  }
}
