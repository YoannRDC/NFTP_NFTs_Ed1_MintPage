import useMaticToEur from "../hooks/useMaticToEur";
import { useState } from "react";

export default function MaticToEurConverter() {
  const maticPrice = useMaticToEur();
  const [maticAmount, setMaticAmount] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaticAmount(Number(e.target.value));
  };

  return (
    <div className="p-4 border border-zinc-800 rounded-lg text-center">
      <h2 className="text-lg font-semibold">Convertisseur POL ➝ EUR</h2>
      <input
        type="number"
        value={maticAmount}
        onChange={handleChange}
        className="mt-2 p-2 border border-zinc-700 rounded bg-zinc-900 text-white w-24"
        placeholder="1"
      />
      <p className="mt-2">
        {maticAmount} POL ={" "}
        {maticPrice !== null ? (maticAmount * maticPrice).toFixed(2) + " EUR" : "Chargement..."}
      </p>
    </div>
  );
}
