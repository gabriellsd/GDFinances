import { OAuthConsent } from "@/features/auth/components/oauth-consent";

export default async function OAuthConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  const { authorization_id: authorizationId } = await searchParams;
  if (!authorizationId) {
    return <main className="mx-auto flex min-h-dvh max-w-lg items-center justify-center p-6"><p className="text-sm text-muted-foreground">Solicitação de autorização não encontrada.</p></main>;
  }
  return <OAuthConsent authorizationId={authorizationId} />;
}
