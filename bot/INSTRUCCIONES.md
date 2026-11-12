# Stag Research — Instrucciones del bot diario

La sección de noticias diarias se llama **Hoy** (página `yentonces.html`, datos en `data/notas.json`). `data/notas.json` guarda solo la edición del día; las anteriores pasan a `data/archivo/AAAA-MM.json` (un archivo por mes), donde solo se conservan las notas de relevancia 8 o más y las de solo hechos (biotecnología e informe de la deuda). `python3 bot/publicar.py agregar hoy` archiva la edición anterior automáticamente; no edites esos archivos a mano. Antes se llamaba ¿Y Entonces?; ese nombre ya no se usa en el sitio.

Este archivo es la fuente única de reglas editoriales. Lo usa hoy la tarea programada de Claude y, más adelante, el script con la API de Anthropic. Si cambias una regla, cámbiala aquí.

## Prioridades de la edición (decisión del dueño)
Lo más importante de cada edición son **Biotecnología en Hoy** y **Mi portafolio**: publica **todas** las noticias relevantes de las 15 compañías de biotecnología y de los 9 activos de Mi portafolio, sin límite de cantidad. Del resto solo entran **una nota de Colombia y mercados** (la de mayor puntaje) y **una nota de La región** (la de mayor puntaje). Todo lo demás es ruido y no se publica. El tiempo de búsqueda se dedica primero a biotecnología y portafolio.

## Cuándo corre
Una vez al día. La corrida empieza a las 8:40 a. m. hora Bogotá para que la edición quede publicada hacia las 9:00 a. m.: la sección Hoy debe quedar publicada en unos 20 minutos.

## Tiempo y eficiencia (obligatorio)
1. **No leas los archivos de `data/` completos** (no hace falta: `estado` resume lo necesario) ni los reescribas a mano. Usa `python3 bot/publicar.py estado` para saber la fecha, si ya hay notas de hoy, los siguientes id, los indicadores actuales, los términos del glosario y la lista de URL ya publicadas (`/tmp/stag_urls.txt`). Para publicar, escribe las notas nuevas en un archivo temporal y agrégalas con `python3 bot/publicar.py agregar hoy|latam ARCHIVO.json`; los términos nuevos con `glosario ARCHIVO.json` (antes de agregar las notas) y los indicadores con `mercado ARCHIVO.json`. El script valida campos, términos, puntajes y URL repetidas y pone la hora real en `actualizado`; si rechaza algo, corrige el archivo temporal y vuelve a correrlo. Termina con `python3 bot/publicar.py validar`.
2. **Una sola vez por fuente:** cada URL se intenta una vez. Si una página no responde, falla o pide permiso, sigue con la siguiente fuente de la lista; no busques sitios alternos fuera de los indicados aquí.
3. **Lee primero los titulares:** revisa los RSS, preselecciona por título y descripción, y abre el artículo completo solo de las ~3 mejores candidatas de Colombia y mercados y de las ~2 mejores de La región; de Mi portafolio y biotecnología abre todas las candidatas.
4. **Una sola publicación:** cuando tengas todas las notas del día (biotecnología, Mi portafolio, la nota de Colombia y mercados y la de La región) y los indicadores, valida y publica todo en un solo commit ("Edición AAAA-MM-DD") y un push.
5. **Límite de tiempo:** si a las 9:05 a. m. (hora Bogotá) todavía estás buscando, deja de buscar y publica lo que tengas validado.

## Fuentes (RSS)
- La República: https://www.larepublica.co/rss
- Portafolio, economía: https://www.portafolio.co/rss/economia.xml
- Portafolio, negocios: https://www.portafolio.co/rss/negocios.xml
- Portafolio, internacional: https://www.portafolio.co/rss/internacional.xml
- Valora Analitik: https://www.valoraanalitik.com/feed/
- El Tiempo, economía: https://www.eltiempo.com/rss/economia.xml
- Semana, economía: https://www.semana.com/arc/outboundfeeds/rss/category/economia/?outputType=xml
- Bloomberg Línea: https://www.bloomberglinea.com/arc/outboundfeeds/rss/?outputType=xml

