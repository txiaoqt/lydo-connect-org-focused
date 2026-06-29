export default function PwaInitialLoadingScreen() {
  return (
    <div className="ytrace-pwa-app pwa-loading-screen" role="status" aria-live="polite">
      <div className="pwa-loading-mark">Y</div>
      <p>Loading Y-TRACE...</p>
    </div>
  );
}
