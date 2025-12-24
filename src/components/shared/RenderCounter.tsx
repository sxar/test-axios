import { useRef, useEffect } from 'react';

interface RenderCounterProps {
  testId: string;
}

export function RenderCounter({ testId }: RenderCounterProps) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div
      className="render-counter"
      data-testid={testId}
    >
      Renders: {renderCount.current}
    </div>
  );
}
