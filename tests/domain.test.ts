import assert from 'node:assert/strict'
import test from 'node:test'
import { catalog } from '../src/catalog.ts'
import { allowedPlan, emptyPlan, quoteFor, recommend, whatsAppLink } from '../src/domain.ts'
import { hasPaymentAlert, totals } from '../src/store.ts'
import type { Event, Movement } from '../src/store.ts'

const now = new Date('2026-12-13T22:00:00Z')
const plan = { ...emptyPlan, date: '2026-12-14', location: 'Asunción' }

test('the 35 catalogue entries preserve documented prices and explicit omissions', () => {
  assert.equal(catalog.length, 35)
  assert.equal(new Set(catalog.map(menu => menu.id)).size, 35)
  assert.deepEqual(catalog.filter(menu => menu.price === null).map(menu => menu.id), ['frio-5', 'pasta-plato-3'])
  assert.deepEqual(catalog.filter(menu => menu.minimum !== null).map(menu => [menu.id, menu.minimum]), [
    ['brunch', 50], ['americano-completo', 50], ['desmechado', 50],
  ])
})

test('priced and consultation lines keep the partial subtotal distinct', () => {
  const estimate = quoteFor({ ...plan, guests: 55, menuIds: ['pastas-premium', 'frio-5'] }, catalog)
  assert.equal(estimate.subtotal, 2640000)
  assert.equal(estimate.complete, false)
  assert.equal(estimate.consultation, true)
  assert.equal(estimate.lines[1]?.subtotal, null)
})

test('a per-event rate is applied once and hidden items are skipped', () => {
  const menus = [{ ...catalog[0]!, unit: 'event' as const }, { ...catalog[1]!, active: false }]
  const estimate = quoteFor({ ...plan, guests: 80, menuIds: menus.map(menu => menu.id) }, menus)
  assert.equal(estimate.complete, true)
  assert.equal(estimate.subtotal, 48000)
})

test('brunch enforces the guest minimum and checks three distinct valid drinks', () => {
  const brunch = { ...plan, menuIds: ['brunch'], choices: { brunch: ['Cocido', 'Té', 'Café con leche'] } }
  assert.equal(allowedPlan(brunch, catalog, now), true)
  assert.equal(quoteFor(brunch, catalog).subtotal, 2750000)
  assert.equal(allowedPlan({ ...brunch, guests: 49 }, catalog, now), false)
  assert.equal(allowedPlan({ ...brunch, choices: { brunch: ['Té', 'Té', 'Invalida'] } }, catalog, now), false)
  assert.equal(allowedPlan({ ...plan, menuIds: ['americano-completo'], guests: 45 }, catalog, now), false)
  assert.equal(allowedPlan({ ...plan, menuIds: ['americano-basico'] }, catalog, now), false)
})

test('desmechado below 50 can be requested as a consultation without a subtotal', () => {
  const request = { ...plan, guests: 49, menuIds: ['desmechado'] }
  const estimate = quoteFor(request, catalog)
  assert.equal(estimate.consultation, true)
  assert.equal(estimate.subtotal, 0)
  assert.equal(allowedPlan(request, catalog, now), true)
  assert.equal(quoteFor({ ...request, guests: 50 }, catalog).subtotal, 2000000)
})

test('the assistant balances budget and guest conditions', () => {
  const result = recommend(catalog, 40, 1500000, 'Todas')
  assert(result.priced.length > 0)
  assert(result.priced.every(entry => entry.total <= 1500000))
  assert(!result.priced.some(entry => entry.menu.id === 'brunch'))
  assert(result.consultation.some(entry => entry.id === 'desmechado'))
  assert.equal(recommend(catalog, 50, 2749999, 'Recepciones').priced.some(entry => entry.menu.id === 'brunch'), false)
  assert.equal(recommend(catalog, 50, 2750000, 'Recepciones').priced.some(entry => entry.menu.id === 'brunch'), true)
})

test('WhatsApp uses the authorised number and retains the provisional quote status', () => {
  const url = new URL(whatsAppLink({ ...plan, guests: 25, menuIds: ['desmechado'] }, catalog, true, 'Ejemplo'))
  assert.equal(url.origin + url.pathname, 'https://wa.me/595972948659')
  assert.match(url.searchParams.get('text')!, /Asunción[\s\S]*Total sujeto a consulta/)
})

test('invalid guest, past event and missing fields prevent a request', () => {
  const request = { ...plan, menuIds: ['bocaditos'] }
  for (const change of [{ guests: 4.5 }, { guests: 0 }, { date: '2026-12-12' }, { time: '' }, { location: '   ' }, { menuIds: [] }]) {
    assert.equal(allowedPlan({ ...request, ...change }, catalog, now), false)
  }
})

test('señas and payments reduce the balance, and expenses affect profit within a 24h alert window', () => {
  const event: Event = { id: 'a', clientId: '', title: 'Evento', date: '2026-12-14', time: '19:00', location: 'Asunción', guests: 50, expected: 2000000, status: 'confirmed', menuNames: [] }
  const movement = (kind: Movement['kind'], amount: number): Movement => ({ id: kind, eventId: 'a', date: '2026-12-13', kind, amount, description: kind })
  const entries = [movement('deposit', 500000), movement('payment', 100000), movement('expense', 400000)]
  assert.deepEqual(totals(event, entries), { income: 600000, costs: 400000, balance: 1400000, profit: 200000, projectedProfit: 1600000 })
  assert.equal(hasPaymentAlert(event, entries, now.getTime() - 1), false)
  assert.equal(hasPaymentAlert(event, entries, now.getTime()), true)
  assert.equal(hasPaymentAlert({ ...event, status: 'request' }, entries, now.getTime()), false)
  assert.equal(hasPaymentAlert(event, [...entries, movement('payment', 1400000)], now.getTime()), false)
  assert.equal(hasPaymentAlert(event, entries, now.getTime() + 86400001), false)
})
