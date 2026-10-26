'use client';

import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { uploadLinkMessage, uploadLinkWhatsAppUrl } from '@/lib/consultationUploadLink';

export default function StylistUploadLinkActions({ uploadUrl, clientName, clientPhone, className = '' }: {
  uploadUrl: string;
  clientName: string;
  clientPhone: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const whatsApp = uploadLinkWhatsAppUrl(clientPhone, clientName, uploadUrl);

  async function copy() {
    try {
      await navigator.clipboard.writeText(uploadLinkMessage(clientName, uploadUrl));
      setCopied(true);
    } catch {
      window.prompt('Copy this upload link', uploadUrl);
    }
  }

  return <div className={`flex flex-wrap gap-2 ${className}`}>
    {whatsApp && <a href={whatsApp} target="_blank" rel="noreferrer" className="ma-btn ma-btn--primary flex-1 justify-center"><MessageCircle size={15} /> Send on WhatsApp</a>}
    <button type="button" className="ma-btn ma-btn--dark flex-1 justify-center" onClick={() => void copy()}>
      {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Message copied' : 'Copy upload link'}
    </button>
  </div>;
}
