# Stag Research — Instrucciones del bot diario

La sección de noticias diarias se llama **Hoy** (página `yentonces.html`, datos en `data/notas.json`). `data/notas.json` guarda solo la edición del día; las anteriores pasan a `data/archivo/AAAA-MM.json` (un archivo por mes), donde solo se conservan las notas de relevancia 8 o más y las de solo hechos (biotecnología e informe de la deuda). `python3 bot/publicar.py agregar hoy` archiva la edición anterior automáticamente; no edites esos archivos a mano. Antes se llamaba ¿Y Entonces?; ese nombre ya no se usa en el sitio.

Este archivo es la fuente única de reglas editoriales. Lo usa hoy la tarea programada de Claude y, más adelante, el script con la API de Anthropic. Si cambias una regla, cámbiala aquí.

## Prioridades de la edición (decisión del dueño)
**Hoy trae únicamente noticias que se relacionen directamente con las 15 compañías de la sección Biotechnology** (categoría `biotecnologia`, formato `hechos`): publica todas las noticias relevantes de esas compañías, sin límite de cantidad. Ya **no** se publican notas de Colombia y mercados, de La región ni de Mi portafolio en Hoy: el sitio dejó de enfocarse en Colombia y ahora se enfoca en biotecnología. Si un día no hay noticias relevantes de las 15 compañías, no publiques ninguna (nunca rellenes).

## Cuándo corre
**De lunes a viernes** (no corre sábados ni domingos, para ahorrar). La corrida empieza a las 8:40 a. m. hora Bogotá para que la edición quede publicada hacia las 9:00 a. m.: la sección Hoy debe quedar publicada en unos 20 minutos.

## Tiempo y eficiencia (obligatorio)
1. **No leas los archivos de `data/` completos** (no hace falta: `estado` resume lo necesario) ni los reescribas a mano. Usa `python3 bot/publicar.py estado` para saber la fecha, si ya hay notas de hoy, los siguientes id, los términos del glosario y la lista de URL ya publicadas (`/tmp/stag_urls.txt`). Para publicar, escribe las notas nuevas en un archivo temporal y agrégalas con `python3 bot/publicar.py agregar hoy|latam ARCHIVO.json`; los términos nuevos con `glosario ARCHIVO.json` (antes de agregar las notas) . El script valida campos, términos, puntajes y URL repetidas y pone la hora real en `actualizado`; si rechaza algo, corrige el archivo temporal y vuelve a correrlo. Termina con `python3 bot/publicar.py validar`.
1b. **Pre-revisión automática (obligatorio, ahorra búsquedas):** antes de buscar noticias de biotecnología, corre `python3 -c "import json;d=json.load(open('data/pendientes.json'));print(d['fecha'],d['ventana_horas']);[print(a['grupo'],a['clave'],a['estado'],*[n['titulo']+' <'+n['url']+'>' for n in a['noticias']],sep=' | ') for a in d['activos']]"`. Ese archivo lo genera `bot/novedades.py` (GitHub Action, sin IA) con los titulares de las últimas 48 horas (96 los lunes) de las 15 compañías. **Si la fecha del archivo es la de hoy:** revisa a fondo (WebSearch con el nombre y la fecha, página de inversionistas y apertura del comunicado) **solo** los activos con estado `con_noticias` y `sin_revisar`; **no busques** los `sin_noticias`. Los titulares son pistas: confirma el hecho en la fuente primaria (comunicado, 8-K, FDA, Superfinanciera) y descarta lo que no cumpla las reglas. **Si el archivo no existe o su fecha no es la de hoy:** ignóralo y revisa las 15 compañías una por una, como antes.
2. **Una sola vez por fuente:** cada URL se intenta una vez. Si una página no responde, falla o pide permiso, sigue con la siguiente fuente de la lista; no busques sitios alternos fuera de los indicados aquí.
3. **Lee primero los titulares:** usa la pre-revisión y abre el comunicado solo de las compañías con candidatas.
4. **Una sola publicación:** cuando tengas todas las notas de biotecnología del día, valida y publica todo en un solo commit ("Edición AAAA-MM-DD") y un push.
5. **Límite de tiempo:** si a las 9:05 a. m. (hora Bogotá) todavía estás buscando, deja de buscar y publica lo que tengas validado.

