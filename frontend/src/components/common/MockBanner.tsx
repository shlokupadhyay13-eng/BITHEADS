import { useState } from 'react';
import { Database, Activity, RefreshCw } from 'lucide-react';
import { IS_MOCK_MODE, API_BASE_URL } from '../../services/api/client';
import { analysisService } from '../../services/api/analysisService';

export const MockBanner: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!IS_MOCK_MODE) {
    return null;
  }

  const handlePingBackend = async () => {
    setIsChecking(true);
    setHealthStatus(null);
    try {
      const res = await analysisService.checkBackendHealth();
      setHealthStatus(`Backend response: ${res.status}`);
    } catch {
      setHealthStatus('Backend unreachable at ' + API_BASE_URL);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <aside
      aria-label="Development environment mode banner"
      className="mock-env-banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        <span className="mock-env-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Database size={11} aria-hidden="true" />
          Mock data active
        </span>
        <span>
          <strong>VITE_USE_MOCK_API=true:</strong> Serving isolated test fixtures. Real Express API calls are bypassed.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {healthStatus && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-slate-700)' }}>
            {healthStatus}
          </span>
        )}
        <button
          type="button"
          onClick={handlePingBackend}
          disabled={isChecking}
          className="btn-ghost btn-sm"
          style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem',
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid #d97706',
            color: '#92400e',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
          aria-label="Test connection to Express backend"
        >
          {isChecking ? (
            <RefreshCw size={12} className="animate-spin" aria-hidden="true" />
          ) : (
            <Activity size={12} aria-hidden="true" />
          )}
          Ping Backend ({API_BASE_URL})
        </button>
      </div>
    </aside>
  );
};
