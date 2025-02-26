export async function convertPolToEur(maticAmount: number): Promise<number | null> {
  try {
/*     // Vérifie si la clé API est définie
    if (!process.env.COINGECKO_API_KEY) {
      console.error("La clé API CoinGecko n'est pas définie.");
      return null;
    } */

    // Utilise l'endpoint de CoinGecko avec la clé API dans l'URL
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=polygon&x_cg_demo_api_key=CG-DBzoUuXdkJuPsj5CTqacbVdU`
    );

    console.log("yo TEST", `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=polygon&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`);

    // Vérifie si la réponse est correcte
    if (!response.ok) {
      console.error("Erreur de réponse API:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log("API Response Data:", data); // 🔍 Vérifie la structure de la réponse

    // Vérifie comment est structuré l'objet retourné
    const maticPrice = data[0]?.current_price; // Utilise le prix actuel

    console.log("Extracted MATIC Price:", maticPrice); // 🔍 Vérifie si la valeur est bien extraite

    if (!maticPrice) return null;

    return maticAmount * maticPrice;
  } catch (error) {
    console.error("Erreur lors de la conversion POL ➝ EUR", error);
    return null;
  }
}
