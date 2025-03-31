"use client";

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import MailchimpSubscription from "./MailchimpSubscription";
import MailchimpUpdateAccount from "./MailchimpUpdateAccount";

const LIST_ID = "c642fe82cc"; // Remplacez par votre listId Mailchimp

const MailchimpAccount: React.FC = () => {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/mailchimp/members?listId=${LIST_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.members && Array.isArray(data.members)) {
          const member = data.members.find(
            (m: any) =>
              m.merge_fields &&
              m.merge_fields.WALLET &&
              m.merge_fields.WALLET.toLowerCase() === account?.address.toLowerCase()
          );
          setIsSubscribed(!!member);
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des membres:", error);
      })
      .finally(() => setLoading(false));
  }, [account?.address]);

  if (loading) return <div>Chargement...</div>;
  if (!account?.address) return <div>Veuillez connecter votre wallet.</div>;

  return (
    <div>
      {isSubscribed ? (
        <MailchimpUpdateAccount />
      ) : (
        <MailchimpSubscription listId={LIST_ID} />
      )}
    </div>
  );
};

export default MailchimpAccount;
