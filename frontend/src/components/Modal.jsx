import React, { useLayoutEffect, useRef } from 'react';

export default function Modal({ children, labelledBy, onClose, overlayClassName }) {
  const dialogRef = useRef(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    dialog.querySelector('[data-initial-focus]')?.focus({ preventScroll: true });
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-inherit backdrop:bg-transparent"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={overlayClassName}>
        {children}
      </div>
    </dialog>
  );
}
