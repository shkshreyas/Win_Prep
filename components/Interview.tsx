"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  Brain,
  Zap,
  Eye,
  BarChart3,
  Download,
  MessageSquare,
  Sparkles,
  Activity,
  Calendar,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  confidence?: number;
}

interface InterviewProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  questions?: string[];
  roomToken?: string; // LiveKit room token
  serverUrl?: string; // LiveKit server URL
}

// Mock LiveKit classes for demo (replace with actual imports)
class Room {
  participants: Map<string, any>;
  localParticipant: LocalParticipant;
  isConnected: boolean;

  constructor() {
    this.participants = new Map();
    this.localParticipant = new LocalParticipant();
    this.isConnected = false;
  }

  async connect(url: string, token: string) {
    console.log("Connecting to LiveKit room...", { url, token });
    this.isConnected = true;
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.localParticipant.videoTrack) {
      this.localParticipant.videoTrack.stop();
    }
    if (this.localParticipant.audioTrack) {
      this.localParticipant.audioTrack.stop();
    }
    console.log("Disconnected from LiveKit room");
  }

  async enableCameraAndMicrophone(): Promise<{
    videoTrack?: MediaStreamTrack;
    audioTrack?: MediaStreamTrack;
  } | void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.localParticipant.videoTrack = stream.getVideoTracks()[0];
      this.localParticipant.audioTrack = stream.getAudioTracks()[0];

      return {
        videoTrack: this.localParticipant.videoTrack,
        audioTrack: this.localParticipant.audioTrack,
      };
    } catch (error) {
      console.error("Failed to enable camera and microphone:", error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream | void> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      this.localParticipant.screenTrack = stream.getVideoTracks()[0];
      return stream;
    } catch (error) {
      console.error("Failed to start screen share:", error);
      throw error;
    }
  }

  stopScreenShare(): void {
    if (this.localParticipant.screenTrack) {
      this.localParticipant.screenTrack.stop();
      this.localParticipant.screenTrack = null;
    }
  }
}

class LocalParticipant {
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  screenTrack: MediaStreamTrack | null;
  isMuted: boolean;
  isCameraEnabled: boolean;

  constructor() {
    this.videoTrack = null;
    this.audioTrack = null;
    this.screenTrack = null;
    this.isMuted = false;
    this.isCameraEnabled = true;
  }

  setMicrophoneEnabled(enabled: boolean): void {
    this.isMuted = !enabled;
    if (this.audioTrack) {
      (this.audioTrack as any).enabled = enabled;
    }
  }

  setCameraEnabled(enabled: boolean): void {
    this.isCameraEnabled = enabled;
    if (this.videoTrack) {
      (this.videoTrack as any).enabled = enabled;
    }
  }
}

