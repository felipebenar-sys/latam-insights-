# Stag Research — Instrucciones del bot diario

La sección de noticias diarias se llama **Hoy** (página `yentonces.html`, datos en `data/notas.json`). Antes se llamaba ¿Y Entonces?; ese nombre ya no se usa en el sitio.

Este archivo es la fuente única de reglas editoriales. Lo usa hoy la tarea programada de Claude y, más adelante, el script con la API de Anthropic. Si cambias una regla, cámbiala aquí.

## Cuándo corre
Una vez al día, publicado a las 7:00 a. m. hora Bogotá. La corrida empieza a las 6:45 a. m.: la sección Hoy debe quedar publicada en unos 20 minutos.

## Tiempo y eficiencia (obligatorio)
1. **No leas los archivos de `data/` completos** (notas.json pesa cientos de KB y crece cada día) ni los reescribas a mano. Usa `python3 bot/publicar.py estado` para saber la fecha, si ya hay notas de hoy, los siguientes id, los indicadores actuales, los términos del glosario y la lista de URL ya publicadas (`/tmp/stag_urls.txt`). Para publicar, escribe las notas nuevas en un archivo temporal y agrégalas con `python3 bot/publicar.py agregar hoy|latam|biotech ARCHIVO.json`; los términos nuevos con `glosario ARCHIVO.json` (antes de agregar las notas) y los indicadores con `mercado ARCHIVO.json`. El script valida campos, términos, puntajes y URL repetidas y pone la hora real en `actualizado`; si rechaza algo, corrige el archivo temporal y vuelve a correrlo. Termina con `python3 bot/publicar.py validar`.
2. **Una sola vez por fuente:** cada URL se intenta una vez. Si una página no responde, falla o pide permiso, sigue con la siguiente fuente de la lista; no busques sitios alternos fuera de los indicados aquí.
3. **Lee primero los titulares:** revisa los RSS, preselecciona por título y descripción, y abre el artículo completo solo de las ~10 mejores candidatas de Hoy y de las candidatas de cobertura.
4. **Publica por partes:** primero la sección Hoy y los indicadores (commit "Edición AAAA-MM-DD" y push). Después Cobertura LatAm y Biotecnología en un segundo commit ("Edición AAAA-MM-DD, cobertura") y push. Así la edición principal no espera a la cobertura.
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

Excluidas de la sección Hoy: biotecnología (tiene su propia sección, ver "Cobertura de biotecnología" abajo), opinión, entretenimiento, deportes, política sin impacto de mercado, contenido promocional.

## Cómo se eligen las noticias (puntaje de relevancia)
1. Revisa **todas** las fuentes y arma la lista de candidatas que cumplan los temas de arriba. Si una noticia aparece en varios medios, es una sola candidata (usa la fuente más completa). Descarta las URL ya publicadas (lista en `/tmp/stag_urls.txt`, que crea `python3 bot/publicar.py estado`).
2. Califica cada candidata de 0 a 10 con estos criterios:
   - **Alcance (0–4):** cuántos de los cuatro tipos de activo (acciones colombianas, renta fija, dólar/exterior, CDT y ahorro) tendrían un efecto distinto de "neutral". En la nota publicada debe coincidir con el número de activos no neutrales del bloque `impacto`.
   - **Materialidad (0–3):** 3 = mueve directamente tasas de interés, dólar, finanzas públicas o resultados de emisores grandes de la BVC; 2 = efecto indirecto o concentrado en un sector; 1 = efecto marginal; 0 = sin efecto económico.
   - **Novedad (0–2):** 2 = dato, decisión o hecho nuevo (cifra oficial, decisión de política, resultado, evento); 1 = anuncio, propuesta, proyección o negociación en curso; 0 = análisis, recopilación o seguimiento de algo ya conocido.
   - **Fuente (0–1):** 1 si el artículo trae cifras verificables y cita fuentes primarias; 0 si no.