Fuentes de **La región** (ver la sección "La región" abajo):
- Brasil, InfoMoney (en portugués): https://www.infomoney.com.br/feed/
- México, El Financiero, economía: https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/category/economia/?outputType=xml
- México, El Financiero, mercados: https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/category/mercados/?outputType=xml
- Argentina, Ámbito, economía: https://www.ambito.com/rss/pages/economia.xml
- Argentina, Infobae, economía: https://www.infobae.com/arc/outboundfeeds/rss/category/economia/
- Bloomberg Línea (el RSS general de arriba) también sirve para la región.

Páginas de portada (respaldo si un RSS falla; traen los titulares con sus enlaces):
- La República: https://www.larepublica.co/
- Valora Analitik: https://www.valoraanalitik.com/

Chile y Perú no tienen RSS propio (los de Diario Financiero y Gestión se quitaron por fallar): sus noticias de alto impacto se buscan con WebSearch o en Bloomberg Línea.

**Si WebFetch rechaza una URL por permiso** (error PROVENANCE_REQUIRED), no la reintentes: busca el medio con WebSearch y abre las URL que devuelva la búsqueda. Cualquier fuente que falle tres veces seguidas se quita de esta lista.

X (Twitter) queda por fuera hasta que haya presupuesto para su API.

## Qué noticias entran
Solo noticias publicadas en las últimas ~24 horas sobre:
- `bvc`: emisores listados en la Bolsa de Valores de Colombia (resultados, dividendos, información relevante, operaciones corporativas).
- `macro`: macro Colombia (Banco de la República, inflación, tasa de cambio, TES, fiscal, regulación con impacto en mercado).
- `commodities`: petróleo y commodities con impacto en Colombia.
- `latam`: empresas latinoamericanas relevantes para el inversionista colombiano.
- `internacional`: mercados internacionales (Reserva Federal, Wall Street, bonos de EE. UU., dólar global) cuando tengan efecto sobre Colombia.
- `politica`: política económica y regulación (reformas, presupuesto, impuestos, pensiones, comercio exterior).
- `sectores`: sectores reales (energía, construcción, vivienda, comercio, transporte, industria).
- `region`: **La región**, noticias de Brasil, México y Argentina (y de Chile o Perú cuando sean de alto impacto). Tiene reglas propias: ver la sección "La región" abajo.

Excluidas de la sección Hoy: biotecnología (tiene su propia página, que no publica noticias; ver "Biotecnología" abajo), opinión, entretenimiento, deportes, política sin impacto de mercado, contenido promocional.

## Cómo se eligen las noticias (puntaje de relevancia)
1. Revisa **todas** las fuentes y arma la lista de candidatas que cumplan los temas de arriba. Si una noticia aparece en varios medios, es una sola candidata (usa la fuente más completa). Descarta las URL ya publicadas (lista en `/tmp/stag_urls.txt`, que crea `python3 bot/publicar.py estado`).
2. Califica cada candidata de 0 a 10 con estos criterios:
   - **Alcance (0–4):** cuántos de los cuatro tipos de activo (acciones colombianas, renta fija, dólar/exterior, CDT y ahorro) tendrían un efecto distinto de "neutral". En la nota publicada debe coincidir con el número de activos no neutrales del bloque `impacto`.
   - **Materialidad (0–3):** 3 = mueve directamente tasas de interés, dólar, finanzas públicas o resultados de emisores grandes de la BVC; 2 = efecto indirecto o concentrado en un sector; 1 = efecto marginal; 0 = sin efecto económico.
   - **Novedad (0–2):** 2 = dato, decisión o hecho nuevo (cifra oficial, decisión de política, resultado, evento); 1 = anuncio, propuesta, proyección o negociación en curso; 0 = análisis, recopilación o seguimiento de algo ya conocido.
   - **Fuente (0–1):** 1 si el artículo trae cifras verificables y cita fuentes primarias; 0 si no.
3. **Prioridad automática:** tienen preferencia para ocupar el único cupo de Colombia y mercados, aunque su puntaje sea menor, las decisiones de tasa del Banco de la República, los datos del DANE (inflación, PIB, desempleo), las medidas del Ministerio de Hacienda con efecto fiscal y la información relevante de emisores de la BVC publicada en las últimas 24 horas.
4. Publica **una sola nota de Colombia y mercados** (todas las categorías menos `region`, `portafolio` y `biotecnologia`): la de mayor puntaje. La de `region` se elige aparte (ver "La región"). No publiques candidatas con puntaje menor a 5 (salvo prioridad automática). Si un día no hay candidatas con 5 o más, no publiques ninguna; nunca rellenes.
5. Ordena las notas de la edición de mayor a menor puntaje y guarda el puntaje en cada nota (campo `puntaje`).

