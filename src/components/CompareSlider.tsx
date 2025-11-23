import React from 'react';
import ReactCompareImage from 'react-compare-image';

interface CompareSliderProps {
  original: string; // URL or Base64 of original image
  overlay: string;  // URL or Base64 of heatmap/mask
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ original, overlay }) => {
  return (
    <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-200 my-4">
      <div className="bg-blue-50 p-2 text-center text-xs text-blue-600 font-bold uppercase tracking-wide">
        ↔ Slide to Reveal AI Analysis
      </div>
      <div className="h-[300px] bg-black relative">
        {/* Using ReactCompareImage to create the slider effect */}
        <ReactCompareImage 
          leftImage={original} 
          rightImage={overlay} 
          sliderLineWidth={2}
          handleSize={40}
          sliderLineColor="#3b82f6" 
        />
      </div>
    </div>
  );
};