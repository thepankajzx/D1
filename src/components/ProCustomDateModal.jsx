import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkle } from '@phosphor-icons/react';
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

        <div className="pcdm-icon text-amber-500 flex items-center justify-center" aria-hidden="true">
          <Crown size={32} weight="fill" />
        </div>

        <h2 className="pcdm-title" id="proTitle">
          Custom Date Ranges
          <span className="pcdm-badge">PRO</span>
        </h2>

        <p className="pcdm-description">
          Analyze your habits with customized time frames or longer time frames.
        </p>

        <button
          className="pcdm-button flex items-center justify-center gap-1.5"
          type="button"
          onClick={handleUnlockPro}
        >
          <Sparkle size={16} weight="fill" className="text-amber-400" />
          <span>Unlock the Pro</span>
        </button>

        <p className="pcdm-footnote">
          Get unlimited custom date range analysis.
        </p>
      </section>
    </div>
  );
}
