#!/usr/bin/env python3
"""Actualiza con Yahoo Finance (librería yfinance):
- Brent en data/mercado.json (último cierre y variación diaria). Yahoo no tiene
  el índice MSCI COLCAP (solo el ETF iCOLCAP, que es otro número), así que el
  COLCAP lo sigue actualizando la edición diaria con la nota de cierre de la BVC.
- Los precios de cierre de los activos de Mi portafolio en data/precios.json.
Lo corre la GitHub Action .github/workflows/indicadores.yml. Si un símbolo
falla o trae algo inesperado, ese dato no cambia (el script sale sin error)."""
import json, os
from datetime import datetime, timedelta, timezone

BOG = timezone(timedelta(hours=-5))
DATA = os.path.join(os.path.dirname(__file__), "..", "data")

# Indicador -> símbolos de Yahoo que se prueban en orden.
INDICADORES = {
    "brent": (["BZ=F"], "ICE vía Yahoo Finance"),
}
# Ticker de Mi portafolio -> símbolos de Yahoo que se prueban en orden.
PORTAFOLIO = {
    "NU": ["NU"],
    "JPM": ["JPM"],
    "MELI": ["MELI"],
    "RMS": ["RMS.PA"],
    "BN": ["BN"],
    "PFGRUPOARG": ["PFGRUPOARG.CL", "PFGRUPARG.CL"],
    "BVC": ["BVC.CL", "BVCCO.CL"],
    "TQQQ": ["TQQQ"],
    "COPX": ["COPX"],
}


def ultimo_cierre(simbolo):
    import yfinance as yf
    t = yf.Ticker(simbolo)
    h = t.history(period="15d", interval="1d", auto_adjust=False)
    h = h.dropna(subset=["Close"])
    if len(h) < 2:
        raise ValueError(f"{len(h)} cierres")
    # Antes de las 4 p. m. hora Bogotá, la fila de hoy no es un cierre (la sesión
    # sigue abierta o, en el Brent, empezó la noche anterior): se descarta.
    ahora = datetime.now(BOG)
    if ahora.hour < 16:
        h = h[[d.date() < ahora.date() for d in h.index]]
    if len(h) < 2:
        raise ValueError(f"{len(h)} cierres anteriores a hoy")
    c0, c1 = float(h["Close"].iloc[-2]), float(h["Close"].iloc[-1])
    try:
        moneda = t.history_metadata.get("currency", "")
    except Exception:
        moneda = ""
    return {"valor": round(c1, 2), "cambio_pct": round((c1 / c0 - 1) * 100, 2),
            "fecha": h.index[-1].date().isoformat(), "moneda": moneda}


def primero(simbolos):
    for s in simbolos:
        try:
            d = ultimo_cierre(s)
            print(f"  {s}: {d}")
            return s, d
        except Exception as e:
            print(f"  {s}: no disponible ({e})")
    return None, None


def leer(nombre, defecto):
    try:
        with open(os.path.join(DATA, nombre), encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return defecto


def guardar(nombre, datos):
    with open(os.path.join(DATA, nombre), "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
        f.write("\n")


hoy = datetime.now(BOG).strftime("%Y-%m-%d")

mercado = leer("mercado.json", {})
cambio = False
for k, (simbolos, fuente) in INDICADORES.items():
    print(k)
    s, d = primero(simbolos)
    if d and d["fecha"] > mercado.get(k, {}).get("fecha", ""):
        mercado[k] = {"valor": d["valor"], "cambio_pct": d["cambio_pct"], "fecha": d["fecha"], "fuente": fuente}
        cambio = True
if cambio:
    mercado["actualizado"] = hoy
    guardar("mercado.json", mercado)
    print("mercado.json actualizado")

precios = leer("precios.json", {"activos": {}})
cambio = False
for ticker, simbolos in PORTAFOLIO.items():
    print(ticker)
    s, d = primero(simbolos)
    if d and d["fecha"] >= precios["activos"].get(ticker, {}).get("fecha", ""):
        nuevo = dict(d, simbolo=s, fuente="Yahoo Finance")
        if precios["activos"].get(ticker) != nuevo:
            precios["activos"][ticker] = nuevo
            cambio = True
if cambio:
    precios["actualizado"] = hoy
    guardar("precios.json", precios)
    print("precios.json actualizado")
