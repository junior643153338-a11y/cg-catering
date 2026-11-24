export const categories = ['Recepciones', 'Platos fríos', 'Platos calientes', 'Pastas', 'Buffets', 'Asados', 'Juvenil e infantil'] as const
export type Category = typeof categories[number]

export type Menu = {
  id: string
  name: string
  category: Category
  description: string
  price: number | null
  minimum: number | null
  unit: 'person' | 'event'
  active: boolean
  terms: string
  details: string[]
  group?: string
  variant?: number
  photo?: string
  belowMinimumConsultation?: boolean
  choice?: { label: string; count: number; options: string[] }
}

export type Plan = {
  date: string
  time: string
  location: string
  guests: number
  menuIds: string[]
  choices: Record<string, string[]>
}

export const emptyPlan: Plan = { date: '', time: '20:00', location: '', guests: 50, menuIds: [], choices: {} }
export const whatsappNumber = '595972948659'
export const guaranies = (amount: number) => `₲ ${new Intl.NumberFormat('es-PY').format(amount)}`
export const validGuests = (guests: number) => Number.isSafeInteger(guests) && guests >= 1 && guests <= 1000000

export const displayName = (menu: Menu) => menu.variant ? 'Opción ' + menu.variant + ' · ' + menu.name : menu.name

export function quoteFor(plan: Plan, menus: Menu[]) {
  const active = menus.filter(menu => menu.active && plan.menuIds.includes(menu.id))
  const lines = active.map(menu => {
    const guestsValid = validGuests(plan.guests)
    const minimumMet = guestsValid && (menu.minimum === null || plan.guests >= menu.minimum)
    const underMinimumConsultation = guestsValid && !minimumMet && Boolean(menu.belowMinimumConsultation)
    const choices = [...new Set(plan.choices[menu.id] ?? [])].filter(value => menu.choice?.options.includes(value))
    const choicesMet = !menu.choice || choices.length === menu.choice.count
    const subtotal = minimumMet && menu.price !== null
      ? menu.price * (menu.unit === 'person' ? plan.guests : 1)
      : null
    return { menu, minimumMet, underMinimumConsultation, choices, choicesMet, subtotal }
  })
  const subtotal = lines.reduce((sum, line) => sum + (line.subtotal ?? 0), 0)
  const blocked = lines.some(line => !line.minimumMet && !line.underMinimumConsultation)
  const pendingChoices = lines.some(line => !line.choicesMet)
  const consultation = lines.some(line => line.menu.price === null || line.underMinimumConsultation)
  return { lines, subtotal, blocked, pendingChoices, consultation, complete: lines.length > 0 && !blocked && !consultation }
}

export function localDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function formatDate(date: string) {
  if (!date) return 'Por definir'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function eventTime(date: string, time: string) {
  return Date.parse(`${date}T${time || '00:00'}:00-03:00`)
}

export function allowedPlan(plan: Plan, menus: Menu[], now = new Date()) {
  const quote = quoteFor(plan, menus)
  return /^\d{4}-\d{2}-\d{2}$/.test(plan.date) && /^\d{2}:\d{2}$/.test(plan.time)
    && eventTime(plan.date, plan.time) > now.getTime() && Boolean(plan.location.trim())
    && validGuests(plan.guests) && quote.lines.length > 0 && !quote.blocked && !quote.pendingChoices
}

export function recommend(menus: Menu[], guests: number, budget: number, category: string) {
  const eligible = menus.filter(menu => menu.active && (category === 'Todas' || category === menu.category)
    && validGuests(guests) && (menu.minimum === null || guests >= menu.minimum || menu.belowMinimumConsultation))
  const hasEstimate = (menu: Menu) => menu.price !== null && (menu.minimum === null || guests >= menu.minimum)
  const priced = eligible
    .filter(hasEstimate)
    .map(menu => ({ menu, total: (menu.price ?? 0) * (menu.unit === 'person' ? guests : 1) }))
    .filter(result => result.total <= budget)
    .sort((a, b) => b.total - a.total || a.menu.name.localeCompare(b.menu.name, 'es'))
  return { priced, consultation: eligible.filter(menu => !hasEstimate(menu)) }
}

export function whatsAppLink(plan: Plan, menus: Menu[], booking: boolean, name = '') {
  const quote = quoteFor(plan, menus)
  const summary = quote.complete
    ? 'Total estimado: ' + guaranies(quote.subtotal)
    : [quote.subtotal > 0 && 'Subtotal confirmado: ' + guaranies(quote.subtotal), 'Total sujeto a consulta'].filter(Boolean).join('\n')
  const message = [
    'Hola, CG Catering. ' + (booking ? 'Quisiera solicitar una reserva.' : 'Quisiera consultar por un presupuesto.'),
    ...(name.trim() ? ['Nombre: ' + name.trim()] : []),
    'Fecha: ' + formatDate(plan.date) + ' a las ' + plan.time,
    'Ubicación: ' + plan.location.trim(),
    'Invitados: ' + plan.guests,
    'Menús: ' + quote.lines.map(line => displayName(line.menu) + (line.choices.length ? ' (' + line.choices.join(', ') + ')' : '')).join('; '),
    summary,
    'Solicitud preparada en la demo de CG Catering.',
  ].join('\n')
  return 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message)
}
