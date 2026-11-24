import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { categories, displayName, formatDate, guaranies, localDate } from './domain'
import type { Menu } from './domain'
import { totals } from './store'
import type { Contact, Movement } from './store'
import type { AdminSection } from './Admin'
import { Dialog, Empty } from './ui'

function section(title: string, description: string, action: string, click: () => void) {
  return <div className="section-heading compact"><div><h2>{title}</h2><p>{description}</p></div>
    <button className="button button-dark" type="button" onClick={click}><Plus size={17}/>{action}</button></div>
}

function toolbar(label: string, onEdit: () => void, onDelete?: () => void) {
  return <div className="row-actions">
    <button className="icon-button" type="button" aria-label={'Editar ' + label} onClick={onEdit}><Pencil size={18}/></button>
    {onDelete && <button className="icon-button" type="button" aria-label={'Eliminar ' + label} onClick={onDelete}><Trash2 size={17}/></button>}
  </div>
}

function submitButton(label: string) {
  return <div className="dialog-actions"><button type="submit" className="button button-dark">{label}</button></div>
}

function DeleteDialog({ name, cancel, confirm }: { name: string; cancel: () => void; confirm: () => void }) {
  return <Dialog title="Confirmar eliminación" onClose={cancel}>
    <p>¿Quieres eliminar «{name}» de los datos de prueba?</p>
    <div className="dialog-actions"><button type="button" className="button button-outline" onClick={cancel}>Cancelar</button><button type="button" className="button button-dark" onClick={confirm}>Eliminar registro</button></div>
  </Dialog>
}

const contactTypes: Record<Contact['kind'], string> = { client: 'Cliente', employee: 'Empleado', supplier: 'Proveedor' }

export function Contacts({ store, setStore, clientsOnly }: AdminSection & { clientsOnly: boolean }) {
  const [draft, setDraft] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const [filter, setFilter] = useState('')
  const rows = store.contacts.filter(item => (clientsOnly ? item.kind === 'client' : item.kind !== 'client')
    && item.name.toLocaleLowerCase('es').includes(filter.trim().toLocaleLowerCase('es')))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft?.name.trim()) return
    const contact = { ...draft, id: draft.id || crypto.randomUUID(), name: draft.name.trim() }
    setStore(previous => ({ ...previous, contacts: draft.id ? previous.contacts.map(item => item.id === contact.id ? contact : item) : [...previous.contacts, contact] }))
    setDraft(null)
  }
  return <>
    {section(clientsOnly ? 'Clientes' : 'Equipo y proveedores', clientsOnly ? 'Consulta y actualiza los datos de contacto.' : 'Gestiona el personal y los prestadores de servicio.', clientsOnly ? 'Nuevo cliente' : 'Nuevo contacto',
      () => setDraft({ id: '', name: '', phone: '', notes: '', kind: clientsOnly ? 'client' : 'employee' }))}
    <div className="panel admin-panel">
      <SearchField label={clientsOnly ? 'Buscar cliente' : 'Buscar contacto'} value={filter} change={setFilter}/>
      <Records rows={rows.map(contact => <li key={contact.id}><div><strong>{contact.name}</strong><small>{contactTypes[contact.kind]}{contact.phone && ' · ' + contact.phone}</small>{contact.notes && <small>{contact.notes}</small>}</div>
        {toolbar(contact.name, () => setDraft(contact), store.events.some(event => event.clientId === contact.id) ? undefined : () => setDeleting(contact))}
      </li>)} empty="No hay contactos que coincidan."/>
    </div>
    {draft && <Dialog title={draft.id ? 'Editar contacto' : clientsOnly ? 'Nuevo cliente' : 'Nuevo contacto'} onClose={() => setDraft(null)}>
      <form onSubmit={submit}>
        {!clientsOnly && <label>Tipo de contacto <select value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as Contact['kind'] })}><option value="employee">Empleado</option><option value="supplier">Proveedor</option></select></label>}
        <label>Nombre <input required pattern=".*\S.*" maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label>
        <label>Teléfono (opcional) <input type="tel" maxLength={30} value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })}/></label>
        <label>Notas <textarea maxLength={300} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })}/></label>
        {submitButton('Guardar contacto')}
      </form>
    </Dialog>}
    {deleting && <DeleteDialog name={deleting.name} cancel={() => setDeleting(null)} confirm={() => {
      setStore(previous => previous.events.some(event => event.clientId === deleting.id) ? previous : { ...previous, contacts: previous.contacts.filter(item => item.id !== deleting.id) })
      setDeleting(null)
    }}/>}
  </>
}

