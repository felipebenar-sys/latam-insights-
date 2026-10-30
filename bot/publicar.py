#!/usr/bin/env python3
"""Herramienta de publicación de Stag Research.

Evita que el bot tenga que leer o reescribir a mano los archivos grandes de
data/ (notas.json crece cada día). Todo lo que se agrega pasa por aquí.

Uso:
  python3 bot/publicar.py estado
      Fecha de hoy (Bogotá), si cada sección ya tiene notas de hoy, siguiente
      id libre, indicadores actuales y nombres del glosario. Guarda las URL ya
      publicadas en /tmp/stag_urls.txt (una por línea) para descartar repetidas.

  python3 bot/publicar.py agregar hoy|latam ARCHIVO.json
      ARCHIVO contiene {"notas": [...]} y, para latam, opcionalmente
      {"companias": [{"ticker": "...", "estado": "...", "hitos": [...], "fuente_url": "..."}]}.
      Valida campos, términos y URL repetidas, agrega las notas al inicio y pone
      la hora real en "actualizado".

  python3 bot/publicar.py glosario ARCHIVO.json
      ARCHIVO contiene {"terminos": [{"termino": "...", "definicion": "..."}]}.
      Agrega al final solo los que no existan (la página los ordena).

  python3 bot/publicar.py mercado ARCHIVO.json
      ARCHIVO contiene solo los indicadores que cambian (trm, brent, colcap,
      tasa_banrep, inflacion). Reemplaza esos bloques y pone la fecha de hoy.

  python3 bot/publicar.py validar
      Revisa los cinco JSON y que todos los términos usados estén en el glosario.
"""
import json
import os
import subprocess
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, "data")
ARCHIVOS = {"hoy": "notas.json", "latam": "cobertura.json"}
# Biotecnología ya no publica noticias: data/biotech.json se actualiza a mano una vez al mes
# (ver "Biotecnología" en bot/INSTRUCCIONES.md); aquí solo se valida que sea un JSON correcto.
SUFIJO = {"hoy": "", "latam": "c"}
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

CAMPOS = {
    "hoy": ["id", "fecha", "categoria", "puntaje", "titulo", "resumen", "contexto", "afectados",
            "peso_alcista", "alcista", "bajista", "impacto", "mirar", "terminos", "fuente", "url"],
}
CAMPOS["latam"] = CAMPOS["hoy"] + ["empresa", "fecha_noticia"]
# Informes de solo hechos dentro de Hoy (por ahora, el informe mensual de la deuda pública)
CAMPOS_INFORME = ["id", "fecha", "categoria", "formato", "titulo", "resumen", "datos", "contexto",
                  "que_significa", "mirar", "terminos", "fuente", "url", "fecha_noticia"]
CATEGORIAS_INFORME = {"deuda"}
PROHIBIDOS_INFORME = ["alcista", "bajista", "peso_alcista", "impacto", "puntaje", "afectados"]
CATEGORIAS = {"bvc", "macro", "commodities", "latam", "internacional", "politica", "sectores", "region"}
PAISES = {"Brasil", "México", "Argentina", "Chile", "Perú"}
ACTIVOS = ["acciones", "renta_fija", "dolar", "cdt"]
EFECTOS = {"positivo", "negativo", "neutral", "mixto"}
TICKERS = {"latam": {"MELI", "NU", "PBR", "CIBEST", "GRUPOARGOS", "PEI"}}


def cargar(nombre):
    with open(os.path.join(DATA, nombre), encoding="utf-8") as f:
        return json.load(f)


