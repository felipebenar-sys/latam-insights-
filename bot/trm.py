#!/usr/bin/env python3
"""Actualiza la TRM en data/mercado.json desde los datos abiertos de la
Superintendencia Financiera (datos.gov.co, conjunto 32sa-8pi3).
Lo corre la GitHub Action .github/workflows/trm.yml. Si la fuente falla o
trae algo inesperado, no cambia nada (sale sin error)."""
import json, os, sys, urllib.request
from datetime import datetime, timedelta, timezone

URL = "https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=2"
RUTA = os.path.join(os.path.dirname(__file__), "..", "data", "mercado.json")

try:
    with urllib.request.urlopen(URL, timeout=30) as r:
        filas = json.load(r)
    ult, prev = filas[0], filas[1]
    valor = round(float(ult["valor"]), 2)
    anterior = round(float(prev["valor"]), 2)
    desde = ult["vigenciadesde"][:10]
    datetime.strptime(desde, "%Y-%m-%d")
except Exception as e:
    print("TRM: fuente no disponible o formato inesperado, no se cambia nada:", e)
    sys.exit(0)

with open(RUTA, encoding="utf-8") as f:
    datos = json.load(f)
if datos.get("trm", {}).get("vigente_desde", "") >= desde:
    print("TRM ya está al día:", datos["trm"])
    sys.exit(0)
datos["trm"] = {"valor": valor, "vigente_desde": desde, "anterior": anterior,
                "fuente": "Superintendencia Financiera vía datos.gov.co"}
datos["actualizado"] = datetime.now(timezone(timedelta(hours=-5))).strftime("%Y-%m-%d")
with open(RUTA, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("TRM actualizada:", datos["trm"])
