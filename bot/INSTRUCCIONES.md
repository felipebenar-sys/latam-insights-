# Stag Research — Instrucciones del bot diario

La sección de noticias diarias se llama **Hoy** (página `yentonces.html`, datos en `data/notas.json`). Antes se llamaba ¿Y Entonces?; ese nombre ya no se usa en el sitio.

Este archivo es la fuente única de reglas editoriales. Lo usa hoy la tarea programada de Claude y, más adelante, el script con la API de Anthropic. Si cambias una regla, cámbiala aquí.

## Cuándo corre
Una vez al día, publicado a las 7:00 a. m. hora Bogotá. La corrida empieza a las 6:45 a. m.: la sección Hoy debe quedar publicada en unos 20 minutos.

## Tiempo y eficiencia (obligatorio)
1. **No leas los archivos de `data/` completos** (notas.json pesa cientos de KB y crece cada día) ni los reescribas a mano. Usa `python3 bot/publicar.py estado` para saber la fecha, si ya hay notas de hoy, los siguientes id, los indicadores actuales, los términos del glosario y la lista de URL ya publicadas (`/tmp/stag_urls.txt`). Para publicar, escribe las notas nuevas en un archivo temporal y agrégalas con `python3 bot/publicar.py agregar hoy|latam ARCHIVO.json`; los términos nuevos con `glosario ARCHIVO.json` (antes de agregar las notas) y los indicadores con `mercado ARCHIVO.json`. El script valida campos, términos, puntajes y URL repetidas y pone la hora real en `actualizado`; si rechaza algo, corrige el archivo temporal y vuelve a correrlo. Termina con `python3 bot/publicar.py validar`.
2. **Una sola vez por fuente:** cada URL se intenta una vez. Si una página no responde, falla o pide permiso, sigue con la siguiente fuente de la lista; no busques sitios alternos fuera de los indicados aquí.
3. **Lee primero los titulares:** revisa los RSS, preselecciona por título y descripción, y abre el artículo completo solo de las ~10 mejores candidatas de Hoy, de las ~4 mejores de La región y de las candidatas de cobertura.
4. **Publica por partes:** primero la sección Hoy y los indicadores (commit "Edición AAAA-MM-DD" y push). Después Cobertura LatAm en un segundo commit ("Edición AAAA-MM-DD, cobertura") y push. Así la edición principal no espera a la cobertura.
5. **Límite de tiempo:** si a las 7:30 a. m. (hora Bogotá) la cobertura no está lista, publica lo que tengas validado y termina.

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
- Chile, Diario Financiero: https://www.df.cl/noticias/site/list/port/rss.xml
- Perú, Gestión, economía: https://gestion.pe/arc/outboundfeeds/rss/category/economia/?outputType=xml
- Bloomberg Línea (el RSS general de arriba) también sirve para la región.

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
3. **Prioridad automática:** entran siempre, aunque su puntaje sea menor, las decisiones de tasa del Banco de la República, los datos del DANE (inflación, PIB, desempleo), las medidas del Ministerio de Hacienda con efecto fiscal y la información relevante de emisores de la BVC publicada en las últimas 24 horas.
4. Publica las de mayor puntaje hasta completar **6 a 8 notas de Colombia y mercados** (todas las categorías menos `region`), con **máximo 3 por categoría**. Las de `region` se eligen aparte y se suman a esas (ver "La región"). No publiques candidatas con puntaje menor a 5 (salvo prioridad automática). Si un día (por ejemplo, un festivo) no hay suficientes candidatas con 5 o más, publica menos; nunca rellenes.
5. Ordena las notas de la edición de mayor a menor puntaje y guarda el puntaje en cada nota (campo `puntaje`).

## La región (categoría `region`)
La página Hoy muestra, debajo de las notas de Colombia, un bloque fijo llamado **La región** con lo más importante de las economías grandes de América Latina. Se publica en la misma corrida y en el mismo archivo (`data/notas.json`), con `python3 bot/publicar.py agregar hoy`, en la misma edición y con la numeración normal de id.

**Países:** Brasil, México y Argentina tienen prioridad. Chile y Perú entran solo con noticias de alto impacto (decisión de tasa del banco central, elecciones, crisis, cambio de calificación soberana). Cada nota lleva el campo `pais`: `"Brasil"`, `"México"`, `"Argentina"`, `"Chile"` o `"Perú"`.

**Qué entra:** decisiones de tasa y comunicados de los bancos centrales (Banco Central do Brasil, Banxico, BCRA, Banco Central de Chile, BCRP); inflación, PIB, empleo y cifras fiscales oficiales; movimientos fuertes de la moneda, la bolsa o el riesgo país; elecciones, reformas y medidas económicas de gobierno; calificaciones soberanas; y hechos de grandes empresas de esos países que muevan su mercado. Mismas reglas de vigencia (~24 horas). Si la noticia es de una compañía de Cobertura LatAm (MercadoLibre, Nu, Petrobras), va en Cobertura LatAm y no aquí.

