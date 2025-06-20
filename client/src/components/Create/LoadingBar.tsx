import React from "react";

interface LoadingBarProps {
  progress: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ progress }) => {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800">
        Uploading Your Photo...
      </h2>
      <div className="w-full rounded-full bg-gray-200 shadow-inner">
        <div
          className="rounded-full bg-button-green py-2 text-center text-sm font-bold text-white transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          {progress > 5 && <span>{progress}%</span>}
        </div>
      </div>
      <p className="text-gray-600">
        Please wait, this should only take a moment.
      </p>
    </div>
  );
};

export default LoadingBar;
