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
    ANNIVERSAIRE: string; // Champ personnalisé au format DD/MM/YYYY dans le formulaire
    COMPANY: string;
  };
  tags?: Array<{ name: string; status: string }>;
};

type Tag = {
  name: string;
};

const MailchimpUpdateAccount: React.FC = () => {
  const account = useActiveAccount();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [showEmailInfo, setShowEmailInfo] = useState<boolean>(false);

  // Données du formulaire
  const [formData, setFormData] = useState<MemberData>({
    email_address: "",
    merge_fields: {
      WALLET: "",
      FNAME: "",
      LNAME: "",
      ADDRESS: "",
      PHONE: "",
      ANNIVERSAIRE: "",
      COMPANY: "",
    },
  });

  // Pour les tags disponibles et sélectionnés
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Récupération des données du membre
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
                ANNIVERSAIRE: member.merge_fields.ANNIVERSAIRE || "",
                COMPANY: member.merge_fields.COMPANY || "",
              },
            });
            setSelectedTags(member.tags ? member.tags.map((tag: any) => tag.name) : []);
          }
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Erreur lors de la récupération de vos données.");
      })
      .finally(() => setLoading(false));
  }, [account?.address]);

  // Récupération des tags disponibles
  useEffect(() => {
    fetch(`/api/mailchimp/tags?listId=${MAILCHIMP_LIST_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) {
          setAvailableTags(data.tags);
        } else {
          setAvailableTags([]);
        }
      })
      .catch((err) =>
        console.error("Erreur lors de la récupération des tags disponibles :", err)
      );
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUpdateSuccess(null);
    try {
      // Conversion du champ ANNIVERSAIRE du format DD/MM/YYYY vers MM/DD/YYYY attendu par Mailchimp
      const inputAnniversaire = formData.merge_fields.ANNIVERSAIRE;
      let formattedAnniversaire = inputAnniversaire;
      const parts = inputAnniversaire.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        formattedAnniversaire = `${month}/${day}/${year}`;
      }
      const merge_fields = {
        ...formData.merge_fields,
        ANNIVERSAIRE: formattedAnniversaire,
      };

      // Calcul du subscriber hash
      const subscriberHash = md5(formData.email_address.toLowerCase());

      // Préparation des tags
      const tagsArray = availableTags.map((tag) => ({
        name: tag.name,
        status: selectedTags.includes(tag.name) ? "active" : "inactive",
      }));

      const res = await fetch(`/api/mailchimp/members/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: MAILCHIMP_LIST_ID,
          subscriberHash,
          email_address: formData.email_address,
          merge_fields,
          tags: tagsArray,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateSuccess("Compte mis à jour avec succès !");
        setMemberData(data.updateResponse || data);
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
        <form
          onSubmit={handleUpdate}
          className="flex flex-col space-y-4 min-w-[600px] whitespace-nowrap text-black"
        >
          {/* WALLET en lecture seule */}
          <div>
            <label className="block font-bold text-white">Wallet</label>
            <input
              type="text"
              value={formData.merge_fields.WALLET}
              readOnly
              className="border px-4 py-2 w-full bg-gray-100"
            />
            <small className="text-xs text-gray-500">
              Ce champ est non modifiable
            </small>
          </div>
          {/* EMAIL en lecture seule avec info */}
          <div>
            <label className="block font-bold text-white">Email</label>
            <div className="flex items-center">
              <input
                type="email"
                value={formData.email_address}
                readOnly
                className="border px-4 py-2 bg-gray-100"
                style={{ maxWidth: "calc(100% - 40px)" }}
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmailInfo(!showEmailInfo)}
                  className="ml-2 flex items-center justify-center w-6 h-6 bg-white text-black rounded-full border border-gray-300"
                >
                  i
                </button>
                {showEmailInfo && (
                  <div className="absolute left-0 z-10 mt-1 p-2 bg-white text-black text-xs border border-gray-300 rounded">
                    Pour changer l'email, contacter le support.
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* FNAME */}
          <div>
            <label className="block font-bold text-white">Prénom</label>
            <input
              type="text"
              value={formData.merge_fields.FNAME}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: {
                    ...formData.merge_fields,
                    FNAME: e.target.value,
                  },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* LNAME */}
          <div>
            <label className="block font-bold text-white">Nom de famille</label>
            <input
              type="text"
              value={formData.merge_fields.LNAME}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: {
                    ...formData.merge_fields,
                    LNAME: e.target.value,
                  },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* ADDRESS */}
          <div>
            <label className="block font-bold text-white">Adresse postale</label>
            <input
              type="text"
              value={formData.merge_fields.ADDRESS}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: {
                    ...formData.merge_fields,
                    ADDRESS: e.target.value,
                  },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* PHONE */}
          <div>
            <label className="block font-bold text-white">Téléphone</label>
            <input
              type="text"
              value={formData.merge_fields.PHONE}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: {
                    ...formData.merge_fields,
                    PHONE: e.target.value,
                  },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* ANNIVERSAIRE avec vérification du format */}
          <div>
            <label className="block font-bold text-white">Anniversaire</label>
            <input
              type="text"
              value={formData.merge_fields.ANNIVERSAIRE}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: {
                    ...formData.merge_fields,
                    ANNIVERSAIRE: e.target.value,
                  },
                })
              }
              placeholder="DD/MM/YYYY"
              pattern="^(0[1-9]|[12]\d|3[01])/(0[1-9]|1[0-2])/\d{4}$"
              title="Format: DD/MM/YYYY"
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* COMPANY */}
          <div>
            <label className="block font-bold text-white">Company</label>
            <input
              type="text"
              value={formData.merge_fields.COMPANY}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merge_fields: {
                    ...formData.merge_fields,
                    COMPANY: e.target.value,
                  },
                })
              }
              className="border px-4 py-2 w-full"
            />
          </div>
          {/* TAGS sous forme de cases à cocher */}
          <div>
            <label className="block font-bold text-white">Abonnements</label>
            {availableTags.map((tag) => (
              <div key={tag.name} className="flex items-center text-white">
                <input
                  type="checkbox"
                  id={`tag-${tag.name}`}
                  checked={selectedTags.includes(tag.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags((prev) => [...prev, tag.name]);
                    } else {
                      setSelectedTags((prev) =>
                        prev.filter((t) => t !== tag.name)
                      );
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor={`tag-${tag.name}`}>{tag.name}</label>
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded"
          >
            {loading ? "Mise à jour..." : "Enregistrer"}
          </button>
          {error && <div className="text-red-500">{error}</div>}
          {updateSuccess && (
            <div className="text-green-500">{updateSuccess}</div>
          )}
        </form>
      )}
    </div>
  );
};

export default MailchimpUpdateAccount;
