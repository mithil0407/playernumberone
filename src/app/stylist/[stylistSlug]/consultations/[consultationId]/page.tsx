import StylistConsultationWorkspace from '@/components/StylistConsultationWorkspace';
export default function ConsultationWorkspacePage({ params }: { params: Promise<{ stylistSlug: string; consultationId: string }> }) {
  return <StylistConsultationWorkspace params={params} />;
}