function SearchField({ label, value, change }: { label: string; value: string; change: (value: string) => void }) {
  return <label className="search-field"><span className="sr-only">{label}</span><Search size={17}/><input type="search" placeholder={label} value={value} onChange={event => change(event.target.value)}/></label>
}

function Records({ rows, empty }: { rows: ReactNode[]; empty: string }) {
  return rows.length ? <ul className="record-list">{rows}</ul> : <Empty text={empty}/>
}

const movementTypes: Record<Movement['kind'], string> = { deposit: 'Seña', payment: 'Pago', expense: 'Gasto' }

export function Finance({ store, setStore, eventId, setEventId }: AdminSection & { eventId: string; setEventId: (id: string) => void }) {
  const [draft, setDraft] = useState<Movement | null>(null)
  const [deleting, setDeleting] = useState<Movement | null>(null)
  const event = store.events.find(event => event.id === eventId) ?? store.events[0]
  if (!event) return <Empty text="Crea un evento para registrar sus señas, pagos y gastos."/>
  const summary = totals(event, store.movements)
  const rows = store.movements.filter(item => item.eventId === event.id).sort((a,b) => b.date.localeCompare(a.date))
  const metrics = [
    { title: 'Ingresos cobrados', value: guaranies(summary.income) },
    { title: 'Saldo pendiente', value: event.consultation ? 'A confirmar' : guaranies(summary.balance) },
    { title: 'Gastos', value: guaranies(summary.costs) },
    { title: 'Rentabilidad de caja', value: guaranies(summary.profit) },
  ]

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft || !draft.description.trim() || !Number.isSafeInteger(draft.amount) || draft.amount < 1 || draft.amount > 1000000000000) return
    const movement = { ...draft, id: draft.id || crypto.randomUUID(), description: draft.description.trim() }
    setStore(previous => ({ ...previous, movements: draft.id ? previous.movements.map(item => item.id === draft.id ? movement : item) : [...previous.movements, movement] }))
    setDraft(null)
  }

  return <>
    {section('Pagos y gastos', 'Registra movimientos de prueba y controla el saldo y la rentabilidad de cada evento.', 'Nuevo movimiento',
      () => setDraft({ id: '', eventId: event.id, date: localDate(), kind: 'payment', description: '', amount: 0 }))}
    <div className="panel admin-panel finance-select">
      <label>Evento <select value={event.id} onChange={e => setEventId(e.target.value)}>{store.events.map(item => <option key={item.id} value={item.id}>{item.title} · {formatDate(item.date)}</option>)}</select></label>
      <p>{event.consultation ? 'Importe acordado: a confirmar' : 'Importe acordado: ' + guaranies(event.expected) + ' · Rentabilidad proyectada: ' + guaranies(summary.projectedProfit)}</p>
    </div>
    <div className="metrics">{metrics.map(item => <div className="metric" key={item.title}><span>{item.title}</span><strong>{item.value}</strong></div>)}</div>
    <div className="panel admin-panel"><h3>Movimientos del evento</h3>
      <Records rows={rows.map(item => <li key={item.id}><div><strong>{item.description}</strong><small>{movementTypes[item.kind]} · {formatDate(item.date)}</small></div>
        <div className="movement-actions"><strong className={item.kind === 'expense' ? 'amount-expense' : 'amount-income'}>{item.kind === 'expense' ? '−' : '+'}{guaranies(item.amount)}</strong>{toolbar(item.description, () => setDraft(item), () => setDeleting(item))}</div>
      </li>)} empty="Todavía no hay movimientos para este evento."/>
    </div>
    {draft && <Dialog title={draft.id ? 'Editar movimiento' : 'Nuevo movimiento'} onClose={() => setDraft(null)}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Tipo <select value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as Movement['kind'] })}>{Object.entries(movementTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>Fecha <input type="date" required value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}/></label>
        </div>
        <label>Concepto <input required pattern=".*\S.*" maxLength={150} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label>
        <label>Importe (₲) <input type="number" required min="1" max="1000000000000" value={draft.amount || ''} onChange={e => setDraft({ ...draft, amount: Number(e.target.value) })}/></label>
        {submitButton('Guardar movimiento')}
      </form>
    </Dialog>}
    {deleting && <DeleteDialog name={deleting.description} cancel={() => setDeleting(null)} confirm={() => {
      setStore(previous => ({ ...previous, movements: previous.movements.filter(item => item.id !== deleting.id) }))
      setDeleting(null)
    }}/>}
  </>
}

