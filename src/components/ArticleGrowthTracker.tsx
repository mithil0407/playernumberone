"use client";

import { useEffect, useRef } from "react";
import Link, { type LinkProps } from "next/link";
import {
  trackGrowthEvent,
  type GrowthEventParameters,
} from "@/lib/growthAnalytics";

type ArticleGrowthTrackerProps = GrowthEventParameters & {
  article_id: string;
  content_cluster: string;
  audience: "women" | "men";
};

export function ArticleGrowthTracker(props: ArticleGrowthTrackerProps) {
  useEffect(() => {
    trackGrowthEvent("article_view", props);
  }, [props]);
  return null;
}

type TrackedArticleLinkProps = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    tracking: ArticleGrowthTrackerProps;
  };

export function TrackedArticleLink({ tracking, onClick, children, ...props }: TrackedArticleLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackGrowthEvent("article_quiz_cta_click", tracking);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}

export function TrackedConsultationLink({ tracking, onClick, children, ...props }: TrackedArticleLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackGrowthEvent("consultation_cta_click", tracking);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}

export function TrackedArticleCtaView({ tracking }: { tracking: ArticleGrowthTrackerProps }) {
  const ref = useRef<HTMLSpanElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || tracked.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || tracked.current) return;
        tracked.current = true;
        trackGrowthEvent("article_quiz_cta_view", tracking);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [tracking]);

  return <span ref={ref} className="sr-only" aria-hidden="true" />;
}
