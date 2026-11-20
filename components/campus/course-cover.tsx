"use client";
/* eslint-disable @next/next/no-img-element -- Imagen pública same-origin desde BFF, no dominio externo. */

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { courseCoverSrc } from '@/lib/academic/course-cover-url';

type Props = {
  courseId: number;
  imageUrl: string | null;
  alt: string;
  size?: number;
  className?: string;
};

/**
 * Portada pública en el listado y el detalle del campus.
 * Nunca depende del rol ni de is_published. Si el backend todavía bloquea
 * las imágenes de borradores, aparece un placeholder hasta corregir FastAPI.
 */
export function CourseCover({ courseId, imageUrl, alt, size = 24, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const src = courseCoverSrc(courseId, imageUrl);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return <span className={`lms-course-cover-fallback ${className}`} aria-label="Portada no disponible">
      <BookOpen size={size} aria-hidden="true" />
    </span>;
  }
  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}
