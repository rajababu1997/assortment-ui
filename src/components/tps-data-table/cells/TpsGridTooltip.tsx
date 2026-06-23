import { memo } from 'react';
import type { ITooltipParams } from 'ag-grid-community';

/**
 * Custom AG Grid tooltip matching the Figma tooltip spec:
 * Dark #0F172B bubble, Inter 10/12 white text, 6px radius, 11×7 arrow.
 * Registered via the `tooltipComponent` grid option.
 */
const TpsGridTooltip = memo(function TpsGridTooltip(params: ITooltipParams) {
  const raw = params.valueFormatted ?? params.value;
  const text = raw == null ? '' : String(raw);
  if (!text) return null;

  return (
    <div className="tps-grid-tooltip" role="tooltip">
      <div className="tps-grid-tooltip__body">{text}</div>
    </div>
  );
});

TpsGridTooltip.displayName = 'TpsGridTooltip';

export default TpsGridTooltip;
