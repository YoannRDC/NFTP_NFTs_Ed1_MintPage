"use client";

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import md5 from "blueimp-md5";
import { MAILCHIMP_LIST_ID } from "../constants";

type MemberData = {
  email_address: string;
  merge_fields: {
    WALLET: string;
    FNAME: string;
    LNAME: string;
    ADDRESS: string;
    PHONE: string;
    BIRTHDAY: string;
    COMPANY: string;
  };
};

const MailchimpUpdateAccount: React.FC = () => {
  const account = useActiveAccount();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Formulaire avec les données à mettre à jour
  const [formData, setFormData] = useState<MemberData>({
    email_address: "",
    merge_fields: {
      WALLET: "",
      FNAME: "",
      LNAME: "",
      ADDRESS: "",
      PHONE: "",
      BIRTHDAY: "",
      COMPANY: "",
    },
  });

  // Récupérer les données du membre via l'endpoint GET (filtrage sur WALLET)
  useEffect(() => {
    if (!account?.address) return;
    setLoading(true);
    setError(null);
    fetch(`/api/mailchimp/members?listId=${MAILCHIMP_LIST_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.members) {
          const member = data.members.find((m: any) => {
            return (
              m.merge_fields &&
              m.merge_fields.WALLET &&
              m.merge_fields.WALLET.toLowerCase() === account.address.toLowerCase()
            );
          });
          if (member) {
            setMemberData(member);
            setFormData({
              email_address: member.email_address || "",
              merge_fields: {
                WALLET: member.merge_fields.WALLET || "",
                FNAME: member.merge_fields.FNAME || "",
                LNAME: member.merge_fields.LNAME || "",
                ADDRESS: member.merge_fields.ADDRESS || "",
                PHONE: member.merge_fields.PHONE || "",
                BIRTHDAY: member.merge_fields.BIRTHDAY || "",
                COMPANY: member.merge_fields.COMPANY || "",
              },
            });
          }
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Erreur lors de la récupération de vos données.");
      })
      .finally(() => setLoading(false));
  }, [account?.address]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUpdateSuccess(null);
    try {
      // Calcul du subscriber hash à partir de l'email (en minuscule)
      const subscriberHash = md5(formData.email_address.toLowerCase());
      const res = await fetch(`/api/mailchimp/members/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: MAILCHIMP_LIST_ID,
          subscriberHash,
          email_address: formData.email_address,
          merge_fields: formData.merge_fields,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateSuccess("Compte mis à jour avec succès !");
        setMemberData(data);
      } else {
        setError(data.error || "Erreur lors de la mise à jour.");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading && !memberData) {
    return <div>Chargement de vos données...</div>;
  }

  if (!memberData) {
    return (
      <div className="p-4 m-10 border rounded">
        <p>Aucun compte trouvé pour ce wallet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 m-10 border rounded">
      {!showForm ? (
        <button
          className="px-6 py-2 bg-green-500 text-white rounded"
          onClick={() => setShowForm(true)}
        >
          Mon compte
        </button>
      ) : (
        <form onSubmit={handleUpdate} className="flex flex-col space-y-4">
          {/* WALLET en readonly */}
          <div>
            <label className="block font-bold">Wallet</label>
            <input
              type="text"
              value={formData.merge_fields.WALLET}
              readOnly
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* EMAIL en readonly */}
          <div>
            <label className="block font-bold">Email</label>
            <input
              type="email"
              value={formData.email_address}
              readOnly
              className="border px-4 py-2 w-full bg-gray-100"
            />
          </div>
          {/* FNAME */}
          <div>
            <label className="block font-bold">Prénom (FNAME)</label>
            <input
              type="text"
              value={formData.merge_fields.FNAME}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: { ...formData.merge_fields, FNAME: e.target.value },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* LNAME */}
          <div>
            <label className="block font-bold">Nom de famille (LNAME)</label>
            <input
              type="text"
              value={formData.merge_fields.LNAME}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: { ...formData.merge_fields, LNAME: e.target.value },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* ADDRESS */}
          <div>
            <label className="block font-bold">Adresse (ADDRESS)</label>
            <input
              type="text"
              value={formData.merge_fields.ADDRESS}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: { ...formData.merge_fields, ADDRESS: e.target.value },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* PHONE */}
          <div>
            <label className="block font-bold">Téléphone (PHONE)</label>
            <input
              type="text"
              value={formData.merge_fields.PHONE}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: { ...formData.merge_fields, PHONE: e.target.value },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* BIRTHDAY */}
          <div>
            <label className="block font-bold">Birthday</label>
            <input
              type="text"
              value={formData.merge_fields.BIRTHDAY}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: { ...formData.merge_fields, BIRTHDAY: e.target.value },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* COMPANY */}
          <div>
            <label className="block font-bold">Company</label>
            <input
              type="text"
              value={formData.merge_fields.COMPANY}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: { ...formData.merge_fields, COMPANY: e.target.value },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded"
          >
            {loading ? "Mise à jour..." : "Enregistrer"}
          </button>
          {error && <div className="text-red-500">{error}</div>}
          {updateSuccess && <div className="text-green-500">{updateSuccess}</div>}
        </form>
      )}
    </div>
  );
};

export default MailchimpUpdateAccount;