3. **Prioridad automática:** entran siempre, aunque su puntaje sea menor, las decisiones de tasa del Banco de la República, los datos del DANE (inflación, PIB, desempleo), las medidas del Ministerio de Hacienda con efecto fiscal y la información relevante de emisores de la BVC publicada en las últimas 24 horas.
4. Publica las de mayor puntaje hasta completar **6 a 8 notas**, con **máximo 3 por categoría**. No publiques candidatas con puntaje menor a 5 (salvo prioridad automática). Si un día (por ejemplo, un festivo) no hay suficientes candidatas con 5 o más, publica menos; nunca rellenes.
5. Ordena las notas de la edición de mayor a menor puntaje y guarda el puntaje en cada nota (campo `puntaje`).

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

## Cobertura de biotecnología (`data/biotech.json`, página `biotecnologia.html`)
Sección aparte, con reglas propias. Se actualiza en la misma corrida diaria.

**Compañías cubiertas (solo estas):** Celcuity (CELC), Faeth Therapeutics (FTH, antes Sensei Biotherapeutics) y Relay Therapeutics (RLAY).

**Fuentes:**
- Comunicados por compañía: `https://www.financialcontent.com/quote/NQ:CELC/pressReleases`, `.../NQ:FTH/pressReleases`, `.../NQ:RLAY/pressReleases`. Para Celcuity esa página casi solo trae avisos de bufetes de abogados; complementa con WebSearch (por ejemplo "Celcuity press release" y "gedatolisib") y usa los comunicados de GlobeNewswire o la página de inversionistas.
- Prensa especializada: Fierce Biotech (`https://www.fiercebiotech.com/rss/xml`) y Endpoints News (`https://endpoints.news/feed/`).
- Regulatorio: decisiones, designaciones o comunicaciones de la FDA sobre estas compañías, tomadas de comunicados o de prensa especializada.
- Competidores y sector: noticias de otras compañías o de la FDA que afecten directamente a estas tres (por ejemplo, resultados de un competidor en la misma vía PI3K/AKT/mTOR o en el mismo tipo de cáncer). La nota debe explicar la relación con la compañía cubierta.

**Qué entra:** noticias publicadas en las últimas ~48 horas (72 en fines de semana o festivos): resultados de ensayos, resultados financieros, financiamiento, decisiones o designaciones regulatorias, presentaciones en congresos, alianzas, cambios relevantes de la administración y noticias de competidores con relación directa. **No entran** los avisos de bufetes de abogados que buscan demandantes, las notas promocionales ni los análisis de precio de la acción. Si no hay noticias nuevas, no publiques nada en esta sección ese día (nunca rellenes). No repitas URL ya publicadas.

**Reglas especiales (obligatorias):**
1. **Sin opinión:** prohibido incluir lecturas alcista o bajista, ponderaciones, puntajes, efectos en el portafolio, calificativos como "positivo", "negativo", "bueno", "malo", "prometedor" o "decepcionante", y cualquier recomendación. Solo hechos y su explicación.
2. **Lenguaje para un joven de 15 años:** frases cortas, sin jerga; si un término técnico es inevitable, va en `terminos` y en el glosario.
3. Valen las reglas generales de derechos de autor, hechos solo de la fuente (en el contexto, también de la ficha y las notas ya publicadas, como se explica abajo), firma Stag Research y sin menciones al proceso.

**Formato de cada nota** (se agregan al inicio de `notas` en `data/biotech.json`):

