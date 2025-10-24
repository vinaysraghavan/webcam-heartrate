import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, CartesianGrid } from 'recharts';

interface SignalChartProps {
    data: { time: number, value: number }[];
}

export const SignalChart: React.FC<SignalChartProps> = ({ data }) => {
    return (
        <div className="w-full h-32 bg-gray-900/70 p-2 rounded-lg border border-gray-700">
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <YAxis domain={['auto', 'auto']} hide={true} />
                        <CartesianGrid stroke="rgba(75, 85, 99, 0.4)" strokeDasharray="3 3" />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#34d399" // EKG green
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Waiting for data...</p>
                </div>
            )}
        </div>
    );
};