## Fuentes (solo biotecnología)
**No se usan medios de Colombia ni de América Latina** (ni RSS ni portadas de La República, Portafolio, Valora Analitik, El Tiempo, Semana, Bloomberg Línea, InfoMoney, El Financiero, Ámbito, Infobae). No los consultes: gastan tokens y ya no son parte del sitio.

Solo se usan las fuentes de cada compañía y de los reguladores (ver "Biotechnology en Hoy" abajo): página de inversionistas, GlobeNewswire, Business Wire, PR Newswire, 8-K de la SEC, comunicados de la FDA y WebSearch por nombre de compañía. Si WebFetch rechaza una URL por permiso (PROVENANCE_REQUIRED), no la reintentes: busca con WebSearch y abre las URL que devuelva.

## Qué entra
Solo noticias de las últimas ~48 horas (96 los lunes) que se relacionen directamente con las 15 compañías de Biotechnology, en formato de solo hechos y sin puntaje. Todo lo demás se descarta.

## Reglas obligatorias
1. **Derechos de autor:** nunca copies frases del artículo. Todo va con tus palabras, y siempre con el enlace a la fuente original.
2. **Solo hechos de la fuente:** no inventes cifras, fechas ni citas. Si un dato no está en la fuente, no lo pongas. Ante la duda, omite.
3. **No es recomendación:** prohibido "comprar", "vender", "mantener", precios objetivo o instrucciones de acción. Las lecturas son escenarios, no consejos.
4. **Sin lecturas de mercado:** las notas de biotecnología son de solo hechos (ver reglas especiales abajo).
5. **Tono y público:** español neutro y profesional, dirigido a inversionistas no profesionales. La pregunta que responde cada nota es: ¿cómo afecta esto a mi portafolio? Claro y preciso, sin sensacionalismo y sin coloquialismos. Cuando la nota se dirija al lector, tutéalo ("tu portafolio", "si tienes TES"), como el resto del sitio; nunca uses "usted"; los términos técnicos se explican en el glosario.
6. **Sin nombres propios del autor:** la firma es siempre Stag Research.
7. **Sin menciones al proceso:** no indiques en las notas que fueron generadas automáticamente ni menciones herramientas o modelos.

## Glosario (`data/glosario.json`)
La página `glosario.html` muestra los "Términos del día" (los de la edición más reciente) y el glosario completo. Si una nota usa un término que todavía no está en `data/glosario.json`, agrégalo con este formato:

```json
{ "termino": "Nombre del término", "definicion": "" }
```

La definición va en 2 a 4 frases, en lenguaje sencillo para un inversionista no profesional: qué es y por qué le importa a quien invierte. Aquí sí puedes usar conocimiento general (no viene de la noticia), pero solo conceptos establecidos y sin cifras que cambien con el tiempo. No modifiques las definiciones existentes salvo para corregir un error.

## Indicadores (`data/mercado.json`)
**La corrida diaria ya no busca indicadores** (COLCAP, tasa del Banco de la República, inflación): no uses medios colombianos para eso. Los de Yahoo Finance (USD/COP, Brent) los sigue actualizando la GitHub Action `indicadores.yml` sin IA.


## Biotechnology (`data/biotech.json`, página `biotecnologia.html`; en el menú se llama Biotechnology)
**Idioma (decisión del dueño): todo el contenido de `data/biotech.json` y de la página Biotechnology va en inglés** (valores de texto, fechas como "Before end of 2026", "Q4 2026", "H1 2027", "Feb 28, 2027", y actualizado como "Nov 1, 2026"). Las claves JSON no cambian. Las notas de biotecnología en Hoy siguen en español. Los mismos tonos y reglas valen en inglés: frases cortas, sin jerga, para un joven de 15 años, sin opinión.

**La corrida diaria no modifica `data/biotech.json`** ni esta página, que no tiene noticias: solo la tabla "Panorama de biotecnológicas" y las fichas de las compañías. Las noticias de estas 15 compañías se publican en Hoy, con formato de solo hechos (ver "Biotecnología en Hoy" abajo).

**Actualización mensual:** el día 1 de cada mes (o cuando el dueño lo pida) se revisa cada compañía y se actualizan, solo con hechos confirmados por una fuente:
- `panorama.companias`: una fila por compañía con `nombre`, `ticker`, `medicamento`, `fase`, `enfermedad`, `hito` (el próximo paso), `hito_fecha` y `fuente_url`. Ordenadas por ticker.
- `companias`: una ficha por compañía, en el mismo orden y con las mismas compañías que el panorama, con `ticker`, `nombre`, `bolsa`, `medicamento_principal` (`nombre`, `fase`, `enfermedad`), `que_hace`, `estado`, `hitos` (`texto`, `fecha`) y `fuente_url`.
- `panorama.actualizado` y `actualizado`: la fecha de la revisión, en formato "Nov 1, 2026".

