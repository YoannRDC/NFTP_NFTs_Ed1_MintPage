import { NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';
import md5 from 'blueimp-md5';

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY as string,
  server: process.env.MAILCHIMP_SERVER_PREFIX as string,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, listId, walletAddress } = body;
    console.log("listId:", listId);
    console.log(" > email:", email);
    console.log(" > walletAddress:", walletAddress);

    if (!email || !listId || !walletAddress) {
      return NextResponse.json(
        { error: 'Email, listId et walletAddress sont requis' },
        { status: 400 }
      );
    }
    
    // Tenter d'ajouter le membre dans la liste
    let addResponse;
    try {
      addResponse = await mailchimp.lists.addListMember(listId, {
        email_address: email,
        status: 'subscribed', // ou "pending" pour un double opt-in
        merge_fields: {
          WALLET: walletAddress,
        },
      });
    } catch (error: any) {
      console.log("Debug: In the catch for addListMember");
      // Si une erreur survient lors de l'ajout, tenter de récupérer le membre existant
      try {
        const subscriberHash = md5(email.toLowerCase());
        const existingMember = await mailchimp.lists.getListMember(listId, subscriberHash);
        const existingWallet = existingMember.merge_fields.WALLET || "inconnu";
        return NextResponse.json(
          { error: `Cet email est déjà utilisé avec le compte ${existingWallet}` },
          { status: 400 }
        );
      } catch (innerError: any) {
        return NextResponse.json(
          { error: `Erreur inconnue: Impossible d'ajouter l'email. Contactez le support svp` },
          { status: 400 }
        );
      }
    }
    
    // Calcul du subscriber hash (MD5 de l'email en minuscules)
    const subscriberHash = md5(email.toLowerCase());
    
    // Récupérer tous les tags disponibles pour la liste via tagSearch (en passant un nom vide)
    const tagSearchResponse = await mailchimp.lists.tagSearch(listId, { name: "" });
    const allTags = tagSearchResponse.tags || [];
    
    // Préparer le tableau des tags avec le status "active" pour chacun
    const tagsArray = allTags.map((tag: any) => ({
      name: tag.name,
      status: "active",
    }));
    
    // Mettre à jour les tags du membre pour qu'il soit abonné à tous les tags
    const updateTagsResponse = await mailchimp.lists.updateListMemberTags(listId, subscriberHash, { tags: tagsArray });
    
    // Combiner les réponses et renvoyer le résultat
    const combinedResponse = {
      addResponse,
      updateTagsResponse,
    };
    
    return NextResponse.json(combinedResponse);
  } catch (error: any) {
    console.error("Erreur lors de l'ajout du membre :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