## La región (categoría `region`)
La página Hoy incluye **La región**: lo más importante de las economías grandes de América Latina. Sus notas van mezcladas con las demás de la edición, ordenadas por puntaje, con una etiqueta del país. Se publica en la misma corrida y en el mismo archivo (`data/notas.json`), con `python3 bot/publicar.py agregar hoy`, en la misma edición y con la numeración normal de id.

**Países:** Brasil, México y Argentina tienen prioridad. Chile y Perú entran solo con noticias de alto impacto (decisión de tasa del banco central, elecciones, crisis, cambio de calificación soberana). Cada nota lleva el campo `pais`: `"Brasil"`, `"México"`, `"Argentina"`, `"Chile"` o `"Perú"`.

**Qué entra:** decisiones de tasa y comunicados de los bancos centrales (Banco Central do Brasil, Banxico, BCRA, Banco Central de Chile, BCRP); inflación, PIB, empleo y cifras fiscales oficiales; movimientos fuertes de la moneda, la bolsa o el riesgo país; elecciones, reformas y medidas económicas de gobierno; calificaciones soberanas; y hechos de grandes empresas de esos países que muevan su mercado. Mismas reglas de vigencia (~24 horas). Si la noticia es de un activo de Mi portafolio (por ejemplo MercadoLibre o Nu), va con categoría `portafolio` y no aquí.

**Cuántas:** una sola nota por día, la de mayor puntaje entre todos los países (0 si ninguna llega al mínimo). Mínimo 5 puntos para entrar. Si un día no hay noticias regionales con 5 puntos o más, no publiques ninguna (nunca rellenes).

**Puntaje para La región:** los mismos cuatro criterios, con esta materialidad:
- **Materialidad (0–3):** 3 = mueve las tasas, la moneda, la bolsa o las finanzas públicas de Brasil, México o Argentina, o afecta directamente a emisores de la BVC con negocios en ese país; 2 = efecto sectorial o indirecto, o un hecho macro mayor de Chile o Perú; 1 = efecto marginal; 0 = sin efecto económico.
- **Alcance (0–4)**, **Novedad (0–2)** y **Fuente (0–1)**: igual que en las demás notas.

**Formato:** igual que cualquier nota de Hoy, más `pais`. Las lecturas alcista y bajista, `peso_alcista` y el bloque `impacto` se escriben desde la perspectiva de quien invierte desde Colombia:
- `dolar` (ahorros e inversiones en dólares o en el exterior) es el activo que más se mueve: incluye acciones, ETF o fondos de ese país o de la región, medidos en pesos.
- `acciones` se marca distinto de "neutral" solo si la noticia afecta a emisores de la BVC con negocios en ese país (por ejemplo, ISA o Grupo Energía Bogotá en Brasil, Perú o Chile) o al mercado colombiano por contagio regional, y el `detalle` explica cómo.
- `renta_fija` y `cdt`: "neutral" salvo que haya un canal claro hacia las tasas en Colombia.
- El `contexto` explica en una frase por qué esa economía le importa a quien invierte desde Colombia.
- Las fuentes en portugués se cuentan en español, con tus palabras (nunca traduzcas frases textuales).

