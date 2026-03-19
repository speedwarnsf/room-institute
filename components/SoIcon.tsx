import React from 'react';

type IconName =
  | 'close-circle' | 'eye-off' | 'like' | 'love' | 'stars'
  | 'share' | 'filter' | 'expand-content' | 'shrink-content'
  | 'trash' | 'save' | 'eye' | 'bookmark' | 'add-circle' | 'loading-2';

interface SoIconProps {
  name: IconName;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const SoIcon: React.FC<SoIconProps> = ({ name, className = '', size = 20, style }) => (
  <img
    src={`/icons/so-${name}.svg`}
    alt=""
    width={size}
    height={size}
    className={`so-icon ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    aria-hidden="true"
  />
);

export default SoIcon;
