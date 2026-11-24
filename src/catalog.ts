import type { Category, Menu } from './domain.ts'

export const drinks = ['Cocido', 'Té', 'Café con leche', 'Jugos naturales (naranja, piña, durazno)', 'Agua mineral con y sin gas']
const basicStarters = ['Chorizos al vino con sopa', 'Albóndiguitas en salsa roja con sopa', 'Crema de ajo con grisines y tostadas']
const completeStarters = ['Choricitos al vino con sopa paraguaya y tostadas', 'Albóndiguitas a la mostaza o salsa roja con sopa y tostadas', 'Crepes de pollo con tostadas (individual)', 'Crema de ajo con grisines y tostadas']

export const commercialTerms = [
  'Para agendar el evento se requiere una seña de reserva.',
  'El saldo debe abonarse en su totalidad 24 horas antes del evento.',
  'En caso de cancelación, la seña no es reembolsable.',
  'Si necesitas factura, solicítala al abonar el saldo.',
  'Prevé bandejas o recipientes para la comida que sobre.',
  'Las bandejas y los calentadores del servicio no se prestan.',
]

function item(id: string, name: string, category: Category, price: number | null, description: string, details: string[], extra: Partial<Menu> = {}): Menu {
  return { id, name, category, price, description, details, terms: '', unit: 'person', minimum: null, active: true, ...extra }
}

function variant(category: Category, group: string, number: number, name: string, price: number | null, description: string, starter = '', photo?: string): Menu {
  return item(group + '-' + number, name, category, price, description, starter ? ['Entrada: ' + starter] : [], { group, variant: number, photo })
}

