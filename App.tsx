import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HeartRateDisplay } from './components/HeartRateDisplay';
import { SignalChart } from './components/SignalChart';
import { Icons } from './components/Icons';

// --- Configuration Constants ---
const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;
const FPS = 30;
const WINDOW_SECONDS = 20; // Increased window for longer history
const BUFFER_SIZE = FPS * WINDOW_SECONDS;
const MIN_BPM = 45;
const MAX_BPM = 200;

// --- Signal Processing Helpers ---

/**
 * Detrends a signal by subtracting a moving average.
 * This helps remove slow-moving changes like lighting variations.
 */
const detrendSignal = (signal: number[]): number[] => {
  if (signal.length < 3) return signal;
  const movingAverage = signal.map((_, i) => {
    const start = Math.max(0, i - Math.floor(FPS / 2));
    const end = Math.min(signal.length - 1, i + Math.floor(FPS / 2));
    const subSignal = signal.slice(start, end + 1);
    const avg = subSignal.reduce((a, b) => a + b, 0) / subSignal.length;
    return avg;
  });
  return signal.map((val, i) => val - movingAverage[i]);
};

/**
 * Calculates the magnitude spectrum of a signal using a Discrete Fourier Transform (DFT).
 * This is used to find the dominant frequency in the signal.
 */
const calculateMagnitudes = (signal: number[]): number[] => {
    const N = signal.length;
    const magnitudes = new Array(Math.floor(N / 2)).fill(0);

    // Using a Hanning window to reduce spectral leakage
    const windowedSignal = signal.map((val, i) => val * (0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)))));

    for (let k = 0; k < N / 2; k++) { // Iterate through frequency bins
        let real = 0;
        let imag = 0;
        for (let n = 0; n < N; n++) { // Sum over time samples
            const angle = (2 * Math.PI * k * n) / N;
            real += windowedSignal[n] * Math.cos(angle);
            imag -= windowedSignal[n] * Math.sin(angle);
        }
        magnitudes[k] = Math.sqrt(real * real + imag * imag) / N;
    }
    return magnitudes;
};


// --- Main Application Component ---

const App: React.FC = () => {
    const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
    const [heartRate, setHeartRate] = useState<number>(0);
    const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);
    const [status, setStatus] = useState<string>('Ready');
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const dataBuffer = useRef<number[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    
    const processFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
            return;
        }

        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        
        ctx.drawImage(videoRef.current, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        
        const imageData = ctx.getImageData(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        const data = imageData.data;
        
        let redSum = 0;
        for (let i = 0; i < data.length; i += 4) {
            redSum += data[i];
        }
        const redAverage = redSum / (data.length / 4);

        dataBuffer.current.push(redAverage);
        
        if (dataBuffer.current.length > BUFFER_SIZE) {
            dataBuffer.current.shift();
        }

        if (dataBuffer.current.length < BUFFER_SIZE) {
            setStatus(`Calibrating... (${Math.round((dataBuffer.current.length / BUFFER_SIZE) * 100)}%)`);
        } else {
            setStatus('Processing...');
            const detrended = detrendSignal(dataBuffer.current);
            
            // --- FFT-based heart rate calculation ---
            const magnitudes = calculateMagnitudes(detrended);
            
            const samples = detrended.length;
            const sampleRate = FPS; // Approximation of sample rate
            
            const minFreq = MIN_BPM / 60;
            const maxFreq = MAX_BPM / 60;

            const minIndex = Math.floor((minFreq * samples) / sampleRate);
            const maxIndex = Math.ceil((maxFreq * samples) / sampleRate);
            
            let peakIndex = -1;
            let maxMagnitude = -1;

            for (let i = minIndex; i <= maxIndex; i++) {
                if (magnitudes[i] > maxMagnitude) {
                    maxMagnitude = magnitudes[i];
                    peakIndex = i;
                }
            }
            
            if (peakIndex !== -1) {
                const peakFrequency = (peakIndex * sampleRate) / samples;
                const bpm = peakFrequency * 60;
                
                // Use a smoothing factor to prevent jerky updates
                setHeartRate(prev => (prev * 0.9) + (bpm * 0.1));
            }

            // Update chart data with the detrended signal for better visualization
            const newChartData = detrended.map((value, index) => ({ time: index, value }));
            setChartData(newChartData);
        }

        animationFrameId.current = requestAnimationFrame(processFrame);
    }, []);

    const startMonitoring = async () => {
        if (isMonitoring) return;
        setError(null);
        setStatus('Initializing camera...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT, frameRate: { ideal: FPS, max: FPS } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => {
                    setError('Could not play video. Please check permissions.');
                    console.error('Video play error:', e);
                });
            }
            setIsMonitoring(true);
            animationFrameId.current = requestAnimationFrame(processFrame);
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Camera access was denied. Please allow camera access in your browser settings and refresh the page.");
            setStatus('Ready');
        }
    };

    const stopMonitoring = useCallback(() => {
        if (!isMonitoring) return;
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        setIsMonitoring(false);
        setHeartRate(0);
        setChartData([]);
        setStatus('Ready');
        dataBuffer.current = [];
    }, [isMonitoring]);

    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700">
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Icons.HeartPulse className="w-8 h-8 text-emerald-500"/>
                        <h1 className="text-2xl font-bold text-gray-100">Webcam Heart Rate Monitor</h1>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 flex items-center justify-center">
                        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                        {!isMonitoring && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
                                <Icons.CameraOff className="w-16 h-16 text-gray-500 mb-4"/>
                                <p className="text-gray-300 font-semibold">Camera is off</p>
                                <p className="text-gray-400 text-sm mt-1">For best results, cover the camera lens completely with your finger.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col justify-between">
                        <HeartRateDisplay bpm={heartRate} status={status} />
                        <div className="mt-4">
                            {!isMonitoring ? (
                                <button onClick={startMonitoring} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Icons.Play className="w-5 h-5"/>
                                    Start Monitoring
                                </button>
                            ) : (
                                <button onClick={stopMonitoring} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Icons.Stop className="w-5 h-5"/>
                                    Stop Monitoring
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-300 mb-2">Estimated EKG Signal</h2>
                    <SignalChart data={chartData} />
                </div>
            </div>
            <canvas ref={canvasRef} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} className="hidden"></canvas>
            <footer className="text-center mt-8 text-gray-500 text-sm">
                <p>Note: This is a tech demo and not a medical device. Results are estimations.</p>
            </footer>
        </div>
    );
};

export default App;