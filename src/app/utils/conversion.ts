export async function convertPolToEur(maticAmount: number): Promise<number | null> {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=polygon&vs_currencies=eur");
      const data = await res.json();
      const maticPrice = data.polygon.eur;
  
      if (!maticPrice) return null;
  
      return maticAmount * maticPrice;
    } catch (error) {
      console.error("Erreur lors de la conversion POL ➝ EUR", error);
      return null;
    }
  }
  