export const catalog: Menu[] = [
  item('pastas-premium', 'Buffet de pastas premium', 'Pastas', 48000, 'Pastas, carnes y guarniciones con entrada y personal de servicio.', [
    'Lasaña de carne, canelones de choclo y ricota, fideos al pesto o carbonara, ravioles de carne en salsa cuatro quesos, ñoquis en salsa rosa y sorrentinos de jamón y queso.',
    'Arroz a la griega, medallones de pollo a la mostaza, lomito a la pimienta, peceto en salsa portuguesa y strogonoff de pollo.',
    'Entrada: choricitos al vino con sopa paraguaya. Incluye personal de servicio, arreglo de panes y queso rallado.',
  ], { photo: 'pastas' }),
  item('americano-basico', 'Buffet americano básico', 'Buffets', 50000, 'Carnes frías y calientes, guarniciones y ensaladas.', [
    'Carnes calientes: peceto a la pimienta, strogonoff de pollo, strogonoff de carne y cerdo a la mostaza.',
    'Guarniciones: arroz a la griega, papas rústicas, fideos al pesto, ñoquis en salsa cuatro quesos y vegetales al vapor.',
    'Fríos: lengua a la vinagreta, cima de pollo, peceto al escabeche y lomo de cerdo en salsa demiglace.',
    'Ensaladas: rusa, alemana, arroz y mix de verduras. Incluye personal, arreglo de pan y pan chip.',
  ], { photo: 'americano', choice: { label: 'Entrada', count: 1, options: basicStarters } }),
  variant('Asados', 'asado-plato', 1, 'Vacío vacuno', 50000, 'Vacío vacuno con ensalada rusa o alemana, o papa a la crema. Acompañado de sopa paraguaya y pan chip.', 'Chorizo picado con sopa y mandioca.', 'asado'),
  item('bocaditos', 'Buffet de bocaditos clásicos', 'Recepciones', 35000, 'Bocaditos salados servidos en bandejas de porcelana decoradas.', [
    'Sandwichitos de carne fría y de desmechado de pollo o bondiola, canastitas de choclo y de pollo al curry, croquetitas de carne, chipnesa de carne y pollo, empanaditas de carne y pollo, papas noisettes, romanitas de pollo, patitas de pollo y nuggets de pollo.',
    'Incluye tostadas, grisines y servilletas.',
  ]),
  item('antipasto', 'Antipasto', 'Recepciones', 65000, 'Tabla de quesos, fiambres y frutos secos, con sushi y bocaditos.', [
    'Mozzarella, roquefort, queso duro, sardo y pomerano. Jamón crudo y cocido, salame, salame con pimienta, pepperoni, frutos secos y huevos de codorniz.',
    'Romanitas de pollo con salsa tártara en vasitos, sushi variado, pinchos caprese, papas noisettes, croquetitas de pollo, empanada chilena, chipnesa de pollo y carne, sandwichitos de carne fría y de pollo desmechado.',
    'Incluye pan chip, grisines y tostadas.',
  ]),
  item('brunch', 'Brunch', 'Recepciones', 55000, 'Sandwichitos, bocados salados y tres opciones de bebidas.', [
    'Sandwichitos de jamón y queso, huevo y tomate, milanesa de carne y pollo, pollo desmechado y carne fría.',
    'Empanadas de carne y pollo fritas o al horno, empanadas fritas de jamón y queso, croquetas de carne, mini hamburguesas con queso, pinchos caprese, wraps de pollo, canapés de cuatro quesos y romanitas de pollo.',
  ], { minimum: 50, choice: { label: 'Bebidas', count: 3, options: drinks } }),
  variant('Platos fríos', 'frio', 1, 'Cima de pollo', 35000, 'Cima de pollo con arroz primavera y pan chip.', 'Chorizo al vino con sopa.'),
  variant('Platos fríos', 'frio', 2, 'Surtido de pollo, peceto y cerdo', 40000, 'Pollo, peceto y cerdo con ensalada rusa, arroz y pan chip.', 'Choricito albino con sopa.'),
  variant('Platos fríos', 'frio', 3, 'Medallón de peceto', 40000, 'Medallón de peceto en salsa demiglace, con ensalada rusa o alemana y pan chip.', 'Albóndiguitas en salsa con sopa.'),
  variant('Platos fríos', 'frio', 4, 'Peceto relleno', 42000, 'Peceto relleno en salsa demiglace con ensalada rusa.', 'Chorizo al vino con sopa.'),
  variant('Platos fríos', 'frio', 5, 'Lomo de cerdo a la pimienta', null, 'Lomo de cerdo a la pimienta con ensalada alemana o primavera y pan chip.', 'Salpicón de ave individual.'),
  variant('Platos fríos', 'frio', 6, 'Cima de pollo y peceto', 38000, 'Cima de pollo y medallón de peceto en salsa demiglace con ensalada rusa o alemana.', 'Crepé individual de pollo y manzana verde.'),
  variant('Platos calientes', 'caliente', 1, 'Peceto, cerdo y supremas de pollo', 40000, 'Medallones de peceto, cerdo y supremas de pollo en salsa demiglace, con papa a la crema y un pan chip por persona.', 'Chorizo al vino con sopa.'),
  variant('Platos calientes', 'caliente', 2, 'Pollo al chef', 35000, 'Pechuga rellena de morrones, huevo, jamón, queso y aceitunas en salsa demiglace, con papas a la crema o arroz a la griega y pan chip.', 'Albóndiguitas en salsa roja con sopa.'),
  variant('Platos calientes', 'caliente', 3, 'Medallón de lomito a la pimienta', 48000, 'Medallón de lomito con papa a la crema y pan chip.', 'Chorizo al vino con sopa.'),
  variant('Platos calientes', 'caliente', 4, 'Lomito a la tirolesa', 50000, 'Lomito a la tirolesa con ravioles en salsa cuatro quesos.', 'Chorizo al vino con sopa paraguaya.'),
  variant('Platos calientes', 'caliente', 5, 'Pollo grillé al champiñón', 33000, 'Pollo grillé al champiñón con papas a la crema o arroz a la griega y pan chip.', 'Albóndiguitas en salsa roja con sopa.'),
  variant('Pastas', 'pasta-plato', 1, 'Lasaña, canelones y ravioles', 40000, 'Lasaña de carne, peceto a la portuguesa, canelones de choclo y ricota, y ravioles en salsa cuatro quesos.', 'Chorizo al vino con sopa.'),
  variant('Pastas', 'pasta-plato', 2, 'Lasaña, ñoquis y carbonara', 32000, 'Lasaña de carne, ravioles en salsa cuatro quesos, ñoquis en salsa rosada, fideos a la carbonara y pan chip.', 'Chorizo al vino con sopa.'),
  variant('Pastas', 'pasta-plato', 3, 'Lasaña, pesto y medallón de pollo', null, 'Lasaña de carne, ñoquis en salsa rosada, fideos al pesto, medallón de pollo a la crema cuatro quesos y pan chip.', 'Chorizos al vino con sopa.'),
  variant('Pastas', 'pasta-plato', 4, 'Lasaña, canelones de pollo y peceto', 35000, 'Lasaña de carne, canelones de pollo, dos medallones de peceto y pan chip.', 'Chorizos al vino con sopa.'),
  item('pastas-buffet', 'Buffet de pastas', 'Pastas', 45000, 'Pastas con carnes, entrada y personal de servicio.', [
    'Lasaña de carne, canelones de choclo y ricota, fideos al pesto o carbonara, ravioles en salsa cuatro quesos, ñoquis en salsa rosada, blanca o cuatro quesos, y sorrentinos de jamón y queso.',
    'Medallón de pollo con vegetales salteados y peceto a la pimienta en salsa. Entrada: choricitos al vino con sopa paraguaya.',
    'Incluye personal de servicio, arreglo de panes y queso rallado.',
  ]),
  item('americano-completo', 'Buffet americano completo', 'Buffets', 60000, 'Lomito, peceto, pollo y cerdo, con guarniciones, platos fríos y ensaladas.', [
    'Carnes calientes: lomito a la pimienta, peceto en salsa portuguesa, strogonoff de pollo y cerdo en salsa con vegetales salteados.',
    'Guarniciones: papa a la crema, arroz a la griega, ravioles de carne en salsa cuatro quesos, sorrentinos de jamón y queso y vegetales al vapor.',
    'Fríos: lengua a la vinagreta, cima de pollo, peceto al vitel toné, lomo de cerdo agridulce y pernil de cerdo.',
    'Ensaladas: rusa, alemana, arroz y mix de verduras.',
  ], { minimum: 50, choice: { label: 'Entrada', count: 1, options: completeStarters } }),
  variant('Asados', 'asado-plato', 2, 'Costilla vacuna', 50000, 'Costilla vacuna con ensalada rusa o alemana, o arroz, con sopa y mandioca.', 'Chorizo picado con sopa y mandioca.', 'asado'),
  variant('Asados', 'asado-plato', 3, 'Costilla, vacío y tapa cuadril', 58000, 'Costilla vacuna, vacío vacuno y tapa cuadril de cerdo con ensalada rusa o alemana, o arroz, sopa y pan chip.', 'Chorizos picados con sopa y mandioca.', 'asado'),
  item('asado-tradicional', 'Asado tradicional', 'Asados', 80000, 'Parrilla con cortes de carne vacuna, cerdo y pollo.', [
    'Entrada: chorizo parrillero con y sin picante, morcillita, chorizo toscano, mbeju, sopa paraguaya, mandioca, verduras asadas y pan de ajo.',
    'Cortes: costilla vacuna, vacío, tapa cuadril o costillitas de cerdo, pollo y colita cuadril.',
    'Ensaladas y acompañamientos: rusa, alemana, mix de verduras, arroz, poroto, sopa y chipa guazú.',
  ]),
  item('asado-premium', 'Asado premium', 'Asados', 90000, 'Parrilla con lechoncito, cortes vacunos y piña asada.', [
    'Entrada: chorizo parrillero con y sin picante, morcillita, chorizo toscano, mbeju, sopa paraguaya, mandioca, verduras asadas y pan de ajo.',
    'Cortes y parrilla: costilla vacuna, vacío, costillitas de cerdo, tapa cuadril, colita cuadril, lechoncito, piña y verduras asadas.',
    'Ensaladas y acompañamientos: mix de verduras, rusa, alemana, remolacha con piña, Waldorf, sopa y chipa guazú.',
  ]),
  item('picada-de-asado', 'Picada de asado', 'Asados', 65000, 'Picada de parrilla con cortes vacunos y de cerdo.', [
    'Morcilla, chorizo parrillero con y sin picante, matambrito de cerdo, mbeju, sopa paraguaya, vacío, tapa vacuna y tapa cuadril de cerdo.',
    'Mandioca, verduras asadas y pan de ajo (parripan).',
  ], { photo: 'picada' }),
  variant('Juvenil e infantil', 'juvenil', 1, 'Sándwich de lomito completo', 35000, 'Pan, lomito, huevo, jamón, queso, panceta, lechuga y tomate. Incluye papas y variedad de salsas.', '', 'sandwich'),
  variant('Juvenil e infantil', 'juvenil', 2, 'Hamburguesa parrillera', 30000, 'Pan, hamburguesa, huevo, jamón, queso, panceta, lechuga y tomate. Incluye papas y variedad de salsas.'),
  variant('Juvenil e infantil', 'juvenil', 3, 'Hamburguesa clásica', 25000, 'Pan, hamburguesa, huevo, jamón, queso, lechuga y tomate. Incluye papas y variedad de salsas.', '', 'hamburguesa'),
  variant('Juvenil e infantil', 'juvenil', 4, 'Lomito árabe mixto', 32000, 'Lomito árabe mixto con papas, salsa individual de ajo y ketchup.', '', 'arabe'),
  variant('Juvenil e infantil', 'juvenil', 5, 'Hamburguesa normal', 20000, 'Pan, carne, jamón, queso, lechuga y tomate. Incluye papas y variedad de salsas.'),
  { ...variant('Juvenil e infantil', 'juvenil', 6, 'Pizza corrida', 45000, 'Mozzarella, napolitana, pepperoni, jamón y queso, margarita y palmito.'), terms: 'Servicio de pizza corrida durante 2 horas.' },
  item('desmechado', 'Servicio de desmechados', 'Buffets', 40000, 'Pollo al curry, cerdo al ajillo y vacío al vino tinto.', [
    'Toppings: salsa de ajo, ketchup, mayo de albahaca, papas pai, chimichurri, choclo, cebolla caramelizada, repollo, tomate, pepino y picante.',
    'Incluye panes variados en paneras, personal de servicio en mesa de buffet, buffeteras, platitos, servilletas y boles de porcelana.',
  ], { minimum: 50, belowMinimumConsultation: true, photo: 'desmechado' }),
]

export const groupNames: Record<string, string> = {
  frio: 'Plato servido frío', caliente: 'Plato servido caliente', 'pasta-plato': 'Pastas en plato servido',
  'asado-plato': 'Asado en plato servido', juvenil: 'Juvenil e infantil',
}