export function MenuEditor({ store, setStore }: AdminSection) {
  const [draft, setDraft] = useState<Menu | null>(null)
  const [filter, setFilter] = useState('')
  const rows = store.menus.filter(menu => (displayName(menu) + ' ' + menu.category).toLocaleLowerCase('es').includes(filter.trim().toLocaleLowerCase('es')))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft?.name.trim() || !draft.description.trim()) return
    const item = { ...draft, id: draft.id || crypto.randomUUID(), name: draft.name.trim(), description: draft.description.trim(),
      terms: draft.terms.trim(), details: draft.details.map(line => line.trim()).filter(Boolean),
      belowMinimumConsultation: draft.minimum !== null && Boolean(draft.belowMinimumConsultation) }
    setStore(previous => ({ ...previous, menus: draft.id ? previous.menus.map(menu => menu.id === draft.id ? item : menu) : [...previous.menus, item] }))
    setDraft(null)
  }
  return <>
    {section('Menús y precios', 'Los cambios de prueba se reflejan en el catálogo de este navegador.', 'Nuevo menú',
      () => setDraft({ id: '', name: '', category: 'Recepciones', description: '', price: null, minimum: null, unit: 'person', active: true, terms: '', details: [] }))}
    <div className="panel admin-panel">
      <SearchField label="Buscar menú" value={filter} change={setFilter}/>
      <Records rows={rows.map(menu => <li key={menu.id}><div><strong>{displayName(menu)}</strong><small>{menu.category} · {menu.price === null ? 'Sujeto a consulta' : guaranies(menu.price) + (menu.unit === 'person' ? ' por persona' : ' por evento')} · {menu.active ? 'Visible' : 'Oculto'}</small></div>
        {toolbar(menu.name, () => setDraft(menu))}
      </li>)} empty="No hay menús que coincidan."/>
    </div>
    {draft && <Dialog title={draft.id ? 'Editar menú' : 'Nuevo menú'} onClose={() => setDraft(null)}>
      <form onSubmit={submit}>
        <label>Nombre <input required pattern=".*\S.*" maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label>
        <div className="form-grid">
          <label>Categoría <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as Menu['category'] })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
          <label>Unidad de cobro <select value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value as Menu['unit'] })}><option value="person">Por persona</option><option value="event">Por evento</option></select></label>
          <label>Precio (₲) <input type="number" min="0" max="1000000000" placeholder="Sujeto a consulta" value={draft.price ?? ''} onChange={e => setDraft({ ...draft, price: e.target.value === '' ? null : Number(e.target.value) })}/></label>
          <label>Mínimo de invitados <input type="number" min="1" max="1000000" placeholder="Sin mínimo documentado" value={draft.minimum ?? ''} onChange={e => setDraft({ ...draft, minimum: e.target.value === '' ? null : Number(e.target.value) })}/></label>
        </div>
        <label>Descripción <textarea required maxLength={400} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label>
        <label>Ingredientes y detalles (un apartado por línea) <textarea maxLength={2500} value={draft.details.join('\n')} onChange={e => setDraft({ ...draft, details: e.target.value.split('\n') })}/></label>
        <label>Condiciones particulares <textarea maxLength={500} value={draft.terms} onChange={e => setDraft({ ...draft, terms: e.target.value })}/></label>
        <label className="check-row"><input type="checkbox" checked={draft.belowMinimumConsultation ?? false} disabled={draft.minimum === null} onChange={e => setDraft({ ...draft, belowMinimumConsultation: e.target.checked })}/><span>Permitir consulta para menos invitados</span></label>
        <label className="check-row"><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })}/><span>Mostrar en el catálogo</span></label>
        {submitButton('Guardar menú')}
      </form>
    </Dialog>}
  </>
}
