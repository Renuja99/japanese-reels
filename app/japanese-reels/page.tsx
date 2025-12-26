'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Upload } from 'lucide-react';
import { Reel, UploadResponse, GetAudioResponse } from '../types/reel';

export default function JapaneseReels() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [reels, setReels] = useState<Reel[]>([
    {
      id: 1,
      text: "航空機のすべてのエンジンの停止が確認され、機材装着OKのサインが出ると、機材と係員が一斉に航空機に近づいて行く",
      translation: "Once all aircraft engines are confirmed to be stopped and the equipment attachment OK sign is given, equipment and personnel approach the aircraft all at once.",
      audio: null
    },
    {
      id: 2,
      text: "毎日日本語を勉強すれば、必ず上達します",
      translation: "If you study Japanese every day, you will definitely improve.",
      audio: null
    },
    {
      id: 3,
      text: "桜の花が咲く季節は、日本で最も美しい時期の一つです",
      translation: "The season when cherry blossoms bloom is one of the most beautiful times in Japan.",
      audio: null
    },
    {
      id: 4,
      text: "新しい言語を学ぶことは、新しい世界への扉を開くことです",
      translation: "Learning a new language is opening a door to a new world.",
      audio: null
    },
    {
      id: 5,
      text: "努力は必ず報われる時が来ます",
      translation: "The time when effort is rewarded will surely come.",
      audio: null
    }
  ]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  // Load existing audio files from server on mount
  useEffect(() => {
    const loadExistingAudio = async () => {
      setLoading(true);
      try {
        // Fetch all audio files from the server
        const response = await fetch('/api/get-audio');
        const data: GetAudioResponse = await response.json();

        if (data.success && data.files) {
          // Update reels with existing audio files
          const newReels = [...reels];
          
          data.files.forEach(file => {
            const reelIndex = newReels.findIndex(r => r.id.toString() === file.reelId);
            if (reelIndex !== -1 && !newReels[reelIndex].audio) {
              // Only set if no audio is already set (take the newest one)
              newReels[reelIndex].audio = file.url;
            }
          });

          setReels(newReels);
          console.log('Loaded audio files:', data.files);
        }
      } catch (error) {
        console.error('Failed to load existing audio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY > 0 && currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length]);

  // Navigation functions
  const goToNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Auto-play audio when reel changes
  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      if (reels[currentIndex].audio && !isMuted) {
        setTimeout(() => {
          audioRef.current?.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.log('Auto-play failed:', err));
        }, 100);
      }
    }
  }, [currentIndex, isMuted, reels]);

  const togglePlayPause = () => {
    if (!audioRef.current || !reels[currentIndex].audio) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log('Play failed:', err));
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current && isPlaying) {
      audioRef.current.muted = !isMuted;
    }
  };

  // Upload file to API and save to public folder
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio')) {
      alert('Please select a valid audio file');
      return;
    }

    setUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('reelId', reels[index].id.toString());

      // Upload to API
      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (data.success && data.url) {
        // Update reels with the public URL
        const newReels = [...reels];
        newReels[index].audio = data.url;
        setReels(newReels);

        // Play the audio if on current reel
        if (index === currentIndex) {
          setTimeout(() => {
            if (audioRef.current && data.url) {
              audioRef.current.src = data.url;
              audioRef.current.load();
              if (!isMuted) {
                audioRef.current.play()
                  .then(() => setIsPlaying(true))
                  .catch(err => console.log('Audio play failed:', err));
              }
            }
          }, 100);
        }

        alert('Audio uploaded successfully!');
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading audio files...</p>
          </div>
        </div>
      )}

      {/* Progress indicators */}
      <div className="absolute top-4 left-0 right-0 z-20 flex justify-center gap-1 px-4">
        {reels.map((_, idx) => (
          <div
            key={idx}
            className={`h-0.5 flex-1 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-16 right-4 z-20 bg-black/50 p-3 rounded-full text-white hover:bg-black/70 transition"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-4 rounded-full text-white hover:bg-black/70 transition transform hover:scale-110"
          aria-label="Previous reel"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {currentIndex < reels.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 p-4 rounded-full text-white hover:bg-black/70 transition transform hover:scale-110"
          aria-label="Next reel"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {/* Reels container */}
      <div
        ref={containerRef}
        className="h-full w-full flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={handleWheel}
      >
        {reels.map((reel, idx) => (
          <div
            key={reel.id}
            className="h-screen w-screen flex-shrink-0 flex items-center justify-center p-8 relative"
            style={{
              background: `linear-gradient(${135 + idx * 30}deg, #667eea 0%, #764ba2 100%)`
            }}
          >
            <div className="max-w-2xl w-full">
              {/* Japanese text */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6">
                <p className="text-white text-3xl md:text-4xl font-bold leading-relaxed text-center mb-6">
                  {reel.text}
                </p>
                <p className="text-white/80 text-lg md:text-xl text-center">
                  {reel.translation}
                </p>
              </div>

              {/* Audio controls */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-4">
                {reel.audio ? (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={togglePlayPause}
                      className="bg-white text-purple-600 p-4 rounded-full hover:bg-gray-100 transition-all transform hover:scale-110 disabled:opacity-50"
                      disabled={uploading}
                      aria-label={isPlaying && idx === currentIndex ? 'Pause' : 'Play'}
                    >
                      {isPlaying && idx === currentIndex ? (
                        <Pause size={32} fill="currentColor" />
                      ) : (
                        <Play size={32} fill="currentColor" />
                      )}
                    </button>
                    <div className="flex-1 text-white text-center">
                      <p className="text-sm font-semibold">Audio Ready</p>
                      <p className="text-xs text-white/60">
                        {isPlaying && idx === currentIndex ? 'Playing...' : 'Tap play button'}
                      </p>
                    </div>
                    <label className={`bg-white/20 p-3 rounded-full cursor-pointer hover:bg-white/30 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload size={24} className="text-white" />
                      <input
                        type="file"
                        accept="audio/mp3,audio/mpeg,audio/*"
                        onChange={(e) => handleAudioUpload(e, idx)}
                        className="hidden"
                        disabled={uploading}
                        aria-label="Replace audio"
                      />
                    </label>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center cursor-pointer hover:bg-white/5 transition rounded-xl p-4 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="text-white mb-2" size={32} />
                    <span className="text-white text-sm mb-2 font-semibold">
                      {uploading ? 'Uploading...' : 'Upload Audio (MP3)'}
                    </span>
                    <input
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/*"
                      onChange={(e) => handleAudioUpload(e, idx)}
                      className="hidden"
                      disabled={uploading}
                      aria-label="Upload audio"
                    />
                    <span className="text-white/60 text-xs">
                      {uploading ? 'Please wait...' : 'Tap to select file'}
                    </span>
                  </label>
                )}
              </div>

              {/* Audio element */}
              <audio
                ref={idx === currentIndex ? audioRef : null}
                src={reel.audio || 'no audio'}
                muted={isMuted}
                onEnded={handleAudioEnded}
                className="hidden"
              />

              {/* Swipe indicator */}
              <div className="text-center mt-8 text-white/60 text-sm">
                Swipe left/right, use arrow keys, or click arrows to navigate
              </div>
            </div>

            {/* Reel number */}
            <div className="absolute bottom-8 right-8 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
              {idx + 1} / {reels.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}