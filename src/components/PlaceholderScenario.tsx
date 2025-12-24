import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from './shared/DisplayCard';

interface PlaceholderScenarioProps {
  title: string;
  description: string;
}

export default function PlaceholderScenario({ title, description }: PlaceholderScenarioProps) {
  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">{title}</h2>
        <div className="info-buttons-group">
          <button className="info-button">
            <Settings size={20} />
          </button>
          <button className="info-button">
            <CheckCircle size={20} />
          </button>
        </div>
      </header>

      <DisplayCard title="Coming Soon">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{description}</h3>
          <p style={{ color: 'var(--text-tertiary)' }}>
            This scenario will demonstrate {title.toLowerCase()} functionality.
          </p>
        </div>
      </DisplayCard>
    </section>
  );
}
