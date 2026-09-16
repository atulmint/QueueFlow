interface ErrorStateProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorState({ message, onDismiss }: ErrorStateProps) {
  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <span className="error-icon" aria-hidden="true">⚠</span>
      <span className="error-message">{message}</span>
      <button
        id="dismiss-error-btn"
        className="btn btn-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}