## Formato de cada nota
- `titulo`: titular propio, claro, máximo ~90 caracteres. No copies el titular del medio.
- `resumen`: qué pasó, en 1 a 2 frases con tus palabras. Es lo que se ve en la portada.
- `contexto`: antecedentes en 2 a 4 frases: cifras de comparación, causas y hechos relacionados, solo los que aparezcan en la fuente.
- `afectados`: lista de 2 a 5 etiquetas cortas con quién se ve afectado (emisores, sectores o variables), por ejemplo "Ecopetrol", "Bancos", "Peso colombiano", "TES".
- `alcista`: lectura alcista (bullish) en 3 a 5 frases: por qué podría ser positivo, para quién y por qué mecanismo.
- `bajista`: lectura bajista (bearish) en 3 a 5 frases: por qué podría ser negativo, para quién y por qué mecanismo.
- `peso_alcista`: ponderación de la lectura alcista, entero entre 20 y 80 en múltiplos de 5 (la bajista es 100 menos ese número). Refleja cuál de las dos lecturas tiene más sustento en la evidencia de la fuente, desde la perspectiva del mercado colombiano. Usa 50 solo cuando el balance sea realmente parejo; no lo uses por defecto.
- `impacto`: cómo afecta la noticia al portafolio, después de ponderar las dos lecturas. Tiene dos partes:
  - `conclusion`: 2 a 4 frases. Empieza diciendo qué lectura pesa más y por qué, y luego explica qué significa para quien invierte. Debe ser coherente con `peso_alcista` (la página calcula el "efecto neto" a partir de ese número: 70-80 positivo, 55-65 moderadamente positivo, 50 neutral, 35-45 moderadamente negativo, 20-30 negativo).
  - `activos`: exactamente cuatro elementos, en este orden: `acciones` (acciones colombianas), `renta_fija` (TES y bonos ya en el portafolio: si las tasas suben, su precio baja), `dolar` (ahorros e inversiones en dólares o en el exterior, medidos en pesos) y `cdt` (CDT y ahorro en pesos: tasas altas los favorecen). Cada uno con `efecto` (`positivo`, `negativo`, `neutral` o `mixto`) y `detalle` (una frase con el porqué). Usa `neutral` con "Sin efecto directo." cuando la noticia no toque ese activo.
  - Es un efecto general por tipo de activo, nunca una recomendación: no digas qué hacer con el portafolio.
- `mirar`: el próximo dato, fecha o anuncio que confirmaría o cambiaría la lectura (1 frase).
- `terminos`: lista de 2 a 5 términos técnicos usados en la nota que un inversionista no profesional podría no conocer (por ejemplo "TES", "Prima de riesgo país"). Cada término debe existir en `data/glosario.json` con exactamente el mismo nombre.

## Reglas obligatorias
1. **Derechos de autor:** nunca copies frases del artículo. Todo va con tus palabras, y siempre con el enlace a la fuente original.
2. **Solo hechos de la fuente:** no inventes cifras, fechas ni citas. Si un dato no está en la fuente, no lo pongas. Ante la duda, omite.
3. **No es recomendación:** prohibido "comprar", "vender", "mantener", precios objetivo o instrucciones de acción. Las lecturas son escenarios, no consejos.
4. **Siempre los dos lados:** toda nota lleva lectura alcista y bajista, aunque uno de los lados sea más débil.
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
En cada edición actualiza los indicadores de la barra superior. Primero mira con `python3 bot/publicar.py estado` qué fechas tienen ya: si un indicador ya tiene el dato del último día hábil (por ejemplo, un sábado, domingo o festivo), no lo busques. Para cada indicador, intenta las fuentes en este orden, una vez cada una. **Si todas fallan (por ejemplo, con PROVENANCE_REQUIRED), haz una búsqueda con WebSearch** (por ejemplo, "precio Brent cierre [fecha]", "MSCI Colcap cierre [fecha]") y abre una o dos de las URL que devuelva. Acepta solo un dato con fecha explícita de un medio de noticias, una comisionista de bolsa o la entidad oficial (no widgets ni conversores de divisas). Si tampoco así hay un dato con fecha, conserva el valor anterior. En `fuente` pon el origen del dato y el medio (por ejemplo, "BVC vía Acciones y Valores").
- **Dólar/peso (USD/COP):** la GitHub Action `.github/workflows/indicadores.yml` (script `bot/indicadores.py`, símbolo `USDCOP=X` de Yahoo Finance) lo actualiza sola, igual que el Brent. Es una cotización de mercado, no la TRM oficial. La edición diaria no lo toca ni lo busca.
- **Brent:** la GitHub Action `.github/workflows/indicadores.yml` (script `bot/indicadores.py`, con Yahoo Finance) lo actualiza sola a las 4:17 a. m. y a las 4:27 p. m. hora Bogotá. Si `estado` ya muestra el cierre del último día hábil, no lo busques. Si no, (1) la nota diaria de La República sobre precios del dólar y del petróleo; (2) `https://www.larepublica.co/indicadores-economicos/commodities/petroleo`.
- **Precios de Mi portafolio** (`data/precios.json`, se muestran en `portafolio.html`): los actualiza la misma GitHub Action. La edición diaria no los toca.
- **MSCI COLCAP** (Yahoo Finance no tiene el índice, así que no es automático): la nota de cierre de la BVC de Valora Analitik o La República del último día hábil (en los RSS o en sus portadas): último valor, variación porcentual y fecha.
- **Tasa del Banco de la República** e **inflación anual:** actualízalas solo cuando una noticia o fuente oficial informe un cambio (decisión de la junta del Banco de la República; dato mensual del IPC del DANE). Si no hay cambio, deja el valor anterior.

