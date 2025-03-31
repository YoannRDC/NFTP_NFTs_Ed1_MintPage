import { NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY as string,
  server: process.env.MAILCHIMP_SERVER_PREFIX as string,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("listId");

  if (!listId) {
    return NextResponse.json(
      { error: "Le paramètre listId est requis." },
      { status: 400 }
    );
  }

  try {
    // Utiliser l'endpoint tag-search de Mailchimp pour récupérer les tags disponibles.
    // En passant un nom vide, on récupère tous les tags.
    const response = await mailchimp.request({
      method: "GET",
      path: `/lists/${listId}/tag-search`,
      query: { name: "" },
    });
    // La réponse devrait contenir une propriété "tags" avec un tableau de tags.
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
