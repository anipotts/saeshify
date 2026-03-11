'use client';

interface ProcessingOverlayProps {
  progress: number;
  error: string | null;
  onRetry?: () => void;
}

export default function ProcessingOverlay({ progress, error, onRetry }: ProcessingOverlayProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-red-400 text-lg font-semibold">Analysis failed</div>
        <p className="text-muted text-sm max-w-xs">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-micro px-4 py-2 bg-accent text-black rounded-full text-sm font-bold"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="text-white text-lg font-semibold">Analyzing rhyme scheme...</div>
      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>
      <p className="text-muted text-sm">
        {progress < 20 && 'Finding audio...'}
        {progress >= 20 && progress < 50 && 'Aligning words...'}
        {progress >= 50 && progress < 80 && 'Detecting rhymes...'}
        {progress >= 80 && 'Finishing up...'}
      </p>
    </div>
  );
}
