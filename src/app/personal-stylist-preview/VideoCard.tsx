'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Pause, Play, Star, Volume2, VolumeX } from 'lucide-react';
import s from './membership.module.css';

export interface TestimonialVideo {
  src: string;
  poster: string;
  name: string;
  rating: number;
  quote: string;
  faceBlur?: Pick<CSSProperties, 'left' | 'top' | 'width' | 'height'>;
}

export default function VideoCard({ video, number }: { video: TestimonialVideo; number: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  const togglePlayback = () => {
    const element = ref.current;
    if (!element) return;
    if (element.paused) void element.play();
    else element.pause();
  };

  const toggleMute = () => {
    const element = ref.current;
    if (!element) return;
    element.muted = !element.muted;
    setIsMuted(element.muted);
  };

  return (
    <figure className={s.videoCard}>
      <div className={s.videoWrap}>
        <video
          ref={ref}
          className={s.video}
          playsInline
          preload="metadata"
          poster={video.poster}
          disablePictureInPicture
          aria-label={`ICONIK client testimonial video ${number}`}
          onClick={togglePlayback}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={video.src} type="video/mp4" />
        </video>
        {video.faceBlur && <div aria-hidden="true" className={s.faceBlur} style={video.faceBlur} />}
        <div className={s.videoControls}>
          <button type="button" className={s.roundBtn} onClick={togglePlayback} aria-label={`${isPlaying ? 'Pause' : 'Play'} testimonial video ${number}`}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          <button type="button" className={`${s.roundBtn} ${s.roundBtnGhost}`} onClick={toggleMute} aria-label={`${isMuted ? 'Unmute' : 'Mute'} testimonial video ${number}`}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>
      <figcaption className={s.videoCaption}>
        <div className={s.stars} aria-label={`${video.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} size={15} fill={star <= video.rating ? 'currentColor' : 'transparent'} strokeWidth={star <= video.rating ? 0 : 1.5} />
          ))}
        </div>
        <div className={s.videoName}>{video.name} · ICONIK Client</div>
        <blockquote className={s.videoQuote}>“{video.quote}”</blockquote>
      </figcaption>
    </figure>
  );
}
