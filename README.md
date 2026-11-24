# CG Catering

Demo instalable para Cristian Garay Recepciones & Catering, Paraguay. Aplicación React, TypeScript y Tailwind CSS.

## Ejecutar

Requiere Node.js 24.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

La vista de producción genera el manifiesto y el service worker. Una vez cargada y controlada por el service worker, se puede consultar el catálogo y utilizar el configurador sin conexión. La apertura de WhatsApp requiere acceso a la aplicación o al sitio de WhatsApp.

## Catálogo de referencia

El catálogo inicial procede del PDF **Cristian Garay 130626**. Las páginas 4 a 18 contienen 35 opciones, de las cuales 33 tienen precio por persona. La opción 5 de plato frío y la opción 3 de pastas en plato servido quedan sujetas a consulta. El brunch y el buffet americano completo tienen un mínimo de 50 personas. Para el servicio de desmechados se debe consultar disponibilidad por debajo de 50 personas. La página 3 recoge las condiciones de reserva y servicio.

El logo y las fotografías se extrajeron del PDF. El catálogo muestra imágenes donde el dossier aporta una foto relacionada. Los importes de los eventos de ejemplo del panel son ficticios. El configurador aplica el número total de invitados a todos los menús seleccionados y permite una opción por familia de platos numerados.

## Alcance de la demo

- El sitio público genera PDFs en el navegador, prepara un enlace de WhatsApp y guarda solicitudes de reserva de prueba.
- La administración tiene un acceso de demostración. Los registros y las ediciones se guardan en el navegador y no se comparten entre dispositivos.
- Los avisos se muestran en el panel cuando falta un máximo de 24 horas para un evento confirmado que tiene saldo pendiente. La demo no ejecuta tareas en segundo plano ni envía avisos por ningún canal.
- El asistente usa reglas sobre el catálogo, el presupuesto y el mínimo de invitados. No hay un modelo externo conectado.
- Usa datos de prueba al completar formularios. El enlace a WhatsApp deja el mensaje preparado y la persona decide si lo envía.

## Supabase para producción

La migración en `supabase/migrations` define menús, contactos, eventos, ítems cotizados, movimientos y políticas de acceso por fila. Aplícala en un proyecto de pruebas antes de conectar la aplicación. El catálogo publicado tiene lectura pública. La administración requiere una sesión autenticada y el rol `catering_role: admin` en `app_metadata`, asignado desde un entorno de confianza.

Para el paso a producción, importa el catálogo, configura Supabase Auth y sustituye el almacenamiento local por consultas con la clave pública. La recepción de reservas públicas debe pasar por un endpoint que valide los datos y calcule el presupuesto con el catálogo vigente. Las tablas de clientes, eventos y movimientos mantienen acceso de administrador. Las credenciales privilegiadas deben quedar en el servidor.

La publicación de la demo usa GitHub Actions y GitHub Pages desde `main`.