```json
{
  "id": "AAAA-MM-DD-b01",
  "fecha": "AAAA-MM-DD",
  "fecha_noticia": "AAAA-MM-DD",
  "empresa": "CELC | FTH | RLAY",
  "tipo": "Ensayo clínico | Resultados financieros | Regulatorio (FDA) | Congreso médico | Financiamiento | Alianza | Competidores y sector | Gobierno corporativo",
  "titulo": "",
  "resumen": "Qué pasó, 1 a 2 frases.",
  "contexto": "Antecedentes, 5 a 7 frases (ver 'Cómo escribir el contexto' abajo).",
  "que_significa": "Explicación sencilla de qué significa la noticia y por qué importa, 4 a 6 frases, sin opinión.",
  "mirar": "El próximo dato o fecha relacionado (1 frase).",
  "terminos": ["FDA", "Fases de un ensayo clínico"],
  "fuente": "",
  "url": "https://..."
}
```

**Cómo escribir el contexto (obligatorio):** el lector no sigue la compañía a diario, así que cada nota debe entenderse sola, sin haber leído las anteriores. Mantén frases cortas y sencillas, pero da el panorama completo. El `contexto` responde, en este orden y solo con lo que aplique:
1. **Quién es la compañía y cuál es su producto:** qué medicamento es, para qué enfermedad y para qué pacientes (por ejemplo, "mujeres con cáncer de mama avanzado que ya recibieron otro tratamiento").
2. **Cómo funciona, en una imagen simple:** qué bloquea o qué hace en el cuerpo, sin jerga.
3. **En qué etapa está:** aprobado o en estudios; en qué fase; qué estudios tiene en curso y cuándo espera resultados.
4. **Qué pasó antes que explique esta noticia:** resultados, anuncios o decisiones previas que la conecten.
5. **Con quién se relaciona:** competidores o medicamentos parecidos, si la fuente los menciona o si son otra compañía cubierta (CELC, FTH y RLAY trabajan sobre la misma vía PI3K/AKT/mTOR).

Los antecedentes pueden venir de la fuente de la noticia, de la ficha de la compañía en `companias` y de notas ya publicadas en `data/biotech.json` (búscalas con grep por ticker; no leas el archivo completo). No uses cifras ni hechos que no estén en esas fuentes; si un dato no aparece, no lo pongas. El `que_significa` explica la noticia en sí (qué es ese tipo de evento, por qué una compañía lo hace o lo anuncia, qué podría venir después), no repite el contexto.

Actualiza también `actualizado` de `data/biotech.json` (hora real, como en la sección Hoy) y, si una noticia cambia el estado o los próximos hitos de una compañía, actualiza su ficha en `companias` (campos `estado` y `hitos`), con `fuente_url` apuntando a la fuente de ese cambio. Cada ficha tiene además `medicamento_principal` (el producto más avanzado de la compañía), con tres campos cortos que la página muestra como recuadros: `nombre` (por ejemplo "PIKTOR"), `fase` ("Fase 1", "Fase 1/2", "Fase 2", "Fase 3", "En revisión FDA" o "Aprobado (FDA)") y `enfermedad` (la indicación más avanzada, por ejemplo "Cáncer de endometrio"). Actualízalo solo cuando una fuente confirme un cambio: paso a otra fase, aprobación, o que el medicamento principal sea otro; se envía igual que los demás campos de la ficha (`{"companias": [{"ticker": "FTH", "medicamento_principal": {"nombre": "", "fase": "", "enfermedad": ""}}]}`), siempre con los tres campos completos. Los términos nuevos van al mismo `data/glosario.json`, con definiciones para un joven de 15 años.

## Dónde se publica
Se agrega al inicio del arreglo `notas` de `data/notas.json` y se actualiza `actualizado`, siempre con `python3 bot/publicar.py agregar hoy ARCHIVO.json` (el archivo lleva `{"notas": [...]}`). La hora de `actualizado` debe ser la hora real de publicación; el script la toma del reloj, así que nunca la escribas de memoria ni la estimes. Formato: "12 oct 2026, 9:15 a. m. (hora Bogotá)". Esquema de cada nota:

```json
{
  "id": "2026-10-12-01",
  "fecha": "2026-10-12",
  "categoria": "bvc | macro | commodities | latam | internacional | politica | sectores",
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
