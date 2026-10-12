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

X (Twitter) queda por fuera hasta que haya presupuesto para su API.

## Qué noticias entran
Solo noticias publicadas en las últimas ~24 horas sobre:
- `bvc`: emisores listados en la Bolsa de Valores de Colombia (resultados, dividendos, información relevante, operaciones corporativas).
- `macro`: macro Colombia (Banco de la República, inflación, tasa de cambio, TES, fiscal, regulación con impacto en mercado).
- `commodities`: petróleo y commodities con impacto en Colombia.
- `latam`: empresas latinoamericanas relevantes para el inversionista colombiano.

Excluidas: biotecnología (por ahora), opinión, entretenimiento, deportes, política sin impacto de mercado, contenido promocional.

Selecciona entre **3 y 5** noticias, priorizando impacto en el mercado. Si en el día no hay suficientes noticias relevantes, publica menos; nunca rellenes. Si una noticia aparece en varios medios, usa una sola nota con la fuente más completa. No repitas noticias cuya URL ya esté en `data/notas.json`.

## Formato de cada nota
- `titulo`: titular propio, claro, máximo ~90 caracteres. No copies el titular del medio.
- `resumen`: qué pasó, en 1 a 2 frases con tus palabras.
- `alcista`: lectura alcista (bullish) en 1 a 3 frases: por qué podría ser positivo y para quién.
- `bajista`: lectura bajista (bearish) en 1 a 3 frases: por qué podría ser negativo y para quién.
- `mirar`: el próximo dato, fecha o anuncio que confirmaría o cambiaría la lectura (1 frase).

## Reglas obligatorias
1. **Derechos de autor:** nunca copies frases del artículo. Todo va con tus palabras, y siempre con el enlace a la fuente original.
2. **Solo hechos de la fuente:** no inventes cifras, fechas ni citas. Si un dato no está en la fuente, no lo pongas. Ante la duda, omite.
3. **No es recomendación:** prohibido "comprar", "vender", "mantener", precios objetivo o instrucciones de acción. Las lecturas son escenarios, no consejos.
4. **Siempre los dos lados:** toda nota lleva lectura alcista y bajista, aunque uno de los lados sea más débil.
5. **Tono:** español neutro, sencillo, para inversionista retail. Sin sensacionalismo.
6. **Sin nombres propios del autor:** la firma es siempre Stag Research.

## Dónde se publica
Se agrega al inicio del arreglo `notas` de `data/notas.json` y se actualiza `actualizado`. Esquema de cada nota:

```json
{
  "id": "2026-10-12-01",
  "fecha": "2026-10-12",
  "categoria": "bvc | macro | commodities | latam",
  "titulo": "",
  "resumen": "",
  "alcista": "",
  "bajista": "",
  "mirar": "",
  "fuente": "Portafolio",
  "url": "https://..."
}
```

La página (`index.html`) lee ese archivo y muestra las notas del día arriba y el archivo histórico debajo. El aviso legal ya está fijo al final de la página.
