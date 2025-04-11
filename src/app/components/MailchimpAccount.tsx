"use client";

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useSearchParams } from "next/navigation";
import MailchimpSubscription from "./MailchimpSubscription";
import MailchimpUpdateAccount from "./MailchimpUpdateAccount";
import { MAILCHIMP_LIST_ID } from "../constants";

const MailchimpAccount: React.FC = () => {
  const account = useActiveAccount();
  const searchParams = useSearchParams();
  const subscriptionResult = searchParams.get("subscriptionResult");
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setLoading(false);
      console.log("no account found")
      return;
    }
    console.log("account.address.toLowerCase(): ", account.address.toLowerCase())
    setLoading(true);
    fetch(`/api/mailchimp/members?listId=${MAILCHIMP_LIST_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.members && Array.isArray(data.members)) {
          const member = data.members.find(
            (m: any) =>
              m.merge_fields &&
              m.merge_fields.WALLET &&
              m.merge_fields.WALLET.toLowerCase() === account.address.toLowerCase()
          );
          console.log("mailchimp member: ", member)
          setIsSubscribed(!!member);
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des membres:", error);
      })
      .finally(() => setLoading(false));
  }, [account?.address, subscriptionResult]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      {isSubscribed ? (
        <MailchimpUpdateAccount />
      ) : (
        <MailchimpSubscription listId={MAILCHIMP_LIST_ID} />
      )}
    </div>
  );
};

export default MailchimpAccount;
