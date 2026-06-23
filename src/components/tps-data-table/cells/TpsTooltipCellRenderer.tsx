import { memo } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';

// Tooltip is now provided by AG Grid's native tooltipValueGetter on the colDef
// (it renders outside the cell's overflow:hidden bounds). This renderer just
// handles the truncated display.
const TpsTooltipCellRenderer = memo(function TpsTooltipCellRenderer(
  params: ICellRendererParams,
) {
  const value = params.valueFormatted ?? params.value;
  const display = value == null ? '' : String(value);

  return (
    <span className="inline-block max-w-full truncate align-middle">
      {display}
    </span>
  );
});

TpsTooltipCellRenderer.displayName = 'TpsTooltipCellRenderer';

export default TpsTooltipCellRenderer;
