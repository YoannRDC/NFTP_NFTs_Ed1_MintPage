import { useEffect, useState } from "react";

export default function useMaticToEur() {
  const [maticPrice, setMaticPrice] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=polygon&vs_currencies=eur");
        const data = await res.json();
        setMaticPrice(data.polygon.eur);
      } catch (error) {
        console.error("Erreur lors de la récupération du prix MATIC/EUR", error);
      }
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Rafraîchir toutes les minutes

    return () => clearInterval(interval);
  }, []);

  return maticPrice;
}
