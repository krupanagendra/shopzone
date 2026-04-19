import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp, FaVolumeMute, FaHeadphones, FaSpinner, FaCrown } from "react-icons/fa";

const API_CATEGORIES = [
  { name: "Chill Lo-Fi", term: "lofi hip hop" },
  { name: "Top Pop", term: "pop hits" },
  { name: "Workout", term: "workout edm" },
  { name: "Acoustic", term: "acoustic chill" }
];

export default function MusicPage() {
  const { userInfo } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  // 1. ALL HOOKS AT THE TOP (Fixes React "fewer hooks" crash)
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // API Data States
  const [activeCategory, setActiveCategory] = useState(API_CATEGORIES[0]);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [errorFetching, setErrorFetching] = useState(false);

  // Player States
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);

  // 2. Auth Access Check
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("userInfo") || "{}").token || "";
        const r = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/prime/status", {
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }
        });
        const d = await r.json();
        const access = d.isPremium || ["silver", "gold", "platinum"].includes(d.eligibleTier);
        setHasAccess(access);
      } catch (e) {
        setHasAccess(!!userInfo?.isPremium);
      } finally {
        setLoadingAccess(false);
      }
    };
    checkAccess();
  }, [userInfo]);

  // 3. iTunes API Fetch
  useEffect(() => {
    if (!hasAccess) return; // Only fetch if they have access

    const fetchTracks = async () => {
      setLoadingTracks(true);
      setErrorFetching(false);
      try {
        // iTunes Search API - 100% Free, NO API KEY, gives 30s previews and artwork.
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(activeCategory.term)}&limit=25&entity=song&media=music`);
        const data = await res.json();
        
        const formattedTracks = data.results
          .filter(t => t.previewUrl) // only tracks with valid audio
          .map(t => ({
            id: t.trackId,
            title: t.trackName,
            artist: t.artistName,
            cover: t.artworkUrl100 ? t.artworkUrl100.replace('100x100', '300x300') : "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&fit=crop",
            url: t.previewUrl,
            duration: 30 // iTunes previews are exactly 30 seconds
          }));
          
        setTracks(formattedTracks);
        setCurrentTrackIndex(0);
        setIsPlaying(false);
        setProgress(0);
      } catch (err) {
        console.error("API error", err);
        setErrorFetching(true);
      } finally {
        setLoadingTracks(false);
      }
    };

    fetchTracks();
  }, [activeCategory, hasAccess]);

  // 4. Player control hooks
  useEffect(() => {
    if (isPlaying && audioRef.current && tracks.length > 0) {
      audioRef.current.play().catch(e => {
         console.warn("Autoplay prevented or stream error", e);
         setIsPlaying(false);
      });
    }
  }, [currentTrackIndex, activeCategory, tracks]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Early Returns happen safely AFTER all hooks
  if (loadingAccess) {
    return <div className="min-h-screen bg-gray-900 flex flex-col gap-4 items-center justify-center p-4 text-xl font-bold text-amazon-yellow"><FaSpinner className="animate-spin text-4xl" /> <p>Loading OmniKart Music...</p></div>;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-10 text-center border border-gray-100">
          <div className="w-24 h-24 bg-amazon-yellow bg-opacity-20 flex items-center justify-center rounded-full mx-auto mb-6 shadow-inner">
            <FaCrown className="text-5xl text-amazon-yellow drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Prime Music Exclusives</h1>
          <p className="text-gray-600 mb-8 font-medium text-lg leading-relaxed">
            Listen to curated premium tracks and endless vibes directly from the Global Top Charts! Upgrade to OmniKart Prime to unlock the ultimate premium experience.
          </p>
          <Link to="/prime" className="w-full inline-block bg-gradient-to-r from-amazon-yellow to-amazon-orange text-black font-extrabold py-4 px-8 rounded-xl shadow-lg hover:scale-105 transition-all mb-4 text-lg">
            Unlock Prime Membership
          </Link>
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 font-bold text-sm">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex] || null;

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(console.error);
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;
    const currentTime = audioRef.current.currentTime;
    if (duration > 0) setProgress((currentTime / duration) * 100);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = seekTime;
    setProgress(e.target.value);
  };

  const selectTrack = (index) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-900 text-white flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amazon-orange rounded-full mix-blend-screen filter blur-[150px] opacity-[0.25] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amazon-blue rounded-full mix-blend-screen filter blur-[150px] opacity-[0.3] pointer-events-none" />

      {/* Sidebar */}
      <div className="w-full md:w-64 bg-black bg-opacity-50 border-r border-gray-800 flex flex-col p-6 z-10 backdrop-blur-xl">
        <h2 className="text-2xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amazon-yellow to-white tracking-widest uppercase flex items-center gap-2">
          <FaHeadphones className="text-amazon-yellow" /> Prime Music
        </h2>
        
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Discover Top Hits</h3>
        <ul className="space-y-2 flex-1">
          {API_CATEGORIES.map((cat) => (
            <li key={cat.name}>
              <button
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                  activeCategory.name === cat.name 
                    ? "bg-gradient-to-r from-amazon-orange/20 to-transparent border-l-4 border-amazon-yellow text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
        
        <div className="mt-8 p-4 bg-gray-800 bg-opacity-50 rounded-2xl border border-gray-700">
          <p className="text-xs text-amazon-yellow font-bold uppercase tracking-widest mb-1">Global API</p>
          <p className="text-xs text-gray-300">Powered by Apple iTunes Global Charts.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-28 z-10 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar relative">
        {/* Header Banner */}
        <div className="p-8 md:p-12 pb-6 border-b border-gray-800 bg-gradient-to-b from-gray-800/40 to-transparent sticky top-0 z-20 backdrop-blur-md">
          <p className="text-sm font-bold text-amazon-yellow uppercase tracking-widest mb-2">Live Radio</p>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">{activeCategory.name}</h1>
          <p className="text-gray-400 mt-3 font-semibold text-lg">{tracks.length > 0 ? `${tracks.length} Trending Previews` : 'Fetching trends...'}</p>
          
          {tracks.length > 0 && (
            <button 
              onClick={() => { selectTrack(0); setIsPlaying(true); }}
              className="mt-8 bg-amazon-yellow hover:bg-amazon-orange text-black font-black w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-[0_0_30px_rgba(254,189,105,0.4)] hover:scale-105 transition-transform"
            >
              <FaPlay className="ml-1" />
            </button>
          )}
        </div>

        {/* Tracklist */}
        <div className="p-6 md:p-10">
          {loadingTracks ? (
            <div className="flex flex-col items-center justify-center h-48 text-amazon-yellow">
              <FaSpinner className="animate-spin text-5xl mb-4" />
              <p className="font-bold tracking-widest uppercase">Connecting to global API...</p>
            </div>
          ) : errorFetching ? (
            <div className="text-center p-8 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-400 font-bold">
              Unable to load tracks. Please try another category or check your connection.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-2 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                <span className="w-8 text-center">#</span>
                <span>Title</span>
              </div>
              
              <ul className="space-y-1">
                {tracks.map((track, idx) => (
                  <li 
                    key={track.id + idx} 
                    onClick={() => selectTrack(idx)}
                    className={`grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-4 items-center p-3 rounded-xl cursor-pointer transition-colors group ${
                      currentTrackIndex === idx ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="w-8 flex items-center justify-center text-gray-500 font-bold group-hover:text-white">
                      {currentTrackIndex === idx && isPlaying ? (
                        <div className="flex gap-1 items-end h-4">
                          <div className="w-1 bg-amazon-yellow h-4 animate-bounce" style={{ animationDelay: "0s" }} />
                          <div className="w-1 bg-amazon-yellow h-2 animate-bounce" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1 bg-amazon-yellow h-3 animate-bounce" style={{ animationDelay: "0.4s" }} />
                        </div>
                      ) : (idx + 1)}
                    </div>
                    
                    <div className="flex items-center gap-4 border-r border-transparent md:border-gray-800 pr-4">
                      <img src={track.cover} alt="cover" className="w-12 h-12 rounded-lg shadow-md object-cover" />
                      <div>
                        <p className={`font-bold text-lg leading-tight truncate max-w-xs sm:max-w-md ${currentTrackIndex === idx ? "text-amazon-yellow" : "text-white"}`}>{track.title}</p>
                        <p className="text-sm text-gray-400 font-medium truncate max-w-xs">{track.artist}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Hidden Audio Element */}
      {currentTrack && (
        <audio 
          ref={audioRef} 
          src={currentTrack.url} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext} 
        />
      )}

      {/* Player Bar (Bottom) */}
      {currentTrack && (
        <div className="absolute bottom-0 left-0 w-full h-24 bg-[#18212f]/90 backdrop-blur-3xl border-t border-gray-800 flex items-center justify-between px-6 md:px-12 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          
          {/* Track Info */}
          <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
            <img src={currentTrack.cover} alt="cover" className="w-14 h-14 object-cover rounded-lg shadow-xl border border-gray-700" />
            <div className="hidden sm:block truncate pr-2">
              <h4 className="text-white font-bold leading-tight truncate">{currentTrack.title}</h4>
              <p className="text-xs text-gray-400 font-medium truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
            <div className="flex items-center gap-6 mb-2">
              <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors">
                <FaStepBackward className="text-lg" />
              </button>
              <button 
                onClick={togglePlay} 
                className="bg-amazon-yellow text-black w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(254,189,105,0.3)]"
              >
                {isPlaying ? <FaPause className="text-lg" /> : <FaPlay className="text-lg ml-1" />}
              </button>
              <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors">
                <FaStepForward className="text-lg" />
              </button>
            </div>
            
            <div className="w-full flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500 w-10 text-right">
                {audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + String(Math.floor(audioRef.current.currentTime % 60)).padStart(2, '0') : "0:00"}
              </span>
              <input 
                type="range" min="0" max="100" value={progress || 0} onChange={handleSeek}
                className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amazon-yellow [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:w-4 hover:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:transition-all"
              />
              <span className="text-xs font-mono text-gray-500 w-10">
                {audioRef.current?.duration ? Math.floor(audioRef.current.duration / 60) + ":" + String(Math.floor(audioRef.current.duration % 60)).padStart(2, '0') : "0:30"}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-3 w-1/4 justify-end">
            <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input 
              type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(e.target.value); setIsMuted(false); }}
              className="w-24 h-1.5 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
            />
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