**Compañías (15):** Ascentage Pharma (AAPG), Celcuity (CELC), Cytokinetics (CYTK), Edgewise Therapeutics (EWTX), Faeth Therapeutics (FTH), IDEAYA Biosciences (IDYA), Immunome (IMNM), Kardigan (KARD), Palvella Therapeutics (PVLA), Arcus Biosciences (RCUS), Relay Therapeutics (RLAY), Revolution Medicines (RVMD), Rhythm Pharmaceuticals (RYTM), Tango Therapeutics (TNGX) y Wave Life Sciences (WVE). Solo el dueño agrega o quita compañías.

**Fuentes:** comunicados de prensa y resultados trimestrales de cada compañía (página de inversionistas, GlobeNewswire, Business Wire, formularios 8-K de la SEC), y comunicados de la FDA o de otros reguladores. Usa la fuente más reciente; no uses sitios de alertas automáticas de acciones, avisos de bufetes de abogados ni análisis del precio de la acción.

**Qué revisar en cada compañía:** si el medicamento principal cambió de fase, fue aprobado o cambió; si un hito ya ocurrió (quítalo y, si hay resultado, cuéntalo en `estado`); y cuáles son los próximos hitos con fecha. Los hitos van del más cercano al más lejano, sin hitos ya pasados; el primero de la ficha debe coincidir con el `hito` del panorama.

**Reglas (obligatorias):**
1. **Sin opinión:** nada de lecturas alcistas o bajistas, ponderaciones, puntajes, recomendaciones ni calificativos como "positivo", "bueno", "prometedor" o "decepcionante". Solo hechos. Se puede decir que un estudio "cumplió su objetivo principal" o "dio resultados positivos" cuando la compañía lo reporta así.
2. **Lenguaje para un joven de 15 años:** frases cortas y sin jerga. `que_hace` explica en 1 o 2 frases qué hace la compañía y cómo funciona su medicamento principal, en una imagen simple. `estado` no repite lo que ya muestran los recuadros (nombre, fase, enfermedad ni la palabra "aprobado"): cuenta solo lo adicional (para qué pacientes está aprobado, designaciones de la FDA, resultado del último estudio), en 1 o 2 frases.
3. **Fases válidas:** "Phase 1", "Phase 1/2", "Phase 2", "Phase 2/3", "Phase 2b/3", "Phase 3", "Under FDA review", "Approved (FDA)" o "Approved (China)" (u otro país entre paréntesis). Cada fase usada debe existir en el bloque `fases` de `data/biotech.json` (nombre de la fase -> explicación en inglés), porque la página la explica al tocarla.
4. **Hechos solo de la fuente:** no uses cifras ni fechas que no estén en una fuente; si un dato no aparece, no lo pongas. Firma Stag Research y sin menciones al proceso.

**Calendario "Qué ver este mes"** (`calendario` en `data/biotech.json`, se reemplaza completo cada mes): los eventos de las 15 compañías que caen en el mes que empieza, solo hechos de una fuente.
- Tipos (campo `tipo`, exactamente uno de estos): `Earnings` (presentación de resultados trimestrales o anuales), `Clinical data` (resultados topline, datos intermedios o finales de un estudio), `FDA` (fecha límite PDUFA, reunión de comité asesor u otra decisión regulatoria; también EMA u otro regulador, dicho en `evento`), `Conference` (presentación en un congreso médico, con el nombre del congreso) y `Other` (día del inversionista, inicio o fin de un estudio con fecha, etc.).
- Cada evento: `fecha` (AAAA-MM-DD; o `null` si la compañía solo dijo "este mes" o una ventana dentro del mes, y entonces `cuando` dice la ventana, por ejemplo "second half of November"), `ticker`, `tipo`, `evento` (una frase corta en lenguaje sencillo, sin opinión), `confirmada` (`true` si la compañía o el regulador publicaron la fecha; `false` si es una estimación de un calendario de resultados de terceros, que entonces debe ser una fuente seria y se nombra en `fuente_url`) y `fuente_url`.
- Solo eventos dentro del mes. Los de "fin de año", "cuarto trimestre" o "segundo semestre" no entran salvo que la compañía precise que caen en el mes. No inventes fechas.
- Campos del bloque: `mes` (AAAA-MM), `mes_texto` (por ejemplo "noviembre 2026"), `actualizado` (formato "Nov 1, 2026") y `eventos`.