**Cuántas:** de 0 a 3 notas por día, con máximo 2 por país. Mínimo 5 puntos para entrar. Si un día no hay noticias regionales con 5 puntos o más, no publiques ninguna (nunca rellenes).

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
En cada edición actualiza los indicadores de la barra superior. Primero mira con `python3 bot/publicar.py estado` qué fechas tienen ya: si un indicador ya tiene el dato del último día hábil (por ejemplo, un sábado, domingo o festivo), no lo busques. Para cada indicador, intenta las fuentes en este orden, una vez cada una, y si ninguna da un dato con fecha explícita, conserva el valor anterior (no busques en otros sitios):
- **Dólar (TRM):** (1) `https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=2` (`valor` y `vigente_desde` del primer registro; `anterior` es el valor del segundo); (2) la nota diaria de La República sobre precios del dólar y del petróleo (búscala en su RSS, con un título como "Precios del dólar y del petróleo hoy"), que trae la TRM vigente.
- **Brent:** (1) esa misma nota diaria de La República: el cierre más reciente del Brent, con su fecha; (2) `https://mx.investing.com/commodities/brent-oil-historical-data`, fila más reciente de la tabla histórica (no el precio del encabezado).
- **MSCI COLCAP:** (1) `https://www.larepublica.co/indicadores-economicos/movimiento-accionario/msci-colcap` (dato de la BVC): último valor, variación porcentual y fecha; (2) la nota de cierre de la BVC de La República o Valora Analitik del último día hábil, si la trae en los RSS.
- **Tasa del Banco de la República** e **inflación anual:** actualízalas solo cuando una noticia o fuente oficial informe un cambio (decisión de la junta del Banco de la República; dato mensual del IPC del DANE). Si no hay cambio, deja el valor anterior.

Si una fuente no responde, conserva el valor anterior de ese indicador. La TRM y el MSCI COLCAP se actualizan todos los días hábiles: revisa que sus fechas correspondan al último día hábil antes de publicar. Formato:

```json
{
  "trm": { "valor": 3194.44, "vigente_desde": "2026-10-10", "anterior": 3218.75, "fuente": "Superintendencia Financiera vía datos.gov.co" },
  "brent": { "valor": 104.72, "cambio_pct": 0.42, "fecha": "2026-10-09", "fuente": "Investing.com" },
  "colcap": { "valor": 2531.23, "cambio_pct": 0.23, "fecha": "2026-10-09", "fuente": "BVC vía La República" },
  "tasa_banrep": { "valor": 12.25, "fuente": "Banco de la República" },
  "inflacion": { "valor": 6.29, "periodo": "sep 2026", "fuente": "DANE" },
  "actualizado": "AAAA-MM-DD"
}
```

## Cobertura LatAm (`data/cobertura.json`, página `cobertura.html`)
Sección aparte para seis compañías. Usa **el mismo formato completo de la sección Hoy** (contexto, afectados, lecturas alcista y bajista, `peso_alcista`, `impacto` con los cuatro activos, `puntaje`, `mirar`, `terminos`) y las mismas reglas obligatorias. Se actualiza en la misma corrida diaria.

**Compañías cubiertas (solo estas):** MercadoLibre (`MELI`, Nasdaq), Nu Holdings (`NU`, NYSE), Petrobras (`PBR`, NYSE), Grupo Cibest (`CIBEST`, BVC y NYSE: CIB), Grupo Argos (`GRUPOARGOS`, BVC) y PEI (`PEI`, BVC).

**Fuentes:** los RSS de la sección Hoy (sobre todo La República, Valora Analitik, Portafolio y Bloomberg Línea), los reportes de información relevante de los emisores colombianos, los formularios de la SEC (6-K, 8-K) y comunicados de las compañías, y WebSearch por nombre de compañía para las de Nueva York. **No uses** como fuente sitios de alertas automáticas de acciones ni notas sobre movimientos de fondos o cambios de calificación de analistas sin otra información.

**Qué entra:** noticias de las últimas ~48 horas (72 en fines de semana o festivos) sobre resultados, dividendos, recompras, emisiones de deuda o acciones, adquisiciones, cambios regulatorios o de gobierno corporativo, y hechos del sector que afecten directamente a la compañía. Si una noticia de estas compañías entra también en la sección Hoy, publícala solo en Cobertura LatAm. Si no hay noticias nuevas, no publiques nada en esta sección ese día (nunca rellenes).

**Formato:** igual que una nota de la sección Hoy, más dos campos: `empresa` (el ticker de la lista) y `fecha_noticia` (fecha original de la noticia). El `id` lleva el sufijo `c`: `AAAA-MM-DD-c01`. Para el activo `dolar`, explica el efecto para quien tiene acciones de las compañías que cotizan en Nueva York. Actualiza `actualizado` (hora real) y, si cambia el estado o los próximos hitos de una compañía, su ficha en `companias` (`estado`, `hitos`, `fuente_url`).

## Biotecnología (`data/biotech.json`, página `biotecnologia.html`)
**La corrida diaria no toca esta sección.** No busca ni publica noticias de biotecnología y no modifica `data/biotech.json`. La página ya no tiene noticias: solo la tabla "Panorama de biotecnológicas" y las fichas de las compañías.

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
