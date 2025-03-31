import { NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY as string,
  server: process.env.MAILCHIMP_SERVER_PREFIX as string,
});

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

    // Mise à jour du membre via l'API Mailchimp
    const updateResponse = await mailchimp.lists.updateListMember(listId, subscriberHash, {
      email_address,
      merge_fields,
    });

    // Si des tags sont fournis, mise à jour des tags du membre
    let tagResponse = null;
    if (tags && Array.isArray(tags)) {
      // tags doit être un tableau d'objets { name: string, status: 'active' | 'inactive' }
      tagResponse = await mailchimp.lists.updateListMemberTags(listId, subscriberHash, {
        tags,
      });
    }

    return NextResponse.json({ updateResponse, tagResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
