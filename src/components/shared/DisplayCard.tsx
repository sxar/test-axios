import classNames from 'classnames';
import { ReactNode } from 'react';

interface DisplayCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}

export function DisplayCard({
  title,
  children,
  className,
  highlight = false
}: DisplayCardProps) {
  return (
    <div className={classNames(
      'display-card',
      { 'highlight': highlight },
      className
    )}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}
