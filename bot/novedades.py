#!/usr/bin/env python3
"""Pre-revisión de noticias (sin modelo de IA, sin tokens).

Para las 15 compañías de Biotechnology busca titulares
recientes en Yahoo Finance (yfinance) y en Google News (RSS) y escribe
data/pendientes.json con, por activo, los titulares candidatos. La edición
diaria solo revisa a fondo los activos que tienen candidatos.

Lo corre la GitHub Action .github/workflows/novedades.yml antes de la edición.
Si una fuente falla, ese activo queda como "sin_revisar" (la edición lo busca
como antes); nunca se marca "sin noticias" por un error."""
import json, os, re, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

BOG = timezone(timedelta(hours=-5))
DATA = os.path.join(os.path.dirname(__file__), "..", "data")

# Mi portafolio: clave -> (nombre para buscar, símbolo de Yahoo, idioma de Google News)
PORTAFOLIO = {
    "NU": ("Nu Holdings", "NU", "en"),
    "JPM": ("JPMorgan Chase", "JPM", "en"),
    "MELI": ("MercadoLibre", "MELI", "en"),
    "RMS": ("Hermès", "RMS.PA", "en"),
    "BN": ("Brookfield Corporation", "BN", "en"),
    "PFGRUPOARG": ("Grupo Argos", "PFGRUPOARG.CL", "es"),
    "BVC": ("Bolsa de Valores de Colombia", "BVC.CL", "es"),
    "TQQQ": ("ProShares UltraPro QQQ", "TQQQ", "en"),
    "COPX": ("Global X Copper Miners ETF", "COPX", "en"),
}

# Avisos que las instrucciones excluyen de todas formas (bufetes, promociones).
RUIDO = re.compile(
    r"class action|investor alert|law firm|securities fraud|shareholder alert|"
    r"investigation on behalf|lawsuit|rosen|pomerantz|levi & korsinsky|"
    r"bragar|faruqi|halper|schall|top stocks|stocks to buy|price target|"
    r"\bform [3458]\b|\bform 144\b|sells \$|buys \$|insider|stake|shares? (sold|bought)|"
    r"stock price|stock quote|quote and|\bquote\b|rating|initiates|reiterates|upgrad|downgrad|"
    r"outperform|underperform|overweight|earnings snapshot|short interest|"
    r"investor conferences?|fireside chat|bull case|can easily afford|"
    r"stock (has|is|falls|rises|jumps|drops|surges|slides)|\bETFs? by market cap|"
    r"forecasts?\b|seasonal|risk channels|latest press releases|tokenized|price today|price data|"
    r"premarket|\bat (the )?[\w ]{0,30}(conference|healthcare)|net (sellers|buyers) of|13f",
    re.I)

# Fuentes que solo repiten cotizaciones, operaciones de insiders o recomendaciones.
FUENTES_RUIDO = re.compile(
    r"moomoo|gurufocus|milk road|scanx|tradingview|marketbeat|simply wall|coingecko|"
    r"stocktwits|benzinga|seeking alpha|zacks|investorplace|marketscreener|tipranks|"
    r"streetinsider|stock titan|quiver|barchart|fintel", re.I)


def alias(clave, nombre):
    """Palabras que deben aparecer en el titular para que cuente como noticia del activo."""
    extra = {
        "COPX": r"copx|global x copper|copper miners",
        "TQQQ": r"tqqq|proshares|ultrapro",
        "PFGRUPOARG": r"grupo argos|argos|pfgrupoarg",
        "BVC": r"bolsa de valores de colombia|\bbvc\b",
        "RMS": r"herm[eè]s",
        "NU": r"\bnu holdings\b|nubank|\bnu\b",
        "BN": r"brookfield",
        "JPM": r"jpmorgan|jp morgan|\bjpm\b",
    }
    if clave in extra:
        return re.compile(extra[clave], re.I)
    primera = re.escape(nombre.split()[0])
    return re.compile(rf"\b{primera}\b|\b{re.escape(clave)}\b", re.I)


