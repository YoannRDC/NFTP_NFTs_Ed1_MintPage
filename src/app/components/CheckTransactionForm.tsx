// components/CheckTransactionForm.tsx
"use client";

import { useState } from "react";

export default function CheckTransactionForm() {
  const [paymentTxHash, setPaymentTxHash] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/dao-process-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentTxHash }),
      });

      const json = await res.json();

      if (res.ok) {
        setStatus(`✅ ${json.message}`);
      } else {
        setStatus(`❌ ${json.error}`);
      }
    } catch (err: any) {
      setStatus(`❌ Erreur réseau : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-lg font-bold mb-2">Vérifier une transaction</h2>
      <input
        type="text"
        value={paymentTxHash}
        onChange={(e) => setPaymentTxHash(e.target.value)}
        placeholder="Transaction hash"
        className="w-full p-2 border mb-3 rounded"
      />
      <button
        onClick={handleCheck}
        disabled={loading || !paymentTxHash}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Vérification..." : "Vérifier & Traiter"}
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