Si una fuente no responde, conserva el valor anterior de ese indicador. El MSCI COLCAP se actualiza todos los días hábiles: revisa que su fecha corresponda al último día hábil antes de publicar. Formato:

```json
{
  "usdcop": { "valor": 3307.36, "cambio_pct": 1.01, "fecha": "2026-11-11", "fuente": "Dólar/peso colombiano (mercado) vía Yahoo Finance" },
  "brent": { "valor": 104.72, "cambio_pct": 0.42, "fecha": "2026-10-09", "fuente": "Investing.com" },
  "colcap": { "valor": 2531.23, "cambio_pct": 0.23, "fecha": "2026-10-09", "fuente": "BVC vía La República" },
  "tasa_banrep": { "valor": 12.25, "fuente": "Banco de la República" },
  "inflacion": { "valor": 6.29, "periodo": "sep 2026", "fuente": "DANE" },
  "actualizado": "AAAA-MM-DD"
}
```


## Biotecnología (`data/biotech.json`, página `biotecnologia.html`)
**La corrida diaria no modifica `data/biotech.json`** ni esta página, que no tiene noticias: solo la tabla "Panorama de biotecnológicas" y las fichas de las compañías. Las noticias de estas 15 compañías se publican en Hoy, con formato de solo hechos (ver "Biotecnología en Hoy" abajo).

**Actualización mensual:** el día 1 de cada mes (o cuando el dueño lo pida) se revisa cada compañía y se actualizan, solo con hechos confirmados por una fuente:
- `panorama.companias`: una fila por compañía con `nombre`, `ticker`, `medicamento`, `fase`, `enfermedad`, `hito` (el próximo paso), `hito_fecha` y `fuente_url`. Ordenadas por ticker.
- `companias`: una ficha por compañía, en el mismo orden y con las mismas compañías que el panorama, con `ticker`, `nombre`, `bolsa`, `medicamento_principal` (`nombre`, `fase`, `enfermedad`), `que_hace`, `estado`, `hitos` (`texto`, `fecha`) y `fuente_url`.
- `panorama.actualizado` y `actualizado`: la fecha de la revisión, en formato "1 nov 2026".

**Compañías (15):** Ascentage Pharma (AAPG), Celcuity (CELC), Cytokinetics (CYTK), Edgewise Therapeutics (EWTX), Faeth Therapeutics (FTH), IDEAYA Biosciences (IDYA), Immunome (IMNM), Kardigan (KARD), Palvella Therapeutics (PVLA), Arcus Biosciences (RCUS), Relay Therapeutics (RLAY), Revolution Medicines (RVMD), Rhythm Pharmaceuticals (RYTM), Tango Therapeutics (TNGX) y Wave Life Sciences (WVE). Solo el dueño agrega o quita compañías.

**Fuentes:** comunicados de prensa y resultados trimestrales de cada compañía (página de inversionistas, GlobeNewswire, Business Wire, formularios 8-K de la SEC), y comunicados de la FDA o de otros reguladores. Usa la fuente más reciente; no uses sitios de alertas automáticas de acciones, avisos de bufetes de abogados ni análisis del precio de la acción.

**Qué revisar en cada compañía:** si el medicamento principal cambió de fase, fue aprobado o cambió; si un hito ya ocurrió (quítalo y, si hay resultado, cuéntalo en `estado`); y cuáles son los próximos hitos con fecha. Los hitos van del más cercano al más lejano, sin hitos ya pasados; el primero de la ficha debe coincidir con el `hito` del panorama.

