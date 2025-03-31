import { NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY as string,
  server: process.env.MAILCHIMP_SERVER_PREFIX as string,
});

// GET : Récupère les membres d'une liste via le paramètre "listId"
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get('listId');

  if (!listId) {
    return NextResponse.json(
      { error: 'Le paramètre listId est requis' },
      { status: 400 }
    );
  }

  try {
    const response = await mailchimp.lists.getListMembersInfo(listId);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST : Ajoute un membre dans la liste (email, listId et walletAddress dans le body)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, listId, walletAddress } = body;
    console.log("listId:", listId);
    console.log(" > email:", email);
    console.log(" > walletAddress:", walletAddress);
    
    if (!email || !listId) {
      return NextResponse.json(
        { error: 'Email et listId sont requis' },
        { status: 400 }
      );
    }

    const response = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed', // ou "pending" pour un double opt-in
      merge_fields: {
        WALLET: walletAddress,
      },
    });
    
    // Si la réponse est vide, renvoyer un objet JSON par défaut
    if (!response || Object.keys(response).length === 0) {
      return NextResponse.json({ message: "Utilisateur ajouté avec succès." });
    }
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Erreur lors de l'ajout du membre :", error);
    if (error.response) {
      console.error("Détails de l'erreur Mailchimp :", await error.response.text());
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH : Met à jour les informations d'un membre et ses tags
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { listId, subscriberHash, email_address, merge_fields, tags } = body;

    if (!listId || !subscriberHash || !email_address) {
      return NextResponse.json(
        { error: 'Les paramètres listId, subscriberHash et email_address sont requis.' },
        { status: 400 }
      );
    }

    // Mise à jour des informations du membre (email et merge_fields)
    const updateResponse = await mailchimp.lists.updateListMember(listId, subscriberHash, {
      email_address,
      merge_fields,
    });

    // Récupérer les tags actuels du membre
    const currentTagsResponse = await mailchimp.lists.getListMemberTags(listId, subscriberHash);
    const currentTags = currentTagsResponse.tags || [];

    // Mise à jour des tags du membre.
    // tags doit être un tableau d'objets, par exemple : 
    // [{ name: "Tag1", status: "active" }, { name: "Tag2", status: "inactive" }]
    const tagResponse = await mailchimp.lists.updateListMemberTags(listId, subscriberHash, { tags });

    return NextResponse.json({ updateResponse, currentTags, tagResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