export default function LiveKitInterview({
  userName,
  userId,
  interviewId,
  questions = [
    "Tell me about your greatest strengths?",
    "How do you handle challenging situations?",
    "Where do you see yourself in 5 years?",
    "Why are you interested in this role?",
  ],
  roomToken = process.env.NEXT_PUBLIC_LIVEKIT_TOKEN || "demo-token",
  serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    "wss://winprep-n1c8k21e.livekit.cloud",
}: InterviewProps) {
  // mark unused props as intentionally unused to satisfy linters
  void userId;
  void interviewId;
  // Core interview state
  const [isActive, setIsActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [interviewPhase, setInterviewPhase] = useState<
    "intro" | "background" | "main"
  >("intro");

  // LiveKit state
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState(4);
  const [participants, setParticipants] = useState(0);

  // Media state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [volume, setVolume] = useState(80);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // transcript UI removed per request; keep only interim state for logic if needed
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Analytics state
  const [nervousnessLevel, setNervousnessLevel] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(85);
  const [eyeContact, setEyeContact] = useState(92);
  const [speechPace, setSpeechPace] = useState(65);

  // Feedback state
  const [feedback, setFeedback] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  // Voice settings
  const [voiceRate, setVoiceRate] = useState(0.9);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const handleSpeechInputRef = useRef<((t: string, c?: number) => void) | null>(
    null
  );
  const endInterviewRef = useRef<(() => Promise<void>) | null>(null);
  const isActiveRef = useRef<boolean>(isActive);
  const isMutedRef = useRef<boolean>(isMuted);

  // Initialize LiveKit room
  useEffect(() => {
    // keep refs in sync with state so callbacks (recognition handlers) use latest values
    isActiveRef.current = isActive;
    isMutedRef.current = isMuted;
  }, [isActive, isMuted]);

  useEffect(() => {
    const newRoom = new Room();
    setRoom(newRoom);

    const qualityInterval = setInterval(() => {
      setConnectionQuality((prev) =>
        Math.max(1, Math.min(4, prev + (Math.random() - 0.5)))
      );
    }, 5000);

    return () => {
      clearInterval(qualityInterval);
      try {
        newRoom.disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // Initialize voice recognition
  useEffect(() => {
    // Robust initialization for SpeechRecognition + AudioContext
    let mounted = true;

    const setup = async () => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition && "speechSynthesis" in window) {
        setIsVoiceSupported(true);
        synthRef.current = window.speechSynthesis;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        // track whether recognition has actually started to avoid duplicate starts
        let hasStarted = false;

        recognition.onstart = () => {
          hasStarted = true;
          setIsListening(true);
        };

        recognition.onend = () => {
          hasStarted = false;
          setIsListening(false);
          // only auto-restart if we intend to keep listening and page is visible
          if (shouldListenRef.current && !document.hidden) {
            // small backoff to avoid rapid restarts on transient failures
            setTimeout(() => {
              if (!mounted) return;
              try {
                // guard: only start if not already started
                if (!hasStarted) recognition.start();
              } catch (e) {
                // ignore duplicate start errors
              }
            }, 400);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event && event.error);
          setIsListening(false);
          // transient errors -> attempt a restart with a slightly longer backoff
          if (shouldListenRef.current) {
            const retry = event && event.error === "no-speech" ? 900 : 1600;
            setTimeout(() => {
              if (!mounted) return;
              try {
                if (!hasStarted) recognition.start();
              } catch (e) {
                // ignore
              }
            }, retry);
          }
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;

            if (event.results[i].isFinal) {
              setTimeout(() => {
                if (transcript.trim()) {
                  handleSpeechInputRef.current?.(transcript.trim(), confidence);
                }
              }, 400);
            } else {
              interimTranscript += transcript;
            }
          }

          setInterimTranscript(interimTranscript);
        };

        recognitionRef.current = recognition;

        // Initialize audio context for voice level detection
        try {
          const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
        } catch (error) {
          console.error("Error initializing audio context:", error);
        }
      }

      // Load available voices
      if (synthRef.current) {
        const updateVoices = () => {
          const voices = synthRef.current!.getVoices();
          setAvailableVoices(voices);

          if (!selectedVoice && voices.length > 0) {
            const preferredVoice = voices.find(
              (voice) =>
                voice.name.includes("Google") ||
                voice.name.includes("Microsoft")
            );
            setSelectedVoice(preferredVoice?.name || voices[0].name);
          }
        };

        window.speechSynthesis.onvoiceschanged = updateVoices;
        updateVoices();
      }
    };

    setup();

    // visibility handler: when tab becomes visible, restart if desired
    const onVisibility = () => {
      if (
        !document.hidden &&
        shouldListenRef.current &&
        recognitionRef.current &&
        !isListening
      ) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibility);
      shouldListenRef.current = false;
      const r = recognitionRef.current;
      if (r) {
        try {
          r.stop();
        } catch (e) {
          /* ignore */
        }
        recognitionRef.current = null;
      }
    };
  }, [selectedVoice, isListening]);

  // Connect to LiveKit room
  const connectToRoom = useCallback(async () => {
    if (!room) return;

    try {
      await room.connect(serverUrl, roomToken);
      setIsConnected(true);
      setParticipants(2); // User + AI interviewer

      // Enable camera and microphone
      const media = await room.enableCameraAndMicrophone();

      // Attach video track to video element
      if (media && media.videoTrack && videoRef.current) {
        const stream = new MediaStream([media.videoTrack]);
        videoRef.current.srcObject = stream;
      }

      console.log("Successfully connected to LiveKit room");
    } catch (_error) {
      console.error("Failed to connect to room:", _error);
      setIsConnected(false);
    }
  }, [room, serverUrl, roomToken]);

  // Disconnect from LiveKit room
  const disconnectFromRoom = useCallback(async () => {
    if (!room) return;

    try {
      await room.disconnect();
      setIsConnected(false);
      setParticipants(0);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = null;
      }
    } catch (_error) {
      console.error("Failed to disconnect from room:", _error);
    }
  }, [room]);

  // Voice level monitoring
  const monitorVoiceLevel = useCallback(() => {
    if (analyserRef.current && micStreamRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        analyserRef.current!.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        setVoiceLevel(normalizedLevel);

        if (isListening) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();
    }
  }, [isListening]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isVoiceSupported || isMuted) return;

    shouldListenRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        monitorVoiceLevel();
      }

      if (recognitionRef.current && !isListening) {
        try {
          recognitionRef.current.start();
        } catch {
          // ignore already-started errors
        }
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }, [isVoiceSupported, isMuted, monitorVoiceLevel, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    // signal we don't want automatic restarts
    shouldListenRef.current = false;

    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setVoiceLevel(0);
    setIsListening(false);
  }, [isListening]);

  // Text-to-speech
  const speak = useCallback(
    async (text: string, interrupt: boolean = false) => {
      if (!synthRef.current || isMuted) return Promise.resolve();

      return new Promise<void>((resolve) => {
        if (interrupt) {
          synthRef.current!.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);

        const voices = synthRef.current!.getVoices();
        if (voices && voices.length > 0 && selectedVoice) {
          const voice = voices.find((v) => v.name === selectedVoice);
          if (voice) utterance.voice = voice;
        }

        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;
        utterance.volume = volume / 100;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };

        synthRef.current!.speak(utterance);
      });
    },
    [isMuted, volume, selectedVoice, voiceRate, voicePitch]
  );

  // Handle speech input
  const handleSpeechInput = useCallback(
    async (transcript: string, confidence: number = 0.8) => {
      if (!transcript.trim()) return;

      stopListening();

      const userMessage: Message = {
        role: "user",
        content: transcript,
        timestamp: new Date(),
        confidence: Math.floor(confidence * 100),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);

      // Mock AI response generation
      let response = "";

      if (interviewPhase === "intro") {
        setInterviewPhase("background");
        response =
          "Thank you for that introduction. Now, could you tell me about your background and experience in this field?";
      } else if (interviewPhase === "background") {
        setInterviewPhase("main");
        response = questions[0];
      } else {
        // Generate follow-up or next question
        const mockFeedback = {
          score: Math.floor(Math.random() * 30) + 70,
          feedback:
            "Your response shows good analytical thinking. Consider providing more specific examples to strengthen your answer.",
          strengths: ["Clear communication", "Structured thinking"],
          improvements: ["Add specific examples", "Show more confidence"],
        };
        setFeedback(mockFeedback);

        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          response = questions[currentQuestionIndex + 1];
        } else {
          response =
            "Thank you for completing the interview. Your responses have been analyzed and you'll receive detailed feedback shortly.";
          setTimeout(() => {
            endInterviewRef.current?.();
          }, 3000);
        }
      }

      const aiMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await speak(response, true);

      setIsProcessing(false);

      if (isActive) {
        setTimeout(startListening, 1000);
      }
    },
    [
      currentQuestionIndex,
      questions,
      speak,
      startListening,
      stopListening,
      interviewPhase,
      isActive,
    ]
  );

  // keep ref updated so recognition effect can call latest handler without requiring it as dependency
  useEffect(() => {
    handleSpeechInputRef.current = (t: string, c: number = 0.8) => {
      void handleSpeechInput(t, c);
    };
    return () => {
      handleSpeechInputRef.current = null;
    };
  }, [handleSpeechInput]);

  // Start interview
  const startInterview = useCallback(async () => {
    if (!isVoiceSupported) {
      alert(
        "Voice features are not supported in this browser. Please use Chrome or Safari."
      );
      return;
    }

    await connectToRoom();

    setIsActive(true);
    setCurrentQuestionIndex(0);
    setInterviewPhase("intro");

    const welcomeMessage = `Hello ${userName}! Welcome to your AI-powered interview session. I can see and hear you clearly. Let's start by having you introduce yourself.`;

    const welcomeMsgObj: Message = {
      role: "assistant",
      content: welcomeMessage,
      timestamp: new Date(),
    };

    setMessages([welcomeMsgObj]);
    await speak(welcomeMessage, true);

    setTimeout(startListening, 1000);
  }, [userName, speak, startListening, isVoiceSupported, connectToRoom]);

  // End interview
  const endInterview = useCallback(async () => {
    stopListening();
    await disconnectFromRoom();
    setIsActive(false);

    await speak("Interview session completed. Thank you for your time!", true);
  }, [stopListening, speak, disconnectFromRoom]);

  // expose to ref so other callbacks (which avoid having endInterview in deps) can call it
  useEffect(() => {
    endInterviewRef.current = endInterview;
    return () => {
      endInterviewRef.current = null;
    };
  }, [endInterview]);

  // Media controls
  const toggleMute = useCallback(() => {
    if (room?.localParticipant) {
      const newMuted = !isMuted;
      room.localParticipant.setMicrophoneEnabled(!newMuted);
      setIsMuted(newMuted);

      if (newMuted && isListening) {
        stopListening();
      } else if (!newMuted && isActive && !isListening && !isSpeaking) {
        startListening();
      }
    }
  }, [
    room,
    isMuted,
    isListening,
    stopListening,
    isActive,
    isSpeaking,
    startListening,
  ]);

  const toggleVideo = useCallback(() => {
    if (room?.localParticipant) {
      const newVideoState = !isVideoOn;
      room.localParticipant.setCameraEnabled(newVideoState);
      setIsVideoOn(newVideoState);
    }
  }, [room, isVideoOn]);

  const toggleScreenShare = useCallback(async () => {
    if (!room) return;

    try {
      if (isScreenSharing) {
        room.stopScreenShare();
        setIsScreenSharing(false);
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = null;
        }
      } else {
        const stream = await room.startScreenShare();
        setIsScreenSharing(true);
        if (stream && screenShareRef.current) {
          screenShareRef.current.srcObject = stream as MediaStream;
        }
      }
    } catch (_error) {
      console.error("Screen share error:", _error);
    }
  }, [room, isScreenSharing]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Timer effect
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  // Analytics simulation
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setNervousnessLevel((prev) =>
          Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10))
        );
        setConfidenceScore((prev) =>
          Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 8))
        );
        setEyeContact((prev) =>
          Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 6))
        );
        setSpeechPace((prev) =>
          Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 12))
        );
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const AnalyticsCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 hover:border-cyan-400/50 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">{value}%</span>
        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              value > 70
                ? "bg-green-400"
                : value > 50
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 ${
        isFullscreen ? "fixed inset-0 z-50 overflow-auto" : ""
      }`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-blue-400/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                WinPrep AI Interview
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <p className="text-cyan-300">
                  Real-time Video •{" "}
                  {isVoiceSupported ? "Voice Enabled" : "Voice Not Supported"}
                </p>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={isConnected ? "text-green-400" : "text-red-400"}
                  >
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">
                    {participants} participants
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="p-2 bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-gray-700/50 transition-all"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-gray-700/50 transition-all"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Call Interface */}
            <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl overflow-hidden">
              <div className="relative h-96">
                {/* Main Video Feed */}
                <div className="absolute inset-0">
                  {isVideoOn && isConnected ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-16 h-16 text-white" />
                        </div>
                        <p className="text-gray-400">
                          {!isConnected
                            ? "Not connected"
                            : !isVideoOn
                            ? "Camera disabled"
                            : "AI Interviewer"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Screen Share Overlay */}
                {isScreenSharing && (
                  <div className="absolute top-4 right-4 w-48 h-32 bg-black border-2 border-cyan-400 rounded-lg overflow-hidden">
                    <video
                      ref={screenShareRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Screen Share
                    </div>
                  </div>
                )}

                {/* Voice Activity Indicators */}
                {isListening && (
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-green-500/80 backdrop-blur-sm text-white px-3 py-2 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm">Listening</span>
                    </div>
                  </div>
                )}

                {isSpeaking && (
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-blue-500/80 backdrop-blur-sm text-white px-3 py-2 rounded-full">
                      <Activity className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">AI Speaking</span>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-yellow-500/80 backdrop-blur-sm text-white px-3 py-2 rounded-full">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Processing</span>
                    </div>
                  </div>
                )}

                {/* Connection Quality */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`w-1 h-3 rounded ${
                          isConnected && i <= connectionQuality
                            ? "bg-green-400"
                            : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Transcript removed per request */}

                {/* Voice Level Indicator */}
                {isListening && voiceLevel > 0 && (
                  <div className="absolute bottom-4 right-4">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 transition-all duration-100"
                        style={{ width: `${voiceLevel * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Control Bar */}
              <div className="bg-gray-900/90 backdrop-blur-sm p-4 border-t border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Microphone Control */}
                    <button
                      onClick={toggleMute}
                      className={`p-3 rounded-full transition-all ${
                        isMuted
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      disabled={!isVoiceSupported || !isConnected}
                    >
                      {isMuted ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>

                    {/* Video Control */}
                    <button
                      onClick={toggleVideo}
                      className={`p-3 rounded-full transition-all ${
                        !isVideoOn
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      disabled={!isConnected}
                    >
                      {isVideoOn ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <VideoOff className="w-5 h-5" />
                      )}
                    </button>

                    {/* Screen Share Control */}
                    <button
                      onClick={toggleScreenShare}
                      className={`p-3 rounded-full transition-all ${
                        isScreenSharing
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      disabled={!isConnected}
                    >
                      {isScreenSharing ? (
                        <Monitor className="w-5 h-5" />
                      ) : (
                        <MonitorOff className="w-5 h-5" />
                      )}
                    </button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 ml-4">
                      <VolumeX className="w-4 h-4 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400 min-w-[3ch]">
                        {volume}%
                      </span>
                    </div>

                    {/* Voice Level Display */}
                    {isListening && (
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-gray-400">Voice:</span>
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400 transition-all duration-100"
                            style={{ width: `${voiceLevel * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-3 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all ml-2"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Interview Controls */}
                  <div className="flex items-center gap-3">
                    {isActive && (
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          LIVE
                        </div>
                        <div className="bg-gray-800/70 text-white px-3 py-1 rounded-full">
                          {formatTime(elapsed)}
                        </div>
                      </div>
                    )}

                    {!isActive ? (
                      <button
                        onClick={startInterview}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        disabled={!isVoiceSupported}
                      >
                        <Phone className="w-5 h-5" />
                        Start Interview
                      </button>
                    ) : (
                      <button
                        onClick={endInterview}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <PhoneOff className="w-5 h-5" />
                        End Interview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-gray-900/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-purple-400">
                    Voice & Media Settings
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-white text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Voice Settings */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">
                      Voice Settings
                    </h4>

                    {/* Voice Selection */}
                    <div>
                      <label className="text-sm text-gray-300 block mb-2">
                        AI Voice
                      </label>
                      <select
                        value={selectedVoice || ""}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                      >
                        {availableVoices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rate Control */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Speech Rate</span>
                        <span>{voiceRate.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={voiceRate}
                        onChange={(e) => setVoiceRate(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Pitch Control */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Pitch</span>
                        <span>{voicePitch.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={voicePitch}
                        onChange={(e) => setVoicePitch(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Media Settings */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">
                      Media Settings
                    </h4>

                    {/* Connection Status */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">
                          LiveKit Connection
                        </span>
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${
                            isConnected
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isConnected ? "Connected" : "Disconnected"}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Quality: {connectionQuality}/4 bars
                      </div>
                    </div>

                    {/* Media Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Camera</span>
                        <span
                          className={
                            isVideoOn ? "text-green-400" : "text-red-400"
                          }
                        >
                          {isVideoOn ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Microphone</span>
                        <span
                          className={
                            !isMuted ? "text-green-400" : "text-red-400"
                          }
                        >
                          {!isMuted ? "Enabled" : "Muted"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Screen Share</span>
                        <span
                          className={
                            isScreenSharing ? "text-blue-400" : "text-gray-400"
                          }
                        >
                          {isScreenSharing ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Controls */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex gap-3">
                    <button
                      onClick={async () =>
                        await speak(
                          "This is a test of the current voice settings. Can you hear me clearly?"
                        )
                      }
                      className="flex-1 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-all flex items-center justify-center gap-3"
                      disabled={!isVoiceSupported || isSpeaking}
                    >
                      <Volume2 className="w-4 h-4" />
                      Test Voice
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Live Transcript
                  </h3>
                  {isProcessing && (
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
                  )}
                </div>
                <button
                  onClick={() => {
                    // Export transcript functionality
                    const transcript = messages
                      .map((m) => `${m.role}: ${m.content}`)
                      .join("\n");
                    const blob = new Blob([transcript], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `interview_transcript_${
                      new Date().toISOString().split("T")[0]
                    }.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-cyan-400 transition-all"
                  disabled={messages.length === 0}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Waiting for interview to begin...
                    </p>
                    {!isVoiceSupported && (
                      <p className="text-red-400 text-sm mt-2">
                        Voice features not supported in this browser. Please use
                        Chrome or Safari.
                      </p>
                    )}
                    {!isConnected && (
                      <p className="text-yellow-400 text-sm mt-2">
                        LiveKit connection required for full functionality.
                      </p>
                    )}
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          message.role === "assistant"
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                            : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                        }`}
                      >
                        <p className="text-white leading-relaxed">
                          {message.content}
                        </p>
                        {message.timestamp && (
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {message.timestamp.toLocaleTimeString()}
                            {message.confidence &&
                              ` • ${message.confidence}% confidence`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Real-time Analytics */}
            {showAnalytics && (
              <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Real-time Analytics
                </h3>
                <div className="space-y-4">
                  <AnalyticsCard
                    icon={Zap}
                    label="Confidence"
                    value={confidenceScore}
                    color="text-green-400"
                  />
                  <AnalyticsCard
                    icon={Eye}
                    label="Eye Contact"
                    value={eyeContact}
                    color="text-blue-400"
                  />
                  <AnalyticsCard
                    icon={MessageSquare}
                    label="Speech Pace"
                    value={speechPace}
                    color="text-purple-400"
                  />
                  <AnalyticsCard
                    icon={Brain}
                    label="Composure"
                    value={100 - nervousnessLevel}
                    color="text-cyan-400"
                  />

                  {/* Connection Quality */}
                  <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-gray-300">
                        Connection Quality
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">
                        {Math.round((connectionQuality / 4) * 100)}%
                      </span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-400 transition-all duration-500"
                          style={{ width: `${(connectionQuality / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interview Progress */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Questions</span>
                    <span>
                      {Math.min(currentQuestionIndex + 1, questions.length)} /{" "}
                      {questions.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (Math.min(
                            currentQuestionIndex + 1,
                            questions.length
                          ) /
                            questions.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Interview Phase */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        interviewPhase === "intro"
                          ? "bg-yellow-400"
                          : interviewPhase === "background"
                          ? "bg-blue-400"
                          : "bg-green-400"
                      }`}
                    />
                    <span className="text-sm text-gray-300">
                      Current Phase:{" "}
                      {interviewPhase === "intro"
                        ? "Introduction"
                        : interviewPhase === "background"
                        ? "Background"
                        : "Main Questions"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index < currentQuestionIndex
                            ? "bg-green-400"
                            : index === currentQuestionIndex
                            ? "bg-cyan-400 animate-pulse"
                            : "bg-gray-600"
                        }`}
                      />
                      <span
                        className={`${
                          index <= currentQuestionIndex
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        Question {index + 1}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live Status */}
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Status</span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isListening
                          ? "bg-green-400 animate-pulse"
                          : isSpeaking
                          ? "bg-blue-400 animate-pulse"
                          : isProcessing
                          ? "bg-yellow-400 animate-pulse"
                          : "bg-gray-500"
                      }`}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    {isListening
                      ? "Listening for your response..."
                      : isSpeaking
                      ? "AI is speaking..."
                      : isProcessing
                      ? "Processing your answer..."
                      : isActive
                      ? "Ready for voice input"
                      : "Interview not active"}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Feedback */}
            {feedback && (
              <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Latest Analysis
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {feedback.score}/100
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${feedback.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-gray-300 text-sm leading-relaxed">
                    {feedback.feedback}
                  </div>

                  {feedback.strengths && feedback.strengths.length > 0 && (
                    <div>
                      <p className="text-green-400 font-semibold text-sm mb-2">
                        Strengths:
                      </p>
                      <ul className="text-gray-300 text-sm space-y-1">
                        {feedback.strengths.map((strength, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.improvements &&
                    feedback.improvements.length > 0 && (
                      <div>
                        <p className="text-yellow-400 font-semibold text-sm mb-2">
                          Areas for Improvement:
                        </p>
                        <ul className="text-gray-300 text-sm space-y-1">
                          {feedback.improvements.map((improvement, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">LiveKit Connection</span>
                  <span
                    className={isConnected ? "text-green-400" : "text-red-400"}
                  >
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Voice Recognition</span>
                  <span
                    className={
                      isVoiceSupported ? "text-green-400" : "text-red-400"
                    }
                  >
                    {isVoiceSupported ? "Supported" : "Not Supported"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Media Devices</span>
                  <span
                    className={
                      isVideoOn && !isMuted
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  >
                    {isVideoOn && !isMuted ? "All Active" : "Partially Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Help & Tips */}
            {isVoiceSupported && isConnected ? (
              <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">
                  Interview Tips
                </h3>
                <div className="text-blue-300 text-sm space-y-2">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span>
                        Speak clearly and maintain eye contact with the camera
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span>
                        Wait for the AI to finish speaking before responding
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span>
                        Use the screen share feature to present your work
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span>Check your connection quality regularly</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">
                  System Requirements
                </h3>
                <div className="text-red-300 text-sm space-y-2">
                  {!isVoiceSupported && (
                    <div>
                      <p className="font-semibold mb-2">
                        Voice Recognition Required:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                        <li>Google Chrome (latest version)</li>
                        <li>Safari (macOS/iOS)</li>
                        <li>Microsoft Edge (latest version)</li>
                      </ul>
                    </div>
                  )}
                  {!isConnected && (
                    <div className="mt-3">
                      <p className="font-semibold mb-2">
                        LiveKit Connection Required:
                      </p>
                      <p className="text-xs">
                        Please check your server URL and token configuration.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