**Reglas (obligatorias):**
1. **Sin opinión:** nada de lecturas alcistas o bajistas, ponderaciones, puntajes, recomendaciones ni calificativos como "positivo", "bueno", "prometedor" o "decepcionante". Solo hechos. Se puede decir que un estudio "cumplió su objetivo principal" o "dio resultados positivos" cuando la compañía lo reporta así.
2. **Lenguaje para un joven de 15 años:** frases cortas y sin jerga. `que_hace` explica en 1 o 2 frases qué hace la compañía y cómo funciona su medicamento principal, en una imagen simple. `estado` no repite lo que ya muestran los recuadros (nombre, fase, enfermedad ni la palabra "aprobado"): cuenta solo lo adicional (para qué pacientes está aprobado, designaciones de la FDA, resultado del último estudio), en 1 o 2 frases.
3. **Fases válidas:** "Fase 1", "Fase 1/2", "Fase 2", "Fase 2/3", "Fase 2b/3", "Fase 3", "En revisión FDA", "Aprobado (FDA)" o "Aprobado (China)" (u otro país entre paréntesis). Cada fase usada debe existir en `data/glosario.json`, porque la página la explica al tocarla.
4. **Hechos solo de la fuente:** no uses cifras ni fechas que no estén en una fuente; si un dato no aparece, no lo pongas. Firma Stag Research y sin menciones al proceso.

**Calendario "Qué ver este mes"** (`calendario` en `data/biotech.json`, se reemplaza completo cada mes): los eventos de las 15 compañías que caen en el mes que empieza, solo hechos de una fuente.
- Tipos (campo `tipo`, exactamente uno de estos): `Resultados` (presentación de resultados trimestrales o anuales), `Datos clínicos` (resultados topline, datos intermedios o finales de un estudio), `FDA` (fecha límite PDUFA, reunión de comité asesor u otra decisión regulatoria; también EMA u otro regulador, dicho en `evento`), `Congreso` (presentación en un congreso médico, con el nombre del congreso) y `Otro` (día del inversionista, inicio o fin de un estudio con fecha, etc.).
- Cada evento: `fecha` (AAAA-MM-DD; o `null` si la compañía solo dijo "este mes" o una ventana dentro del mes, y entonces `cuando` dice la ventana, por ejemplo "segunda quincena de noviembre"), `ticker`, `tipo`, `evento` (una frase corta en lenguaje sencillo, sin opinión), `confirmada` (`true` si la compañía o el regulador publicaron la fecha; `false` si es una estimación de un calendario de resultados de terceros, que entonces debe ser una fuente seria y se nombra en `fuente_url`) y `fuente_url`.
- Solo eventos dentro del mes. Los de "fin de año", "cuarto trimestre" o "segundo semestre" no entran salvo que la compañía precise que caen en el mes. No inventes fechas.
- Campos del bloque: `mes` (AAAA-MM), `mes_texto` (por ejemplo "noviembre 2026"), `actualizado` (formato "1 nov 2026") y `eventos`.

```json
"calendario": {
  "mes": "2026-11", "mes_texto": "noviembre 2026", "actualizado": "1 nov 2026",
  "eventos": [
    { "fecha": "2026-11-04", "ticker": "CYTK", "tipo": "Resultados", "evento": "Presenta sus resultados del tercer trimestre.", "confirmada": true, "fuente_url": "https://..." },
    { "fecha": null, "cuando": "segunda quincena de noviembre", "ticker": "XXXX", "tipo": "Datos clínicos", "evento": "...", "confirmada": true, "fuente_url": "https://..." }
  ]
}
```

Valida el archivo con `python3 -m json.tool data/biotech.json` y `python3 bot/publicar.py validar` antes del commit ("Biotecnología: actualización mensual AAAA-MM").

## Dónde se publica
Se agrega al inicio del arreglo `notas` de `data/notas.json` y se actualiza `actualizado`, siempre con `python3 bot/publicar.py agregar hoy ARCHIVO.json` (el archivo lleva `{"notas": [...]}`). La hora de `actualizado` debe ser la hora real de publicación; el script la toma del reloj, así que nunca la escribas de memoria ni la estimes. Formato: "12 oct 2026, 9:15 a. m. (hora Bogotá)". Esquema de cada nota:

