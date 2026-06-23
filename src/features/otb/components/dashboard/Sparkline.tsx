/**
 * Tiny SVG sparkline. Renders a closed area chart for a numeric series.
 * Used to show 36-month net-sales trend on the historical lens.
 */

interface Props {
  values: number[];
  width?: number;
  height?: number;
  highlightIndex?: number;
}

export function Sparkline({ values, width = 220, height = 40, highlightIndex }: Props) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${(points.length - 1) * step},${height} L0,${height} Z`;

  const highlight =
    highlightIndex != null && points[highlightIndex] != null
      ? points[highlightIndex]
      : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
      <path d={areaPath} fill="var(--color-primary)" fillOpacity={0.12} />
      <path d={linePath} stroke="var(--color-primary)" strokeWidth={1.5} fill="none" />
      {highlight && (
        <circle
          cx={highlight.x}
          cy={highlight.y}
          r={3}
          fill="var(--color-primary)"
          stroke="var(--color-bg-base)"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}
