'use client';

import Image, { type ImageProps } from 'next/image';
import React, { useState } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  src?: ImageProps['src'];
  alt?: string;
};

export function ImageWithFallback(props: Props) {
  const [didError, setDidError] = useState(false);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setDidError(true);
    props.onError?.(event);
  };

  const { src, alt, width, height, style, className, ...rest } = props;

  const resolvedWidth = typeof width === 'number' ? width : 88;
  const resolvedHeight = typeof height === 'number' ? height : 88;

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <Image
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          width={resolvedWidth}
          height={resolvedHeight}
          unoptimized
          {...rest}
          data-original-url={src}
        />
      </div>
    </div>
  ) : (
    <Image
      src={src ?? ERROR_IMG_SRC}
      alt={alt ?? ''}
      width={resolvedWidth}
      height={resolvedHeight}
      unoptimized
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
