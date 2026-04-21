"use client";

function LoaderWithText() {
  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#EEF7F2_0%,_#FAFAF7_70%)]">
      <div className="h-24 w-24 animate-spin rounded-full border-4 border-slate-200 border-t-[#2D5F3F]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-center text-lg font-medium text-slate-700">Loading</span>
      </div>
    </div>
  );
}

export default LoaderWithText;
