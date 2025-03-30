// src/app/api/mailchimp/route.ts
import { NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

// Configurez Mailchimp en utilisant vos variables d'environnement
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY as string,
  server: process.env.MAILCHIMP_SERVER_PREFIX as string,
});

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
