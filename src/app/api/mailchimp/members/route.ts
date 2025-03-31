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
    return NextResponse.json({ error: 'Le paramètre listId est requis' }, { status: 400 });
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
    // Si l'erreur possède une réponse plus détaillée, la logger
    if (error.response) {
      console.error("Détails de l'erreur Mailchimp :", await error.response.text());
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