def guardar(nombre, datos):
    with open(os.path.join(DATA, nombre), "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
        f.write("\n")


def ahora():
    salida = subprocess.run(["date", "+%Y-%m-%d %H %M"], capture_output=True, text=True,
                            env={**os.environ, "TZ": "America/Bogota"}, check=True).stdout.split()
    fecha, h, m = salida[0], int(salida[1]), salida[2]
    _, mes, dia = fecha.split("-")
    sufijo = "a. m." if h < 12 else "p. m."
    h12 = h % 12 or 12
    texto = f"{int(dia)} {MESES[int(mes) - 1]} {fecha[:4]}, {h12}:{m} {sufijo} (hora Bogotá)"
    return fecha, texto


def clave(t):
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def terminos_glosario():
    return {t["termino"] for t in cargar("glosario.json")["terminos"]}


def todas_las_urls():
    urls = set()
    for nombre in ARCHIVOS.values():
        urls |= {n.get("url") for n in cargar(nombre)["notas"]}
    return urls


def estado():
    hoy, texto = ahora()
    print(f"Hoy (Bogotá): {hoy} · hora actual: {texto}")
    for seccion, nombre in ARCHIVOS.items():
        notas = cargar(nombre)["notas"]
        de_hoy = [n["id"] for n in notas if n.get("fecha") == hoy]
        print(f"- {seccion} ({nombre}): {len(notas)} notas en total; de hoy: {de_hoy or 'ninguna'}"
              f"; siguiente id: {hoy}-{SUFIJO[seccion]}{len(de_hoy) + 1:02d}")
    urls = sorted(u for u in todas_las_urls() if u)
    with open("/tmp/stag_urls.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(urls) + "\n")
    print(f"URL ya publicadas: {len(urls)} (lista en /tmp/stag_urls.txt)")
    print("Indicadores actuales:")
    print(json.dumps(cargar("mercado.json"), ensure_ascii=False))
    print("Términos del glosario:")
    print(" | ".join(sorted(terminos_glosario(), key=clave)))


def revisar_informe(n, glosario, hoy):
    errores = []
    faltan = [c for c in CAMPOS_INFORME if c not in n]
    if faltan:
        errores.append(f"faltan campos {faltan}")
    if n.get("fecha") != hoy:
        errores.append(f"fecha {n.get('fecha')} distinta de hoy {hoy}")
    if not str(n.get("id", "")).startswith(f"{hoy}-"):
        errores.append(f"id {n.get('id')} no sigue el formato {hoy}-NN")
    if n.get("categoria") not in CATEGORIAS_INFORME:
        errores.append(f"categoría de informe no válida: {n.get('categoria')} (usa {sorted(CATEGORIAS_INFORME)})")
    datos = n.get("datos")
    if not isinstance(datos, list) or not 3 <= len(datos) <= 8 or any(
            not isinstance(d, dict) or not d.get("etiqueta") or not d.get("valor") for d in datos):
        errores.append("datos debe ser una lista de 3 a 8 elementos con 'etiqueta' y 'valor'")
    if any(c in n for c in PROHIBIDOS_INFORME):
        errores.append(f"un informe es solo hechos: no lleva {PROHIBIDOS_INFORME}")
    for t in n.get("terminos", []):
        if t not in glosario:
            errores.append(f"el término '{t}' no está en el glosario (agrégalo antes con el comando glosario)")
    return errores


def revisar_nota(seccion, n, glosario, hoy):
    if seccion == "hoy" and n.get("formato") == "informe":
        return revisar_informe(n, glosario, hoy)
    errores = []
    faltan = [c for c in CAMPOS[seccion] if c not in n]
    if faltan:
        errores.append(f"faltan campos {faltan}")
    if n.get("fecha") != hoy:
        errores.append(f"fecha {n.get('fecha')} distinta de hoy {hoy}")
    if not str(n.get("id", "")).startswith(f"{hoy}-{SUFIJO[seccion]}"):
        errores.append(f"id {n.get('id')} no sigue el formato {hoy}-{SUFIJO[seccion]}NN")
    for t in n.get("terminos", []):
        if t not in glosario:
            errores.append(f"el término '{t}' no está en el glosario (agrégalo antes con el comando glosario)")
    if seccion in TICKERS and n.get("empresa") not in TICKERS[seccion]:
        errores.append(f"empresa {n.get('empresa')} no está en la cobertura")
    if seccion in ("hoy", "latam"):
        if seccion == "hoy" and n.get("categoria") not in CATEGORIAS:
            errores.append(f"categoría {n.get('categoria')} no válida")
        if seccion == "hoy" and n.get("categoria") == "region" and n.get("pais") not in PAISES:
            errores.append(f"las notas de La región llevan 'pais' con uno de {sorted(PAISES)}")
        if seccion == "hoy" and n.get("categoria") != "region" and "pais" in n:
            errores.append("el campo 'pais' solo va en notas de categoría 'region'")
        pa = n.get("peso_alcista")
        if not isinstance(pa, int) or not 20 <= pa <= 80 or pa % 5:
            errores.append("peso_alcista debe ser entero entre 20 y 80, múltiplo de 5")
        activos = (n.get("impacto") or {}).get("activos", [])
        if [a.get("activo") for a in activos] != ACTIVOS:
            errores.append(f"impacto.activos debe tener {ACTIVOS} en ese orden")
        elif any(a.get("efecto") not in EFECTOS for a in activos):
            errores.append("efecto de activo no válido")
        else:
            no_neutrales = sum(a["efecto"] != "neutral" for a in activos)
            p = n.get("puntaje") or {}
            if p.get("alcance") != no_neutrales:
                errores.append(f"puntaje.alcance ({p.get('alcance')}) debe ser {no_neutrales} (activos no neutrales)")
            suma = sum(p.get(k, 0) for k in ("alcance", "materialidad", "novedad", "fuente"))
            if p.get("total") != suma:
                errores.append(f"puntaje.total ({p.get('total')}) debe ser la suma {suma}")
    return errores


def agregar(seccion, ruta):
    if seccion not in ARCHIVOS:
        sys.exit(f"Sección no válida: {seccion}. Usa hoy o latam (biotecnología ya no publica noticias).")
    hoy, texto = ahora()
    with open(ruta, encoding="utf-8") as f:
        nuevo = json.load(f)
    nuevas = nuevo.get("notas", [])
    datos = cargar(ARCHIVOS[seccion])
    glosario = terminos_glosario()
    urls = todas_las_urls()
    ids = {n["id"] for n in datos["notas"]}
    errores = []
    for n in nuevas:
        for e in revisar_nota(seccion, n, glosario, hoy):
            errores.append(f"{n.get('id')}: {e}")
        if n.get("url") in urls and n.get("categoria") != "deuda":
            errores.append(f"{n.get('id')}: la URL ya fue publicada ({n.get('url')})")
        if n.get("id") in ids:
            errores.append(f"{n.get('id')}: el id ya existe")
        urls.add(n.get("url"))
        ids.add(n.get("id"))
    if errores:
        print("NO SE AGREGÓ NADA. Corrige y vuelve a correr:")
        print("\n".join(f"- {e}" for e in errores))
        sys.exit(1)
    datos["notas"] = nuevas + datos["notas"]
    cambios = nuevo.get("companias", [])
    if cambios and "companias" in datos:
        por_ticker = {c["ticker"]: c for c in datos["companias"]}
        for c in cambios:
            if c.get("ticker") not in por_ticker:
                sys.exit(f"Ticker desconocido en companias: {c.get('ticker')}")
            por_ticker[c["ticker"]].update({k: v for k, v in c.items() if k != "ticker"})
    datos["actualizado"] = texto
    guardar(ARCHIVOS[seccion], datos)
    print(f"Agregadas {len(nuevas)} notas a {ARCHIVOS[seccion]}"
          f"{f' y actualizadas {len(cambios)} fichas' if cambios else ''}. actualizado = {texto}")


def glosario(ruta):
    with open(ruta, encoding="utf-8") as f:
        nuevos = json.load(f).get("terminos", [])
    datos = cargar("glosario.json")
    existentes = {clave(t["termino"]) for t in datos["terminos"]}
    agregados = []
    for t in nuevos:
        if not t.get("termino") or not t.get("definicion"):
            sys.exit(f"Término incompleto: {t}")
        if clave(t["termino"]) not in existentes:
            datos["terminos"].append({"termino": t["termino"], "definicion": t["definicion"]})
            existentes.add(clave(t["termino"]))
            agregados.append(t["termino"])
    guardar("glosario.json", datos)
    print(f"Términos agregados: {agregados or 'ninguno (ya existían)'}")


def mercado(ruta):
    with open(ruta, encoding="utf-8") as f:
        cambios = json.load(f)
    datos = cargar("mercado.json")
    for k, v in cambios.items():
        if k not in ("trm", "brent", "colcap", "tasa_banrep", "inflacion"):
            sys.exit(f"Indicador desconocido: {k}")
        datos[k] = v
    datos["actualizado"] = ahora()[0]
    guardar("mercado.json", datos)
    print("mercado.json actualizado:", json.dumps(datos, ensure_ascii=False))


def validar():
    glos = terminos_glosario()
    faltan = set()
    for nombre in list(ARCHIVOS.values()) + ["biotech.json", "glosario.json", "mercado.json"]:
        d = cargar(nombre)
        for n in d.get("notas", []):
            faltan |= {t for t in n.get("terminos", []) if t not in glos}
    if faltan:
        print("Términos usados que no están en el glosario:", sorted(faltan))
        sys.exit(1)
    print("OK: los cinco JSON son válidos y todos los términos están en el glosario.")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["estado"]:
        estado()
    elif a[:1] == ["agregar"] and len(a) == 3:
        agregar(a[1], a[2])
    elif a[:1] == ["glosario"] and len(a) == 2:
        glosario(a[1])
    elif a[:1] == ["mercado"] and len(a) == 2:
        mercado(a[1])
    elif a[:1] == ["validar"]:
        validar()
    else:
        sys.exit(__doc__)