```json
"calendario": {
  "mes": "2026-11", "mes_texto": "November 2026", "actualizado": "Nov 1, 2026",
  "eventos": [
    { "fecha": "2026-11-04", "ticker": "CYTK", "tipo": "Earnings", "evento": "Reports its third-quarter results.", "confirmada": true, "fuente_url": "https://..." },
    { "fecha": null, "cuando": "second half of November", "ticker": "XXXX", "tipo": "Clinical data", "evento": "...", "confirmada": true, "fuente_url": "https://..." }
  ]
}
```

Valida el archivo con `python3 -m json.tool data/biotech.json` y `python3 bot/publicar.py validar` antes del commit ("Biotecnología: actualización mensual AAAA-MM").

## Dónde se publica
Siempre con `python3 bot/publicar.py agregar hoy ARCHIVO.json` (el archivo lleva `{"notas": [...]}`), que agrega al inicio de `data/notas.json` y pone la hora real en `actualizado`; nunca la escribas a mano. El formato de cada nota está en "Biotechnology en Hoy". La portada (`index.html`) muestra las 3 notas más recientes y `yentonces.html` la edición completa, ambas con `assets/notas.js`.

## Biotechnology en Hoy (categoría `biotecnologia`, formato `hechos`)
Noticias de las 15 compañías de la sección Biotecnología (ver la lista arriba). Van **mezcladas con las demás notas de Hoy**, en formato de **solo hechos**.

**Reglas especiales (obligatorias):** sin opinión (sin lecturas alcista o bajista, ponderación, puntaje, impacto, afectados ni calificativos como "positivo", "negativo", "prometedor" o "decepcionante"; se puede decir que un estudio "cumplió su objetivo principal" cuando la compañía lo reporta así) y en lenguaje para un joven de 15 años. Valen las demás reglas obligatorias de Hoy.

**Fuentes:** comunicados de cada compañía (página de inversionistas, GlobeNewswire, Business Wire, PR Newswire, 8-K de la SEC), comunicados de la FDA y WebSearch. **Revisa una por una las compañías que indique la pre-revisión (paso 1b de «Tiempo y eficiencia»; si no hay pre-revisión de hoy, las 15)**: busca con WebSearch el nombre de cada compañía con la fecha (por ejemplo, "Faeth Therapeutics November 9 2026", también con `businesswire.com` y `globenewswire.com`) y abre su página de noticias para inversionistas. Las búsquedas agrupadas de varias compañías pierden comunicados; úsalas solo como complemento. **No entran** los avisos de bufetes de abogados que buscan demandantes, las notas promocionales ni los análisis del precio de la acción.

**Qué entra:** noticias de las últimas ~48 horas (96 los lunes o después de un festivo): resultados de ensayos, resultados financieros, financiamiento, decisiones o designaciones regulatorias, presentaciones en congresos, alianzas y cambios relevantes de la administración. **Sin límite de notas de biotecnología:** publica todas las noticias relevantes de las 15 compañías (una nota por comunicado sustantivo). No entran los avisos de simple participación en conferencias ni las concesiones de acciones a empleados (inducement grants). Si no hay noticias, no publiques ninguna (nunca rellenes).

**Formato** (se agrega con `python3 bot/publicar.py agregar hoy ARCHIVO.json`, que valida el formato `hechos`):

```json
{
  "id": "AAAA-MM-DD-NN",
  "fecha": "AAAA-MM-DD",
  "categoria": "biotecnologia",
  "formato": "hechos",
  "empresa": "Ticker de una de las 15 compañías",
  "fecha_noticia": "AAAA-MM-DD",
  "titulo": "",
  "resumen": "Qué pasó, 1 a 2 frases.",
  "contexto": "Antecedentes, 2 a 4 frases, solo hechos de la fuente.",
  "que_significa": "Explicación sencilla de qué significa y por qué importa, 3 a 5 frases, sin opinión.",
  "mirar": "El próximo dato o fecha relacionado (1 frase).",
  "terminos": ["FDA", "Fases de un ensayo clínico"],
  "fuente": "",
  "url": "https://..."
}
```
