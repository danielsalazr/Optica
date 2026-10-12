"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Tooltip } from 'primereact/tooltip';

export type VentasTooltipHandle = { refresh: (forceRemount?: boolean) => void };

const VentasTooltip = forwardRef<VentasTooltipHandle>(function VentasTooltip(_, ref) {
  const tooltip = useRef<Tooltip>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [version, setVersion] = useState(0);

  const schedule = (callback: () => void) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, 0);
    timers.current.add(timer);
  };

  // Remount only the tooltip, not the entire sales table when targets change.
  useImperativeHandle(ref, () => ({
    refresh(forceRemount = false) {
      schedule(() => {
        tooltip.current?.unloadTargetEvents();
        if (forceRemount) setVersion(previous => previous + 1);
        schedule(() => tooltip.current?.updateTargetEvents());
      });
    },
  }));

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  return <Tooltip key={version} ref={tooltip} target=".ventas-action-tooltip" showDelay={120} hideDelay={80} />;
});

export default VentasTooltip;
