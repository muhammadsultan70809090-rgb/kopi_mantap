import { useEffect, useState } from 'react';

type Props = {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
};

export function FallbackImage({ src, alt, className = '', eager = false }: Props) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm13 1h1.8a2.7 2.7 0 0 1 0 5.4H17M3 22h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
