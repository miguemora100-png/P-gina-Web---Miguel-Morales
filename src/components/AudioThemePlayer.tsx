import React, { useState, useEffect, useRef } from "react";

interface AudioThemePlayerProps {
  language?: "es" | "en";
  isExternalMediaPlaying?: boolean;
}

const TEDDY_SWIMS_INFO = {
  title: "Lose Control",
  artist: "Teddy Swims",
  youtubeVideoId: "GZ3zL7kT6_c", // Teddy Swims - Lose Control (Live)
  fallbackAudioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9f/65/d6/9f65d67d-db40-d7da-c954-9a23d28dfe1a/mzaf_7625794503195542708.plus.aac.p.m4a",
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Invisible Background Audio Component for Teddy Swims - Lose Control.
 * Plays automatically when visitors enter and interact with the page,
 * without rendering any visible player UI on the screen.
 */
export const AudioThemePlayer: React.FC<AudioThemePlayerProps> = ({
  isExternalMediaPlaying = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [useFallbackAudio, setUseFallbackAudio] = useState<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

  const ytPlayerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforeExternalRef = useRef<boolean>(false);

  // Initialize YouTube Iframe API invisibly
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      try {
        if (window.YT && window.YT.Player) {
          ytPlayerRef.current = new window.YT.Player("invisible-yt-audio-container", {
            height: "200",
            width: "200",
            videoId: TEDDY_SWIMS_INFO.youtubeVideoId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              loop: 1,
              playlist: TEDDY_SWIMS_INFO.youtubeVideoId,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
            events: {
              onReady: (event: any) => {
                setIsPlayerReady(true);
                event.target.setVolume(80);
                // Attempt immediate play
                try {
                  event.target.playVideo();
                } catch {
                  // Handled by interaction listener
                }
              },
              onStateChange: (event: any) => {
                // 1: PLAYING, 2: PAUSED, 0: ENDED
                if (event.data === 1) {
                  setIsPlaying(true);
                } else if (event.data === 2) {
                  setIsPlaying(false);
                } else if (event.data === 0) {
                  // Loop track
                  event.target.playVideo();
                }
              },
              onError: () => {
                setUseFallbackAudio(true);
              },
            },
          });
        }
      } catch {
        setUseFallbackAudio(true);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === "function") {
          ytPlayerRef.current.destroy();
        }
      } catch {
        // Ignore cleanup
      }
    };
  }, []);

  // Handle external media (pause background audio if user opens a booktrailer)
  useEffect(() => {
    if (isExternalMediaPlaying) {
      if (isPlaying) {
        wasPlayingBeforeExternalRef.current = true;
        pausePlayback();
      }
    } else if (wasPlayingBeforeExternalRef.current) {
      wasPlayingBeforeExternalRef.current = false;
      startPlayback();
    }
  }, [isExternalMediaPlaying]);

  // Autoplay trigger on user's first interaction with the document (browser autoplay compliance)
  useEffect(() => {
    const startOnInteraction = () => {
      startPlayback();
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener("pointerdown", startOnInteraction);
      window.removeEventListener("click", startOnInteraction);
      window.removeEventListener("keydown", startOnInteraction);
      window.removeEventListener("touchstart", startOnInteraction);
      window.removeEventListener("scroll", startOnInteraction);
      window.removeEventListener("wheel", startOnInteraction);
    };

    window.addEventListener("pointerdown", startOnInteraction, { once: true });
    window.addEventListener("click", startOnInteraction, { once: true });
    window.addEventListener("keydown", startOnInteraction, { once: true });
    window.addEventListener("touchstart", startOnInteraction, { once: true });
    window.addEventListener("scroll", startOnInteraction, { once: true });
    window.addEventListener("wheel", startOnInteraction, { once: true });

    // Also attempt immediate playback right away in case browser allows it
    startPlayback();

    return () => {
      removeListeners();
    };
  }, [isPlayerReady, useFallbackAudio]);

  const startPlayback = () => {
    if (useFallbackAudio) {
      if (audioRef.current) {
        audioRef.current.volume = 0.8;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Will play on next user gesture
        });
      }
      return;
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
      try {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(80);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch {
        setUseFallbackAudio(true);
      }
    } else if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const pausePlayback = () => {
    if (useFallbackAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {
        // Fallback
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  return (
    <div 
      aria-hidden="true" 
      className="fixed -left-[9999px] -top-[9999px] w-[200px] h-[200px] pointer-events-none opacity-0 overflow-hidden select-none"
    >
      {/* Invisible YouTube Iframe Player */}
      <div id="invisible-yt-audio-container" />

      {/* Invisible HTML5 Audio fallback element */}
      <audio
        ref={audioRef}
        src={TEDDY_SWIMS_INFO.fallbackAudioUrl}
        loop
        preload="auto"
      />
    </div>
  );
};
