"use client";

import { useEffect, useRef, useState } from 'react';

type Photo = { file: File; url: string };

export default function SalePhotoUpload({ existingUrls = [] }: { existingUrls?: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<Photo[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const commitPhotos = (next: Photo[]) => {
    // Keep the actual multipart input synchronized with the accumulated files.
    const transfer = new DataTransfer();
    next.forEach(({ file }) => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
    photosRef.current = next;
    setPhotos(next);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files?.length) {
      commitPhotos(photosRef.current);
      return;
    }
    commitPhotos([
      ...photosRef.current,
      ...Array.from(files, file => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (index: number) => {
    const removed = photosRef.current[index];
    commitPhotos(photosRef.current.filter((_, position) => position !== index));
    if (removed) URL.revokeObjectURL(removed.url);
  };

  useEffect(() => {
    const form = inputRef.current?.closest('form');
    const reset = () => {
      photosRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
      photosRef.current = [];
      setPhotos([]);
      if (cameraRef.current) cameraRef.current.value = '';
    };
    form?.addEventListener('reset', reset);
    return () => {
      form?.removeEventListener('reset', reset);
      photosRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="sale-photo-upload">
      <label htmlFor="imagenes">Fotos de la venta:</label>
      <input
        ref={inputRef}
        type="file"
        className="form-control"
        id="imagenes"
        name="foto"
        multiple
        accept="image/*"
        aria-describedby="sale-photo-help"
        onChange={event => addPhotos(event.currentTarget.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="d-none"
        tabIndex={-1}
        aria-label="Capturar una foto de la venta"
        onChange={event => {
          addPhotos(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
      <button type="button" className="btn btn-outline-primary sale-photo-camera mt-2" onClick={() => cameraRef.current?.click()}>
        <i className="pi pi-camera me-2" aria-hidden="true" />Tomar foto
      </button>
      <div id="sale-photo-help" className="small text-muted mt-1">
        Puedes agregar fotos varias veces sin perder las anteriores.
        {existingUrls.length > 0 && ' Al guardar, las nuevas fotos reemplazan las fotos actuales. Si quitas todas las nuevas, se conservan las actuales.'}
      </div>
      {photos.length === 0 && existingUrls.length > 0 && (
        <div className="mt-2">
          <div className="small text-muted mb-2">Fotos actuales de la venta</div>
          <div className="sale-photo-grid">
            {existingUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="sale-photo-item">
                <a href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Foto actual de la venta ${index + 1}`} className="img-thumbnail" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {photos.length > 0 && (
        <div className="mt-2">
          <div className="small text-muted mb-2">{photos.length} imagenes seleccionadas.</div>
          <div className="sale-photo-grid">
            {photos.map(({ url }, index) => (
              <div key={url} className="sale-photo-item">
                <a href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Foto de venta ${index + 1}`} className="img-thumbnail" />
                </a>
                <button type="button" className="sale-photo-remove" aria-label={`Quitar foto de venta ${index + 1}`} title="Quitar foto" onClick={() => removePhoto(index)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
