import InstagramReelFeature from "@/components/seo/InstagramReelFeature";
import { featuredInstagramReels } from "@/lib/instagramReels";

export default function InstagramReelsForArticle({
  articlePath,
}: {
  articlePath: `/${string}`;
}) {
  const reels = featuredInstagramReels.filter((reel) => reel.articlePath === articlePath);

  if (reels.length === 0) return null;

  return (
    <section className="seo-reel-stack" aria-label="Related videos from Iconik">
      {reels.map((reel) => (
        <InstagramReelFeature
          key={reel.slug}
          permalink={reel.permalink}
          title={reel.title}
          summary={reel.summary}
          takeaways={reel.takeaways}
          transcript={reel.transcript}
          relatedGuide={reel.relatedGuide}
        />
      ))}
    </section>
  );
}
