export function LoadingState() {
  return (
    <div className="queueflow-loader-wrapper" role="status" aria-live="polite" aria-label="Loading jobs">
      <div className="queueflow-loader" aria-hidden="true">
        <p className="queueflow-loader-text">loading</p>
        <span className="queueflow-load"></span>
      </div>
      <p className="loading-text">Loading jobs…</p>
    </div>
  );
}
