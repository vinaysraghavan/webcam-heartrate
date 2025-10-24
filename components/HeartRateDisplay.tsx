import React from 'react';
import { Icons } from './Icons';

interface HeartRateDisplayProps {
    bpm: number;
    status: string;
}

export const HeartRateDisplay: React.FC<HeartRateDisplayProps> = ({ bpm, status }) => {
    const animationDuration = bpm > 40 ? `${60 / bpm}s` : '1.5s';
    const isCalculating = bpm === 0 || status.toLowerCase().includes('calibrating');

    return (
        <div className="bg-gray-700/50 p-6 rounded-lg text-center border border-gray-600">
            <p className="text-gray-400 text-sm font-medium mb-2">CURRENT HEART RATE</p>
            <div className="flex items-center justify-center gap-4">
                <div className="relative">
                    <Icons.HeartPulse
                        className={`w-12 h-12 text-emerald-400 ${!isCalculating ? 'animate-pulse' : ''}`}
                        style={{ animationDuration }}
                    />
                </div>
                <span className={`text-6xl font-bold ${isCalculating ? 'text-gray-500' : 'text-emerald-400'}`}>
                    {isCalculating ? '--' : Math.round(bpm)}
                </span>
                <span className="text-xl text-gray-400 self-end mb-2">BPM</span>
            </div>
            <p className="text-gray-400 mt-2 text-sm h-5">{status}</p>
        </div>
    );
};