def ventana_horas(ahora):
    # lunes: no hubo edición el sábado ni el domingo
    return 96 if ahora.weekday() == 0 else 48


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (StagResearchBot)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def google_news(nombre, idioma, horas):
    q = urllib.parse.quote(f'"{nombre}" when:{horas}h')
    if idioma == "es":
        suf = "hl=es-419&gl=CO&ceid=CO:es-419"
    else:
        suf = "hl=en-US&gl=US&ceid=US:en"
    raiz = ET.fromstring(get(f"https://news.google.com/rss/search?q={q}&{suf}"))
    salida = []
    for it in raiz.iter("item"):
        try:
            f = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc)
        except Exception:
            continue
        src = it.find("source")
        salida.append({"titulo": (it.findtext("title") or "").strip(),
                       "fuente": (src.text if src is not None else "") or "",
                       "url": it.findtext("link") or "", "fecha": f})
    return salida


def yahoo_news(simbolo):
    import yfinance as yf
    salida = []
    for n in (yf.Ticker(simbolo).news or []):
        c = n.get("content", n)
        titulo = c.get("title") or ""
        f = c.get("pubDate") or c.get("displayTime")
        if isinstance(f, (int, float)):
            fecha = datetime.fromtimestamp(f, timezone.utc)
        elif f:
            fecha = datetime.fromisoformat(str(f).replace("Z", "+00:00"))
        else:
            continue
        url = ((c.get("canonicalUrl") or {}).get("url") or (c.get("clickThroughUrl") or {}).get("url")
               or c.get("link") or "")
        prov = (c.get("provider") or {}).get("displayName") or c.get("publisher") or ""
        salida.append({"titulo": titulo.strip(), "fuente": prov, "url": url, "fecha": fecha})
    return salida


def revisar(clave, nombre, simbolo, idioma, corte, horas):
    candidatas, errores = [], 0
    for fuente, fn in (("google", lambda: google_news(nombre, idioma, horas)),
                       ("yahoo", lambda: yahoo_news(simbolo) if simbolo else [])):
        try:
            candidatas += fn()
        except Exception as e:
            errores += 1
            print(f"  {clave}: {fuente} no disponible ({e})")
        time.sleep(0.7)
    vistas, utiles = set(), []
    nombra = alias(clave, nombre)
    for n in sorted(candidatas, key=lambda x: x["fecha"], reverse=True):
        if n["fecha"] < corte or not n["titulo"] or RUIDO.search(n["titulo"]):
            continue
        if FUENTES_RUIDO.search(n["fuente"]) or not nombra.search(n["titulo"]):
            continue
        k = re.sub(r"\W+", " ", n["titulo"].lower())[:70]
        if k in vistas:
            continue
        vistas.add(k)
        utiles.append({"titulo": n["titulo"], "fuente": n["fuente"], "url": n["url"],
                       "fecha": n["fecha"].astimezone(BOG).strftime("%Y-%m-%d %H:%M")})
    # Si las dos fuentes fallaron no sabemos nada: que la edición lo busque como antes.
    estado = "sin_revisar" if errores == 2 else ("con_noticias" if utiles else "sin_noticias")
    return {"clave": clave, "nombre": nombre, "estado": estado, "noticias": utiles[:8]}


def main():
    ahora = datetime.now(BOG)
    horas = ventana_horas(ahora)
    corte = datetime.now(timezone.utc) - timedelta(hours=horas)
    with open(os.path.join(DATA, "biotech.json"), encoding="utf-8") as f:
        bio = json.load(f)["companias"]
    activos = [("biotecnologia", c["ticker"], c["nombre"], c["ticker"], "en") for c in bio]

    resultado = []
    for grupo, clave, nombre, simbolo, idioma in activos:
        r = revisar(clave, nombre, simbolo, idioma, corte, horas)
        r["grupo"] = grupo
        print(f"{grupo:14} {clave:11} {r['estado']:13} {len(r['noticias'])}")
        resultado.append(r)

    out = {
        "fecha": ahora.strftime("%Y-%m-%d"),
        "generado": ahora.strftime("%Y-%m-%d %H:%M"),
        "ventana_horas": horas,
        "nota": ("Pre-revisión automática de titulares. Revisa a fondo solo los activos 'con_noticias' "
                 "y los 'sin_revisar'; los 'sin_noticias' no tuvieron titulares en la ventana."),
        "activos": resultado,
    }
    with open(os.path.join(DATA, "pendientes.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    n = lambda e: sum(1 for r in resultado if r["estado"] == e)
    print(f"Listo: {n('con_noticias')} con noticias, {n('sin_noticias')} sin noticias, "
          f"{n('sin_revisar')} sin revisar (de {len(resultado)})")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # nunca romper la Action: la edición sigue con la búsqueda completa
        print("novedades: error inesperado, no se escribe pendientes.json:", e)
        sys.exit(0)
