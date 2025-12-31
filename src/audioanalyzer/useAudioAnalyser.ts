/**
 * Audio Analyser Hook
 *
 * Provides real-time audio analysis from browser microphone including:
 * - FFT frequency data
 * - Beat detection with BPM
 * - Build-up detection
 * - Energy levels (bass, mid, high)
 * - Note/Key detection via chroma
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Meyda from "meyda";
import { BPMDetector, BPMResult } from "./BPMDetector";
import { BuildUpDetector, BuildUpState } from "./BuildUpDetector";

// Note names for chroma
const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export interface AudioAnalyserData {
  // Frequency data (0-255 values for each frequency bin)
  frequencyData: Uint8Array;
  // Normalized frequency data (0-1)
  normalizedFrequency: Float32Array;
  // Time domain waveform data
  waveformData: Uint8Array;

  // Energy levels
  bass: number; // 20-250 Hz
  mid: number; // 250-4000 Hz
  high: number; // 4000-20000 Hz
  overall: number; // Overall energy (RMS)

  // Beat detection
  isBeat: boolean;
  beatIntensity: number;
  beatPhase: number; // 0-1 position in beat cycle

  // BPM
  bpm: number;
  confidence: number;

  // Peak detection
  isPeak: boolean;
  peakIntensity: number;

  // Advanced Features (Meyda)
  spectralCentroid: number; // Brightness
  spectralFlatness: number; // Noisiness
  spectralFlux: number; // Rate of spectral change
  spectralRolloff: number; // Frequency cutoff point

  // Note/Key detection
  dominantNote: string; // e.g., 'C', 'F#'
  chroma: number[]; // 12-bin pitch class profile
  noteConfidence: number; // How strong the dominant note is

  // Build-up Detection
  isBuildUp: boolean;
  buildUpConfidence: number;
  buildUpPhase: BuildUpState["phase"];
  beatsToImpact: number;

  // Derived Audio Metrics
  energy: number; // 0-1, overall perceived energy (loudness + tempo + spectral complexity)
  valence: number; // 0-1, musical positiveness (major key, brightness, tempo)
  mood: "chill" | "ambient" | "upbeat" | "driving" | "intense" | "unknown"; // Simplified genre/mood
}

export interface AudioAnalyserConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  beatThreshold?: number;
  beatDecay?: number;
  bpmMin?: number;
  bpmMax?: number;
}

const DEFAULT_CONFIG: Required<AudioAnalyserConfig> = {
  fftSize: 4096, // Increased from 2048 for better frequency resolution
  smoothingTimeConstant: 0.5, // Slightly smoother (was 0.4)
  minDecibels: -90,
  maxDecibels: -10,
  beatThreshold: 0.15, // Lowered from 0.4 to match BPMDetector tuning
  beatDecay: 0.95,
  bpmMin: 60,
  bpmMax: 200,
};

/**
 * Get dominant note from chroma array
 */
function getDominantNote(chroma: number[]): {
  note: string;
  confidence: number;
} {
  if (!chroma || chroma.length !== 12) {
    return { note: "-", confidence: 0 };
  }

  let maxIndex = 0;
  let maxValue = chroma[0];
  let totalEnergy = 0;

  for (let i = 0; i < 12; i++) {
    totalEnergy += chroma[i];
    if (chroma[i] > maxValue) {
      maxValue = chroma[i];
      maxIndex = i;
    }
  }

  const confidence = totalEnergy > 0 ? maxValue / totalEnergy : 0;
  return {
    note: NOTE_NAMES[maxIndex],
    confidence: Math.min(confidence * 2, 1), // Scale up for visibility
  };
}

/**
 * Detect if the current chroma suggests major or minor key
 * Major keys have stronger 3rd (4 semitones) vs minor 3rd (3 semitones)
 */
function detectMajorMinor(
  chroma: number[],
  rootIndex: number
): { isMajor: boolean; confidence: number } {
  if (!chroma || chroma.length !== 12) {
    return { isMajor: true, confidence: 0 };
  }

  const major3rdIndex = (rootIndex + 4) % 12;
  const minor3rdIndex = (rootIndex + 3) % 12;
  const major3rd = chroma[major3rdIndex] || 0;
  const minor3rd = chroma[minor3rdIndex] || 0;

  const diff = major3rd - minor3rd;
  const total = major3rd + minor3rd;
  const confidence = total > 0 ? Math.abs(diff) / total : 0;

  return {
    isMajor: diff >= 0,
    confidence: Math.min(confidence, 1),
  };
}

