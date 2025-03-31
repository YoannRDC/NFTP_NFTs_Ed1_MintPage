import { NextResponse } from "next/server";
import mailchimp from "@mailchimp/mailchimp_marketing";

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
    // Utilise la méthode tagSearch avec un nom vide pour récupérer tous les tags
    const response = await mailchimp.lists.tagSearch(listId, { name: "" });
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
