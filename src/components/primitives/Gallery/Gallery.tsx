import { useState, useCallback } from 'react';
import clsx from 'clsx';
import styles from './Gallery.module.css';
import type { GalleryProps } from './Gallery.types';

const positionClass = {
  left: styles.positionLeft,
  right: styles.positionRight,
  top: styles.positionTop,
  bottom: styles.positionBottom,
  none: styles.positionNone,
};

export function Gallery({
  items,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  thumbnailsPosition = 'left',
  renderItem,
  renderThumbnail,
  showArrows = true,
  className,
}: GalleryProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;

  const setIndex = useCallback((i: number) => {
    if (controlledIndex === undefined) setInternalIndex(i);
    onActiveIndexChange?.(i);
  }, [controlledIndex, onActiveIndexChange]);

  if (items.length === 0) {
    return (
      <div className={clsx(styles.root, className)}>
        <div className={styles.empty}>No images to display</div>
      </div>
    );
  }

  const current = items[Math.max(0, Math.min(activeIndex, items.length - 1))];
  const isVertical = thumbnailsPosition === 'left' || thumbnailsPosition === 'right';

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  return (
    <div className={clsx(styles.root, positionClass[thumbnailsPosition], className)}>
      {thumbnailsPosition !== 'none' && (
        <div className={clsx(styles.thumbs, isVertical ? styles.thumbsVertical : styles.thumbsHorizontal)}>
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-label={`View ${item.alt}`}
              aria-current={i === activeIndex}
              className={clsx(styles.thumb, i === activeIndex && styles.thumbActive)}
              onClick={() => setIndex(i)}
            >
              {renderThumbnail
                ? renderThumbnail(item, i)
                : <img src={item.thumbnail ?? item.src} alt={item.alt} className={styles.thumbImg} draggable={false} />}
            </button>
          ))}
        </div>
      )}

      <div className={styles.main}>
        {renderItem
          ? renderItem(current, activeIndex)
          : <img src={current.src} alt={current.alt} className={styles.mainImg} draggable={false} />}

        {showArrows && items.length > 1 && (
          <>
            <button
              type="button"
              className={clsx(styles.arrow, styles.arrowPrev)}
              onClick={() => canPrev && setIndex(activeIndex - 1)}
              disabled={!canPrev}
              aria-label="Previous image"
            >‹</button>
            <button
              type="button"
              className={clsx(styles.arrow, styles.arrowNext)}
              onClick={() => canNext && setIndex(activeIndex + 1)}
              disabled={!canNext}
              aria-label="Next image"
            >›</button>
          </>
        )}
      </div>
    </div>
  );
}
