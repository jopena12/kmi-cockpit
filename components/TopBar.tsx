import Link from 'next/link';
import { PeriodSelector } from './PeriodSelector';

interface TopBarProps {
  title: string;
  subtitle: string;
  showBack?: boolean;
}

export function TopBar({ title, subtitle, showBack }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {showBack && (
          <Link href="/" className="back-button">
            ←
          </Link>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="topbar-title">{title}</div>
          <div className="topbar-subtitle">{subtitle}</div>
        </div>
      </div>

      <PeriodSelector />
    </div>
  );
}
