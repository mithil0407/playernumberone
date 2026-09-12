import InstantReportAdminEditor from './InstantReportAdminEditor';
export default async function InstantReportAdminDetailPage({ params }: { params: Promise<{ reportId: string }> }) { const { reportId } = await params; return <InstantReportAdminEditor reportId={reportId} />; }