```json
{
  "id": "2026-10-12-01",
  "fecha": "2026-10-12",
  "categoria": "bvc | macro | commodities | latam | internacional | politica | sectores | region",
  "pais": "solo en categoría region: Brasil | México | Argentina | Chile | Perú",
  "puntaje": { "total": 8, "alcance": 3, "materialidad": 3, "novedad": 1, "fuente": 1 },
  "titulo": "",
  "resumen": "",
  "contexto": "",
  "afectados": ["", ""],
  "peso_alcista": 55,
  "alcista": "",
  "bajista": "",
  "impacto": {
    "conclusion": "",
    "activos": [
      { "activo": "acciones", "efecto": "negativo", "detalle": "" },
      { "activo": "renta_fija", "efecto": "positivo", "detalle": "" },
      { "activo": "dolar", "efecto": "neutral", "detalle": "Sin efecto directo." },
      { "activo": "cdt", "efecto": "positivo", "detalle": "" }
    ]
  },
  "mirar": "",
  "terminos": ["TES", "Prima de riesgo país"],
  "fuente": "Portafolio",
  "url": "https://..."
}
```

La portada (`index.html`) muestra las 3 notas más recientes en versión corta (título y resumen) y la página `yentonces.html` muestra la edición completa y el archivo histórico. Ambas leen ese archivo mediante `assets/notas.js`. El aviso legal ya está fijo al final de cada página.

## Informe mensual de la deuda pública (dentro de Hoy)
Se publica el día 15 de cada mes, en una tarea programada aparte. Es una nota de **solo hechos** dentro de la sección Hoy: sin lecturas alcista o bajista, sin ponderación, sin puntaje y sin impacto por activo.

**Fuente:** https://deudacolombiana.com (reloj de la deuda pública bruta del Gobierno Nacional Central, con datos del Ministerio de Hacienda e Investor Relations Colombia). Léela con WebFetch una sola vez. Usa solo las cifras oficiales con su fecha de corte; el contador "en tiempo real" del sitio es una estimación y, si lo mencionas, dilo así. Si la página no carga o no trae un corte con fecha, no publiques nada y termina con "NO PUBLICADO:" y la razón.

**Qué entra:** la deuda bruta total del último corte, la deuda como porcentaje del PIB, la deuda por colombiano, los intereses que informe el sitio y cómo cambió frente al corte anterior que muestre el propio sitio. Si el corte no cambió desde el informe del mes pasado (`python3 bot/publicar.py estado` muestra el último informe de la deuda con su corte y cifras), dilo en el resumen en lugar de repetir las cifras como si fueran nuevas.

**Reglas:** las mismas reglas obligatorias de Hoy (derechos de autor, solo hechos de la fuente, sin recomendaciones, tuteo, firma Stag Research, sin menciones al proceso), más: prohibidos los calificativos como "preocupante", "alarmante", "positivo" o "negativo". Solo cifras y su explicación en lenguaje sencillo.

**Formato** (se agrega con `python3 bot/publicar.py agregar hoy ARCHIVO.json`, que valida el formato `informe`):

```json
{
  "id": "AAAA-MM-DD-01",
  "fecha": "AAAA-MM-DD",
  "categoria": "deuda",
  "formato": "informe",
  "fecha_noticia": "AAAA-MM-DD (fecha de corte de los datos)",
  "titulo": "",
  "resumen": "Qué muestra el último corte, 1 a 2 frases.",
  "datos": [
    { "etiqueta": "Deuda bruta", "valor": "" },
    { "etiqueta": "Deuda / PIB", "valor": "" },
    { "etiqueta": "Por colombiano", "valor": "" }
  ],
  "contexto": "Comparación con cortes anteriores y hechos relacionados que traiga la fuente, 2 a 4 frases.",
  "que_significa": "Explicación sencilla de las cifras, 2 a 4 frases, sin opinión.",
  "mirar": "El próximo dato o fecha relevante (1 frase).",
  "terminos": ["Deuda pública", "PIB"],
  "fuente": "Deuda Colombiana (datos del Ministerio de Hacienda)",
  "url": "https://deudacolombiana.com"
}
```

`datos` lleva de 3 a 8 cifras cortas. Como la URL siempre es la misma, el script permite repetirla en notas de categoría `deuda`. Commit "Informe deuda pública AAAA-MM" y push a main.


