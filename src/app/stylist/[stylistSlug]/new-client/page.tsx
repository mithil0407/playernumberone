import StylistNewClientForm from '@/components/StylistNewClientForm';

export default async function NewClientPage({ params }: { params: Promise<{ stylistSlug: string }> }) {
  const { stylistSlug } = await params;
  return <StylistNewClientForm stylistSlug={stylistSlug} />;
}
