'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { QuizAnswers } from '@/lib/styleMembershipLogic';
import { nextScreenId, previousScreenId, type QuizContext } from '@/lib/styleMembershipQuiz';
import { readStore, writeStore } from './client';

export interface PublicLead {
  id: string;
  firstName: string | null;
  answers: QuizAnswers;
  selfieSeason: { name: string; best: Array<{ name: string; hex: string }>; avoid: Array<{ name: string; hex: string }>; metal: string; line: string; family: string } | null;
  selfieDone: boolean;
  lookStatus: 'none' | 'generating' | 'ready' | 'failed';
  lookUrl: string | null;
}

export interface MemberSession {
  membershipId: string;
  code: string;
  leadToken?: string | null;
}

interface QuizState {
  ready: boolean;
  answers: QuizAnswers;
  member: boolean;
  leadToken: string | null;
  lead: PublicLead | null;
  memberSession: MemberSession | null;
  context: QuizContext;
  setAnswer: <K extends keyof QuizAnswers>(field: K, value: QuizAnswers[K]) => void;
  setLead: (token: string | null, lead: PublicLead | null) => void;
  goNext: (fromId: string, answersOverride?: QuizAnswers) => void;
  goBack: (fromId: string) => void;
  goTo: (id: string) => void;
  finish: () => void;
}

const QuizStateContext = createContext<QuizState | null>(null);

export function useQuiz() {
  const value = useContext(QuizStateContext);
  if (!value) throw new Error('useQuiz must be used inside QuizProvider');
  return value;
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [member, setMember] = useState(false);
  const [leadToken, setLeadToken] = useState<string | null>(null);
  const [lead, setLeadState] = useState<PublicLead | null>(null);
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
  const answersRef = useRef<QuizAnswers>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storedMember = readStore<MemberSession | null>('member', null);
    // ?member=1 comes from the welcome page after a sales-page purchase.
    const isMember = params.get('member') === '1' ? Boolean(storedMember) : readStore<string | null>('mode', null) === 'member';
    if (params.get('member') === '1' && storedMember) writeStore('mode', 'member');
    const stored = readStore<QuizAnswers>('answers', {});
    answersRef.current = stored;
    setAnswers(stored);
    setMember(isMember);
    setMemberSession(storedMember);
    // A member saves to the lead made at her checkout, never an older quiz lead on this device.
    setLeadToken(isMember ? storedMember?.leadToken ?? null : readStore<string | null>('lead', null));
    setReady(true);
  }, []);

  const setAnswer = useCallback(<K extends keyof QuizAnswers>(field: K, value: QuizAnswers[K]) => {
    const next = { ...answersRef.current, [field]: value };
    answersRef.current = next;
    setAnswers(next);
    writeStore('answers', next);
  }, []);

  const setLead = useCallback((token: string | null, value: PublicLead | null) => {
    setLeadToken(token);
    setLeadState(value);
    if (token) writeStore('lead', token);
  }, []);

  const finish = useCallback(() => {
    if (member && memberSession) {
      writeStore('mode', null);
      router.push(`/style-membership/welcome?m=${encodeURIComponent(memberSession.membershipId)}&c=${encodeURIComponent(memberSession.code)}`);
    } else {
      router.push('/style-membership/result');
    }
  }, [member, memberSession, router]);

  const goNext = useCallback((fromId: string, answersOverride?: QuizAnswers) => {
    const next = nextScreenId(fromId, { answers: answersOverride ?? answersRef.current, member });
    if (next) router.push(`/style-membership/quiz/${next}`);
    else finish();
  }, [finish, member, router]);

  const goBack = useCallback((fromId: string) => {
    const previous = previousScreenId(fromId, { answers: answersRef.current, member });
    if (previous) router.push(`/style-membership/quiz/${previous}`);
    else router.push('/style-membership');
  }, [member, router]);

  const goTo = useCallback((id: string) => router.push(`/style-membership/quiz/${id}`), [router]);

  const value = useMemo<QuizState>(() => ({
    ready,
    answers,
    member,
    leadToken,
    lead,
    memberSession,
    context: { answers, member },
    setAnswer,
    setLead,
    goNext,
    goBack,
    goTo,
    finish,
  }), [answers, finish, goBack, goNext, goTo, lead, leadToken, member, memberSession, ready, setAnswer, setLead]);

  return <QuizStateContext.Provider value={value}>{children}</QuizStateContext.Provider>;
}
