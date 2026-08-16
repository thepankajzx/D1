import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProCustomDateModal.css';

export default function ProCustomDateModal({ onClose }) {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('pcdm-overlay')) {
      onClose();
    }
  };

  const handleUnlockPro = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <div className="pcdm-overlay" onClick={handleOverlayClick}>
      <section
        className="pcdm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="proTitle"
      >
        <button
          className="pcdm-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="pcdm-icon" aria-hidden="true">
          ♛
        </div>

        <h2 className="pcdm-title" id="proTitle">
          Custom Date Ranges
          <span className="pcdm-badge">PRO</span>
        </h2>

        <p className="pcdm-description">
          Analyze any date range with Pro.
        </p>

        <button
          className="pcdm-button"
          type="button"
          onClick={handleUnlockPro}
        >
          <span className="pcdm-sparkle">✦</span>
          <span>Unlock Pro</span>
        </button>

        <p className="pcdm-footnote">
          Get unlimited custom date range analysis.
        </p>
      </section>
    </div>
  );
}
