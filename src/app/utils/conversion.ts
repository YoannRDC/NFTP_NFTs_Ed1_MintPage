export async function convertPolToEur(maticAmount: number): Promise<number | null> {
  try {
    const response = await fetch(
      "https://pro-api.coingecko.com/api/v3/simple/price?ids=polygon&vs_currencies=eur",
      {
        headers: {
          "x_cg_pro_api_key": "CG-DBzoUuXdkJuPsj5CTqacbVdU",
        },
      }
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
