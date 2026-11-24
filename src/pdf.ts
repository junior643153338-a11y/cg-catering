import { jsPDF } from 'jspdf'
import { displayName, formatDate, guaranies, quoteFor } from './domain'
import type { Menu, Plan } from './domain'
import { commercialTerms } from './catalog'
import { mark } from './photos'

export async function saveQuote(plan: Plan, menus: Menu[]) {
  const quote = quoteFor(plan, menus)
  const doc = new jsPDF()
  const logo = new Image()
  logo.src = mark
  await logo.decode()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 180
  canvas.getContext('2d')?.drawImage(logo, 0, 0, 180, 180)
  const logoPng = canvas.toDataURL('image/png')
  let y = 0
  const money = (value: number) => guaranies(value).replace('₲', 'Gs.')
  function heading() {
    doc.setFillColor(27, 22, 19)
    doc.rect(0, 0, 210, 43, 'F')
    doc.setTextColor(222, 187, 125)
    doc.setFont('times', 'bold')
    doc.setFontSize(27)
    doc.text('CG Catering', 20, 20)
    doc.setTextColor(249, 244, 235)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text('Cristian Garay Recepciones & Catering · Paraguay', 20, 30)
    doc.addImage(logoPng, 'PNG', 166, 8, 24, 24, 'catering-logo')
    y = 56
  }
  function paragraph(content: string, size = 11, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(46, 39, 33)
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(content, 170) as string[]
    for (const line of lines) {
      if (y > 273) {
        doc.addPage()
        heading()
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setFontSize(size)
        doc.setTextColor(46, 39, 33)
      }
      doc.text(line, 20, y)
      y += (size * 0.35) + 2
    }
    y += 2
  }
  heading()
  paragraph('Presupuesto de demostración', 19, true)
  paragraph('Fecha: ' + formatDate(plan.date) + ' · ' + plan.time)
  paragraph('Ubicación: ' + plan.location)
  paragraph('Invitados: ' + plan.guests)
  y += 4
  for (const line of quote.lines) {
    const basis = line.menu.unit === 'person' && line.menu.price !== null
      ? ' (' + money(line.menu.price) + ' × ' + plan.guests + ')' : ''
    paragraph(displayName(line.menu) + '  /  ' + (line.subtotal === null ? 'Sujeto a consulta' : money(line.subtotal) + basis), 11, true)
    if (line.underMinimumConsultation) paragraph('Consultar disponibilidad para menos de ' + line.menu.minimum + ' invitados.')
    else if (line.menu.minimum !== null) paragraph('Mínimo: ' + line.menu.minimum + ' invitados.')
    if (line.choices.length) paragraph(line.menu.choice?.label + ': ' + line.choices.join(', ') + '.')
    if (line.menu.terms) paragraph(line.menu.terms)
  }
  y += 3
  if (quote.complete) {
    paragraph('Total estimado: ' + money(quote.subtotal), 15, true)
  } else {
    if (quote.subtotal > 0) paragraph('Subtotal disponible: ' + money(quote.subtotal))
    paragraph('Total sujeto a consulta', 15, true)
  }
  paragraph('Condiciones de reserva y servicio', 12, true)
  for (const term of commercialTerms) paragraph(term)
  paragraph('Demostración. La disponibilidad y la reserva requieren confirmación de CG Catering.')
  paragraph('WhatsApp: +595 972 948 659')
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page)
    doc.setFontSize(9)
    doc.setTextColor(105, 95, 85)
    doc.text('CG Catering · ' + page + ' / ' + doc.getNumberOfPages(), 20, 287)
  }
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'presupuesto-cg-catering-' + plan.date + '.pdf'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
}
