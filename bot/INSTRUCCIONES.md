# ¿Y Entonces? — Instrucciones del bot diario

Este archivo es la fuente única de reglas editoriales. Lo usa hoy la tarea programada de Claude y, más adelante, el script con la API de Anthropic. Si cambias una regla, cámbiala aquí.

## Cuándo corre
Una vez al día, publicado a las 7:00 a. m. hora Bogotá.

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

Excluidas: biotecnología (por ahora), opinión, entretenimiento, deportes, política sin impacto de mercado, contenido promocional.

## Cómo se eligen las noticias (puntaje de relevancia)
1. Revisa **todas** las fuentes y arma la lista de candidatas que cumplan los temas de arriba. Si una noticia aparece en varios medios, es una sola candidata (usa la fuente más completa). Descarta las URL ya publicadas en `data/notas.json`.
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
5. **Tono y público:** español neutro y profesional, dirigido a inversionistas no profesionales. La pregunta que responde cada nota es: ¿cómo afecta esto a mi portafolio? Claro y preciso, sin sensacionalismo, sin tutear al lector y sin coloquialismos; los términos técnicos se explican en el glosario.
6. **Sin nombres propios del autor:** la firma es siempre Stag Research.
7. **Sin menciones al proceso:** no indiques en las notas que fueron generadas automáticamente ni menciones herramientas o modelos.

## Glosario (`data/glosario.json`)
La página `glosario.html` muestra los "Términos del día" (los de la edición más reciente) y el glosario completo. Si una nota usa un término que todavía no está en `data/glosario.json`, agrégalo con este formato:

```json
{ "termino": "Nombre del término", "definicion": "" }
```

La definición va en 2 a 4 frases, en lenguaje sencillo para un inversionista no profesional: qué es y por qué le importa a quien invierte. Aquí sí puedes usar conocimiento general (no viene de la noticia), pero solo conceptos establecidos y sin cifras que cambien con el tiempo. No modifiques las definiciones existentes salvo para corregir un error.

## Indicadores (`data/mercado.json`)
En cada edición actualiza los indicadores de la barra superior. Usa WebFetch:
- **Dólar (TRM):** `https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=2`. `valor` y `vigente_desde` del primer registro; `anterior` es el valor del segundo.
- **Brent:** `https://mx.investing.com/commodities/brent-oil-historical-data`. Toma la fila más reciente de la tabla histórica (cierre, % de variación y fecha), no el precio del encabezado. Si esa página no responde o pide permiso, usa la nota diaria de La República sobre precios del dólar y del petróleo (búscala en su RSS, categoría Finanzas, con un título como "Precios del dólar y del petróleo hoy") y toma el cierre más reciente del Brent que reporte, con su fecha. Si ninguna fuente da un cierre con fecha explícita, deja el valor anterior.
- **MSCI COLCAP:** `https://www.larepublica.co/indicadores-economicos/movimiento-accionario/msci-colcap` (dato de la BVC): último valor, variación porcentual y fecha.
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

## Dónde se publica
Se agrega al inicio del arreglo `notas` de `data/notas.json` y se actualiza `actualizado`. La hora de `actualizado` debe ser la hora real de publicación: obtenla justo antes del commit con `TZ=America/Bogota date` y nunca la escribas de memoria ni la estimes. Formato: "12 oct 2026, 9:15 a. m. (hora Bogotá)". Esquema de cada nota:

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