/**
 * Calculate energy metric (0-1)
 * Combines loudness, tempo, spectral flux, and bass intensity
 */
function calculateEnergy(
  overall: number,
  bass: number,
  spectralFlux: number,
  bpm: number,
  bpmConfidence: number
): number {
  // Normalize BPM to 0-1 (60-180 BPM range)
  const normalizedBpm = Math.max(0, Math.min(1, (bpm - 60) / 120));

  // Weight factors
  const loudnessWeight = 0.35;
  const bassWeight = 0.25;
  const fluxWeight = 0.2;
  const tempoWeight = 0.2;

  // Only factor in BPM if we have confidence
  const tempoContrib = bpmConfidence > 0.3 ? normalizedBpm * tempoWeight : 0;
  const remainingWeight = bpmConfidence > 0.3 ? 1 : 1 + tempoWeight;

  const energy =
    (overall * loudnessWeight +
      bass * bassWeight +
      Math.min(spectralFlux * 10, 1) * fluxWeight +
      tempoContrib) *
    (bpmConfidence > 0.3 ? 1 : remainingWeight / (1 - tempoWeight));

  return Math.max(0, Math.min(1, energy));
}

/**
 * Calculate valence metric (0-1)
 * Higher = more positive/happy sounding
 * Based on: major/minor key, tempo, spectral brightness
 */
function calculateValence(
  chroma: number[],
  dominantNoteIndex: number,
  spectralCentroid: number,
  bpm: number,
  bpmConfidence: number
): number {
  // Major key adds positivity
  const { isMajor, confidence: keyConfidence } = detectMajorMinor(
    chroma,
    dominantNoteIndex
  );
  const keyContrib = isMajor
    ? 0.6 + keyConfidence * 0.2
    : 0.4 - keyConfidence * 0.2;

  // Faster tempo = more positive (normalize 60-180 BPM)
  const tempoContrib =
    bpmConfidence > 0.3 ? Math.max(0, Math.min(1, (bpm - 60) / 120)) : 0.5;

  // Higher spectral centroid (brighter) = more positive
  // Normalize centroid (typical range 1000-8000 Hz)
  const brightnessContrib = Math.max(
    0,
    Math.min(1, (spectralCentroid - 1000) / 7000)
  );

  // Weighted combination
  const valence =
    keyContrib * 0.4 + tempoContrib * 0.3 + brightnessContrib * 0.3;

  return Math.max(0, Math.min(1, valence));
}

/**
 * Determine mood/genre based on energy and valence
 */
function determineMood(
  energy: number,
  valence: number,
  spectralFlatness: number
): "chill" | "ambient" | "upbeat" | "driving" | "intense" | "unknown" {
  // High noisiness suggests ambient/atmospheric
  const isAtmospheric = spectralFlatness > 0.3;

  if (energy < 0.3) {
    return isAtmospheric ? "ambient" : "chill";
  } else if (energy < 0.6) {
    return valence > 0.5 ? "upbeat" : "driving";
  } else {
    return valence > 0.5 ? "upbeat" : "intense";
  }
}

// Stable empty config to avoid recreating object on each render
const EMPTY_CONFIG: AudioAnalyserConfig = {};

