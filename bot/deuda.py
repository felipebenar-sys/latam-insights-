#!/usr/bin/env python3
"""Lee las cifras de https://deudacolombiana.com y las guarda en
data/deuda_corte.json (sin modelo de IA, sin tokens).

La página es una app Next.js: la deuda bruta, la fecha de corte y la serie
mensual vienen como JSON dentro del HTML; el porcentaje del PIB, el PIB de
2026 y los intereses vienen como texto. La tarea mensual de Claude solo lee
este archivo y redacta la nota.

Lo corre la GitHub Action .github/workflows/deuda.yml. Si la página falla o
cambia de formato, no escribe nada (sale sin error) y la tarea usa WebFetch."""
import html, json, os, re, sys, urllib.request
from datetime import datetime, timedelta, timezone

BOG = timezone(timedelta(hours=-5))
URL = "https://deudacolombiana.com"
RUTA = os.path.join(os.path.dirname(__file__), "..", "data", "deuda_corte.json")
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def texto(h):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", h, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    return re.sub(r"\s+", " ", t)


def main():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (StagResearchBot)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        h = r.read().decode("utf-8", "replace")

    j = h.replace('\\"', '"')
    base = float(re.search(r'"baseBillones":([\d.]+)', j).group(1))
    corte = re.search(r'"baseTimestamp":"(\d{4}-\d{2}-\d{2})', j).group(1)
    serie = re.findall(r'\{"t":"(\d{4}-\d{2})","v":([\d.]+)\}', j)
    if len(serie) < 24 or not (100 < base < 5000):
        raise ValueError(f"formato inesperado (serie={len(serie)}, base={base})")
    if serie[-1][0] != corte[:7]:
        raise ValueError(f"el último punto de la serie ({serie[-1][0]}) no coincide con el corte {corte}")

    t = texto(h)
    pib_pct = re.search(r"% del PIB\s+([\d.,]+)\s*%", t)
    pib_2026 = re.search(r"PIB 2026:\s*\$\s*([\d.,]+\s*B)", t)
    interes = re.search(r"Intereses (\d{4})\s+\$\s*([\d.,]+\s*B)\s*COP\s*·\s*([\d.,]+)\s*%\s*del PIB", t)
    datos_a = re.search(r"Datos a ([A-Za-zñÑ]+ de \d{4})", t)

    anterior_t, anterior_v = serie[-2]
    hace12_t, hace12_v = serie[-13] if len(serie) >= 13 else (None, None)
    v = float(serie[-1][1])
    out = {
        "leido": datetime.now(BOG).strftime("%Y-%m-%d %H:%M"),
        "url": URL,
        "corte": corte,
        "deuda_bruta_billones_cop": base,
        "serie_ultimo_punto_billones_cop": v,
        "corte_anterior": {"mes": anterior_t, "deuda_bruta_billones_cop": float(anterior_v),
                           "cambio_billones_cop": round(v - float(anterior_v), 4)},
        "hace_12_meses": ({"mes": hace12_t, "deuda_bruta_billones_cop": float(hace12_v),
                           "cambio_billones_cop": round(v - float(hace12_v), 4)}
                          if hace12_t else None),
        "pib_porcentaje": pib_pct.group(1) if pib_pct else None,
        "pib_2026_billones": pib_2026.group(1).replace(" ", "") if pib_2026 else None,
        "intereses": ({"anio": interes.group(1), "billones_cop": interes.group(2).replace(" ", ""),
                       "porcentaje_pib": interes.group(3)} if interes else None),
        "datos_a": datos_a.group(1) if datos_a else None,
        "nota": ("Unidades: billones de pesos (1 billón = 1.000.000.000.000). 'Por colombiano' y el "
                 "contador 'en vivo' del sitio son estimaciones no oficiales y no se incluyen aquí. "
                 "Fuente: Ministerio de Hacienda e Investor Relations Colombia, vía deudacolombiana.com."),
    }
    faltan = [k for k in ("pib_porcentaje", "pib_2026_billones", "intereses", "datos_a") if not out[k]]
    if faltan:
        print("Aviso: no se pudo leer del texto:", ", ".join(faltan))
    with open(RUTA, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("Corte", corte, "· deuda bruta", base, "billones COP · % PIB", out["pib_porcentaje"])


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("deuda: página no disponible o formato inesperado, no se cambia nada:", e)
        sys.exit(0)
