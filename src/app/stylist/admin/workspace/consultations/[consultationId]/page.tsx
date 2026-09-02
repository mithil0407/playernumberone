import ConsultationWorkspacePage from '@/components/StylistConsultationWorkspace';
export default function AdminConsultationPage({ params }: { params: Promise<{ consultationId: string }> }) {
  return <ConsultationWorkspacePage params={params} adminMode />;
}
