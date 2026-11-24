import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { mark } from './photos'

export function Brand() {
  return <span className="brand">
    <img className="brand-mark" src={mark} alt="" width="44" height="44"/>
    <span><strong>CG Catering</strong><small>Cristian Garay</small></span>
  </span>
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return <dialog ref={ref} className="dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="dialog-inner">
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={21}/></button>
      </div>
      {children}
    </div>
  </dialog>
}

export function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>
}
