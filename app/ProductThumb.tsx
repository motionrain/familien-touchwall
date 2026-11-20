// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { getFoodEmoji } from './foodUtils';

export default function ProductThumb({
  item,
  sizeClass = 'w-12 h-12',
  emojiClass = 'text-2xl',
  roundedClass = 'rounded-2xl'
}) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [item?.imageUrl]);

  if (item?.imageUrl && !imgFailed) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} bg-white/95 p-1 border border-white/25 overflow-hidden shrink-0 flex items-center justify-center shadow-sm`}
      >
        <img
          src={item.imageUrl}
          alt={item?.name || 'Produkt'}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} ${roundedClass} bg-black/35 border border-white/15 shrink-0 flex items-center justify-center ${emojiClass}`}
    >
      {item?.customEmoji || getFoodEmoji(item?.name || '')}
    </div>
  );
}