export function useAudioAnalyser(config: AudioAnalyserConfig = EMPTY_CONFIG) {
  // Use individual properties to avoid infinite loops from object reference changes
  const cfg = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [
      config.fftSize,
      config.smoothingTimeConstant,
      config.minDecibels,
      config.maxDecibels,
      config.beatThreshold,
      config.beatDecay,
      config.bpmMin,
      config.bpmMax,
    ]
  );

  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AudioAnalyserData>({
    frequencyData: new Uint8Array(0),
    normalizedFrequency: new Float32Array(0),
    waveformData: new Uint8Array(0),
    bass: 0,
    mid: 0,
    high: 0,
    overall: 0,
    isBeat: false,
    beatIntensity: 0,
    beatPhase: 0,
    bpm: 120,
    confidence: 0,
    isPeak: false,
    peakIntensity: 0,
    spectralCentroid: 0,
    spectralFlatness: 0,
    spectralFlux: 0,
    spectralRolloff: 0,
    dominantNote: "-",
    chroma: new Array(12).fill(0),
    noteConfidence: 0,
    isBuildUp: false,
    buildUpConfidence: 0,
    buildUpPhase: "idle",
    beatsToImpact: -1,
    energy: 0,
    valence: 0.5,
    mood: "unknown",
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const processAudioRef = useRef<() => void>(() => {});

  // Detectors
  const bpmDetectorRef = useRef<BPMDetector | null>(null);
  const buildUpDetectorRef = useRef<BuildUpDetector | null>(null);

  // Beat detection state
  const beatIntensityRef = useRef<number>(0);
  const peakEnergyRef = useRef<number>(0);
  const previousSpectrumRef = useRef<Float32Array | null>(null);

  // Reusable typed arrays to avoid memory allocations per frame
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const waveformDataRef = useRef<Uint8Array | null>(null);
  const normalizedFreqRef = useRef<Float32Array | null>(null);
  const waveArrayRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    // Initialize detectors
    bpmDetectorRef.current = new BPMDetector({
      minBPM: cfg.bpmMin,
      maxBPM: cfg.bpmMax,
      beatThreshold: cfg.beatThreshold,
    });

    buildUpDetectorRef.current = new BuildUpDetector();

    return () => {
      bpmDetectorRef.current = null;
      buildUpDetectorRef.current = null;
    };
  }, [cfg.bpmMin, cfg.bpmMax, cfg.beatThreshold]);

  useEffect(() => {
    processAudioRef.current = () => {
      const analyser = analyserRef.current;
      const bpmDetector = bpmDetectorRef.current;
      const buildUpDetector = buildUpDetectorRef.current;

      if (!analyser || !bpmDetector || !buildUpDetector) return;

      const bufferLength = analyser.frequencyBinCount;

      // Reuse typed arrays instead of creating new ones each frame
      // This prevents massive memory allocations that cause browser crashes
      if (!frequencyDataRef.current || frequencyDataRef.current.length !== bufferLength) {
        frequencyDataRef.current = new Uint8Array(bufferLength);
        waveformDataRef.current = new Uint8Array(bufferLength);
        normalizedFreqRef.current = new Float32Array(bufferLength);
        waveArrayRef.current = new Float32Array(bufferLength);
        previousSpectrumRef.current = new Float32Array(bufferLength);
      }

      const frequencyData = frequencyDataRef.current;
      const waveformData = waveformDataRef.current!;
      const normalizedFreq = normalizedFreqRef.current!;
      const waveArray = waveArrayRef.current!;

      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(waveformData);

      // Convert to arrays and normalize - reusing existing arrays
      for (let i = 0; i < bufferLength; i++) {
        normalizedFreq[i] = frequencyData[i] / 255;
      }

      // Waveform -1 to 1 for Meyda - reusing existing array
      for (let i = 0; i < bufferLength; i++) {
        waveArray[i] = (waveformData[i] - 128) / 128;
      }

      // Calculate frequency bins for bass, mid, high
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const binWidth = sampleRate / cfg.fftSize;
      const bassEnd = Math.floor(250 / binWidth);
      const midEnd = Math.floor(4000 / binWidth);

      // Calculate energy levels
      let bassSum = 0;
      let midSum = 0;
      let highSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = normalizedFreq[i];
        if (i < bassEnd) {
          bassSum += value;
        } else if (i < midEnd) {
          midSum += value;
        } else {
          highSum += value;
        }
      }

      const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
      const mid = midEnd - bassEnd > 0 ? midSum / (midEnd - bassEnd) : 0;
      const high =
        bufferLength - midEnd > 0 ? highSum / (bufferLength - midEnd) : 0;

      // Extract Meyda features
      let spectralCentroid = 0;
      let spectralFlatness = 0;
      let spectralRolloff = 0;
      let rms = 0;
      let chroma: number[] = new Array(12).fill(0);

      try {
        const features = Meyda.extract(
          [
            "rms",
            "spectralCentroid",
            "spectralFlatness",
            "spectralRolloff",
            "chroma",
          ],
          waveArray as any
        );
        if (features) {
          rms = features.rms || 0;
          spectralCentroid = features.spectralCentroid || 0;
          spectralFlatness = features.spectralFlatness || 0;
          spectralRolloff = features.spectralRolloff || 0;
          chroma = features.chroma || new Array(12).fill(0);
        }
      } catch {
        // Meyda extraction failed, use fallbacks
      }

      const overall = rms > 0 ? rms * 2 : (bass * 2 + mid + high * 0.5) / 3.5;

      // Calculate spectral flux (rate of change)
      let spectralFlux = 0;
      const prevSpectrum = previousSpectrumRef.current;
      if (prevSpectrum && prevSpectrum.length === normalizedFreq.length) {
        for (let i = 0; i < normalizedFreq.length; i++) {
          const diff = normalizedFreq[i] - prevSpectrum[i];
          if (diff > 0) spectralFlux += diff;
        }
        spectralFlux /= normalizedFreq.length;
      }
      // Copy current spectrum to previous - reuse existing array instead of spreading
      if (prevSpectrum) {
        prevSpectrum.set(normalizedFreq);
      }

      // BPM Detection using histogram method
      const bpmResult: BPMResult = bpmDetector.detect(overall, bass);

      // Beat intensity decay
      if (bpmResult.isBeat) {
        beatIntensityRef.current = 1;
      }
      beatIntensityRef.current *= cfg.beatDecay;
      const beatIntensity = beatIntensityRef.current;

      // Peak detection
      if (overall > peakEnergyRef.current) {
        peakEnergyRef.current = overall;
      }
      peakEnergyRef.current *= 0.999;

      const isPeak = overall > peakEnergyRef.current * 0.9;
      const peakIntensity = isPeak
        ? overall / Math.max(peakEnergyRef.current, 0.01)
        : 0;

      // Build-up Detection
      const buildUpState: BuildUpState = buildUpDetector.update(
        frequencyData as unknown as number[], // Cast for compatibility or update BuildUpDetector later
        bass,
        mid,
        high,
        bpmResult.isBeat
      );

      // Note detection
      const { note: dominantNote, confidence: noteConfidence } =
        getDominantNote(chroma);
      const dominantNoteIndex = NOTE_NAMES.indexOf(dominantNote);

      // Calculate derived metrics
      const energy = calculateEnergy(
        overall,
        bass,
        spectralFlux,
        bpmResult.bpm,
        bpmResult.confidence
      );
      const valence = calculateValence(
        chroma,
        dominantNoteIndex >= 0 ? dominantNoteIndex : 0,
        spectralCentroid,
        bpmResult.bpm,
        bpmResult.confidence
      );
      const mood = determineMood(energy, valence, spectralFlatness);

      setData({
        frequencyData, // Uint8Array
        normalizedFrequency: normalizedFreq,
        waveformData, // Uint8Array
        bass,
        mid,
        high,
        overall,
        isBeat: bpmResult.isBeat,
        beatIntensity,
        beatPhase: bpmResult.beatPhase,
        bpm: bpmResult.bpm,
        confidence: bpmResult.confidence,
        isPeak,
        peakIntensity,
        spectralCentroid,
        spectralFlatness,
        spectralFlux,
        spectralRolloff,
        dominantNote,
        chroma,
        noteConfidence,
        isBuildUp: buildUpState.isBuildup,
        buildUpConfidence: buildUpState.confidence,
        buildUpPhase: buildUpState.phase,
        beatsToImpact: buildUpState.beatsToImpact,
        energy,
        valence,
        mood,
      });

      animationRef.current = requestAnimationFrame(processAudioRef.current);
    };
  }, [cfg.fftSize, cfg.beatDecay]);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = cfg.fftSize;
      analyser.smoothingTimeConstant = cfg.smoothingTimeConstant;
      analyser.minDecibels = cfg.minDecibels;
      analyser.maxDecibels = cfg.maxDecibels;
      analyserRef.current = analyser;

      // Connect source to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Reset detectors
      bpmDetectorRef.current?.reset();
      buildUpDetectorRef.current?.reset();

      // Start processing
      setIsInitialized(true);
      setIsListening(true);
      processAudioRef.current();
    } catch (err: any) {
      console.error("Failed to start audio analyser:", err);
      setError(err.message || "Failed to access microphone");
    }
  }, [cfg]);

  const stopListening = useCallback(() => {
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Disconnect source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsListening(false);

    // Reset state
    beatIntensityRef.current = 0;
    peakEnergyRef.current = 0;
    previousSpectrumRef.current = null;

    // Clear reusable arrays to free memory
    frequencyDataRef.current = null;
    waveformDataRef.current = null;
    normalizedFreqRef.current = null;
    waveArrayRef.current = null;
  }, []);

  // Tap tempo function
  const tapTempo = useCallback(() => {
    bpmDetectorRef.current?.tap();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Getter for the audio stream (for components that need direct access)
  const getStream = useCallback(() => streamRef.current, []);

  return {
    data,
    isInitialized,
    isListening,
    error,
    startListening,
    stopListening,
    tapTempo,
    getStream,
  };
}

export default useAudioAnalyser;
