'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Sheet } from '@/components/manAdmin/ui';

function indiaToday() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

/**
 * For a report that already reached the client outside the studio. There is no
 * link to publish, so the stylist says which day she sent it.
 */
export default function StylistManualDeliveryDialog({ consultationId, clientName, onClose, onDone }: {
  consultationId: string; clientName: string; onClose: () => void; onDone: () => void;
}) {
  const today = indiaToday();
  const [day, setDay] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}/manual-delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliveredOn: day }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not record the delivery');
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not record the delivery');
      setBusy(false);
    }
  };

  return <Sheet open onClose={onClose} width={480} eyebrow="Already sent" title={`When did ${clientName} get her report?`} footer={<>
    <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
    <Button variant="dark" icon={<Check size={14} />} loading={busy} onClick={() => void submit()}>Mark delivered</Button>
  </>}>
    <p className="ma-muted text-[14px] leading-6">Use this when you sent the report yourself, on WhatsApp or email, instead of through the studio. Choose the day you sent it. It moves her to Delivered, and the team can see the date you gave.</p>
    <label className="mt-5 block">
      <span className="ma-label">Sent on</span>
      <input type="date" value={day} max={today} onChange={event => setDay(event.target.value)} className="ma-input" />
    </label>
    {error && <p role="alert" className="mt-4 rounded-xl px-4 py-2.5 text-[13px]" style={{ background: 'var(--ma-red-soft)', color: 'var(--ma-red)' }}>{error}</p>}
  </Sheet>;
}