## Mi portafolio (dentro de Hoy, categoría `portafolio`)
Noticias de los activos que Stag Research tiene en Mi portafolio. Van **mezcladas con las demás notas de Hoy**, ordenadas por puntaje, con el **formato completo** de Hoy (contexto, afectados, lecturas alcista y bajista, `peso_alcista`, `impacto` con los cuatro activos, `puntaje`, `mirar`, `terminos`) y todas sus reglas obligatorias. La página les pone el sello "En Mi portafolio" para que el lector sepa que hay una posición.

**Activos (solo estos):** Nu Holdings (`NU`), JPMorgan Chase (`JPM`), MercadoLibre (`MELI`), Hermès (`RMS`, Euronext París), Brookfield Corporation (`BN`), Grupo Argos preferencial (`PFGRUPOARG`, BVC; las noticias de Grupo Argos sirven para esta acción), Bolsa de Valores de Colombia (`BVC`), ProShares UltraPro QQQ (`TQQQ`) y Global X Copper Miners ETF (`COPX`).

**Fuentes:** comunicados y resultados de cada compañía (página de inversionistas, formularios de la SEC 8-K, 6-K, 10-Q y 20-F), información relevante de la Superfinanciera para PFGRUPOARG y BVC, los RSS de Hoy y WebSearch por nombre de compañía (una búsqueda por activo). Para TQQQ y COPX solo entran hechos del propio fondo (cambios en el fondo, en su índice o en su emisor) o del activo que siguen cuando sea un dato importante (por ejemplo, un movimiento fuerte del Nasdaq-100 o del precio del cobre). **No uses** sitios de alertas automáticas de acciones, cambios de calificación de analistas sin otra información ni notas de "acciones para comprar".

**Qué entra:** noticias de las últimas ~48 horas (72 en fines de semana o festivos): resultados, dividendos, recompras, emisiones, adquisiciones, cambios de gobierno corporativo o regulatorios y hechos del sector que afecten directamente al activo. **Sin límite de notas de portafolio:** publica todas las noticias relevantes de los 9 activos (una nota por hecho). Aplica el umbral de puntaje 5 y la regla de nunca rellenar. Revisa cada activo, uno por uno.

**Formato:** el de una nota de Hoy con `"categoria": "portafolio"` y `"empresa"` (el ticker de la lista). En `impacto`, el activo `dolar` explica el efecto para quien tiene ese activo en el exterior; las lecturas siguen siendo escenarios, nunca una recomendación de comprar, vender o mantener.

## Biotecnología en Hoy (categoría `biotecnologia`, formato `hechos`)
Noticias de las 15 compañías de la sección Biotecnología (ver la lista arriba). Van **mezcladas con las demás notas de Hoy**, en formato de **solo hechos**.

**Reglas especiales (obligatorias):** sin opinión (sin lecturas alcista o bajista, ponderación, puntaje, impacto, afectados ni calificativos como "positivo", "negativo", "prometedor" o "decepcionante"; se puede decir que un estudio "cumplió su objetivo principal" cuando la compañía lo reporta así) y en lenguaje para un joven de 15 años. Valen las demás reglas obligatorias de Hoy.

**Fuentes:** comunicados de cada compañía (página de inversionistas, GlobeNewswire, Business Wire, PR Newswire, 8-K de la SEC), comunicados de la FDA y WebSearch. **Revisa las 15 compañías una por una**: busca con WebSearch el nombre de cada compañía con la fecha (por ejemplo, "Faeth Therapeutics November 9 2026", también con `businesswire.com` y `globenewswire.com`) y abre su página de noticias para inversionistas. Las búsquedas agrupadas de varias compañías pierden comunicados; úsalas solo como complemento. **No entran** los avisos de bufetes de abogados que buscan demandantes, las notas promocionales ni los análisis del precio de la acción.

**Qué entra:** noticias de las últimas ~48 horas (72 en fines de semana o festivos): resultados de ensayos, resultados financieros, financiamiento, decisiones o designaciones regulatorias, presentaciones en congresos, alianzas y cambios relevantes de la administración. **Sin límite de notas de biotecnología:** publica todas las noticias relevantes de las 15 compañías (una nota por comunicado sustantivo). No entran los avisos de simple participación en conferencias ni las concesiones de acciones a empleados (inducement grants). Si no hay noticias, no publiques ninguna (nunca rellenes).

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
