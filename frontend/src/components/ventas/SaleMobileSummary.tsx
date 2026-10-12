"use client";

import { useEffect, useState, type RefObject } from 'react';

export default function SaleMobileSummary({ formRef }: { formRef: RefObject<HTMLFormElement | null> }) {
  const [amounts, setAmounts] = useState({ total: '$ 0', balance: '$ 0' });

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    // Mirror the existing totals without introducing a second calculation.
    const total = form.querySelector('#totalVenta');
    const balance = form.querySelector('[data-sale-balance]');
    const update = () => setAmounts({
      total: total?.textContent || '$ 0',
      balance: balance?.textContent || '$ 0',
    });
    const observer = new MutationObserver(update);
    [total, balance].forEach((element) => {
      if (element) observer.observe(element, { childList: true, characterData: true, subtree: true });
    });
    update();
    return () => observer.disconnect();
  }, [formRef]);

  return (
    <div className="sale-mobile-summary">
      <span>Total <strong>{amounts.total}</strong></span>
      <span>Saldo <strong>{amounts.balance}</strong></span>
    </div>
  );
}
