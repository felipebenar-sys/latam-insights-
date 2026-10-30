// Renderizado de notas Hoy — compartido por index.html y yentonces.html
// Datos: data/notas.json (esquema en bot/INSTRUCCIONES.md)
(function () {
    // Skeleton loaders: cuando un contenedor recibe su contenido real, deja de estar "ocupado" para lectores de pantalla
    document.querySelectorAll('[aria-busy="true"]').forEach(el => {
        const obs = new MutationObserver(() => { el.setAttribute('aria-busy', 'false'); obs.disconnect(); });
        obs.observe(el, { childList: true });
    });

    if (!document.getElementById('estilo-tap')) {
        const st = document.createElement('style'); st.id = 'estilo-tap';
        st.textContent = '@media (pointer:coarse){[data-termino],.tap-amplio{position:relative}[data-termino]::after,.tap-amplio::after{content:"";position:absolute;left:-6px;right:-6px;top:-12px;bottom:-12px}}';
        document.head.appendChild(st);
    }
    const CAT = { bvc: 'BVC', macro: 'Macro Colombia', commodities: 'Commodities', latam: 'LatAm', internacional: 'Mercados internacionales', politica: 'Política económica', sectores: 'Sectores', region: 'La región', deuda: 'Deuda pública', portafolio: 'Mi portafolio', biotecnologia: 'Biotecnología' };
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const slug = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '#';
    const fmtFecha = f => {
        const [y, m, d] = String(f).split('-').map(Number);
        if (!y) return esc(f);
        return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };



    // Sello visible de actualización: "Actualizado hoy, 7:05 a. m." (verde si es de hoy, gris si es antiguo)
    const MES = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
    function sello(act) {
        if (!act) return '';
        const t = String(act).replace(/ \(hora Bogotá\)/, '');
        const hora = (t.match(/\d{1,2}:\d{2}\s*[ap]\.\s*m\./i) || [''])[0];
        const f = t.match(/(\d{1,2})\s+([a-záéíóú]{3})[a-z]*\.?\s+(\d{4})/i);
        const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        let esHoy = false, dia = '';
        if (f && MES[f[2].toLowerCase()] !== undefined) {
            const iso = `${f[3]}-${String(MES[f[2].toLowerCase()] + 1).padStart(2, '0')}-${String(f[1]).padStart(2, '0')}`;
            esHoy = iso === hoy; dia = `${f[1]} ${f[2].toLowerCase()}`;
        }
        const txt = hora ? `Actualizado ${esHoy ? 'hoy' : dia}, ${hora}` : `Actualizado ${esc(t)}`;
        const col = esHoy ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-stone-800 border-stone-700 text-stone-300';
        const punto = esHoy
            ? '<span class="relative flex w-2 h-2"><span class="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span><span class="relative inline-flex w-2 h-2 rounded-full bg-emerald-400"></span></span>'
            : '<span class="inline-flex w-2 h-2 rounded-full bg-stone-500"></span>';
        return `<span class="inline-flex items-center gap-2 border ${col} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" title="${esc(t)} (hora Bogotá)">${punto}${esc(txt)}</span>`;
    }
    window.selloActualizado = sello;

    // Ponderación alcista/bajista (peso_alcista: 0-100; bajista = 100 - alcista)
    function ponderacion(n, compacta) {
        const a = Number(n.peso_alcista);
        if (!Number.isFinite(a)) return '';
        const al = Math.max(0, Math.min(100, Math.round(a))), ba = 100 - al;
        const sesgo = al > 50 ? 'Sesgo alcista' : al < 50 ? 'Sesgo bajista' : 'Balance neutral';
        return `
            <div class="${compacta ? 'mb-4' : 'mb-5'}">
                <div class="flex justify-between text-xs font-semibold mb-1.5">
                    <span class="text-emerald-400">Alcista ${al}%</span>
                    ${compacta ? '' : `<span class="text-stone-400 uppercase tracking-wider">Ponderación · ${sesgo}</span>`}
                    <span class="text-rose-400">Bajista ${ba}%</span>
                </div>
                <div class="flex h-2 rounded-full overflow-hidden bg-stone-800" role="img" aria-label="Ponderación: alcista ${al}%, bajista ${ba}%">
                    <div class="bg-emerald-500" style="width:${al}%"></div>
                    <div class="bg-rose-500" style="width:${ba}%"></div>
                </div>
            </div>`;
    }


    // Impacto en el portafolio: efecto neto (derivado de la ponderación) + efecto por tipo de activo
    const ACT = { acciones: 'Acciones colombianas', renta_fija: 'Renta fija (TES y bonos)', dolar: 'Dólar e inversiones en el exterior', cdt: 'CDT y ahorro en pesos' };
    const EF = {
        positivo: ['▲ Positivo', 'text-emerald-400'], negativo: ['▼ Negativo', 'text-rose-400'],
        neutral: ['■ Neutral', 'text-stone-400'], mixto: ['◆ Mixto', 'text-amber-400']
    };
    function neto(n) {
        const a = Number(n.peso_alcista);
        if (!Number.isFinite(a)) return null;
        if (a >= 70) return ['Positivo', 'text-emerald-400'];
        if (a >= 55) return ['Moderadamente positivo', 'text-emerald-400'];
        if (a > 45) return ['Neutral', 'text-stone-300'];
        if (a > 30) return ['Moderadamente negativo', 'text-rose-400'];
        return ['Negativo', 'text-rose-400'];
    }
    function impacto(n) {
        const im = n.impacto;
        if (!im) return '';
        const nt = neto(n);
        const filas = (im.activos || []).map(x => {
            const [lab, col] = EF[x.efecto] || [esc(x.efecto), 'text-stone-300'];
            return `<div class="grid sm:grid-cols-[13rem_7rem_1fr] gap-x-4 gap-y-1 py-2.5 border-t border-stone-800 first:border-t-0">
                <span class="text-stone-200 text-sm font-medium">${esc(ACT[x.activo] || x.activo)}</span>
                <span class="${col} text-sm font-semibold">${lab}</span>
                <span class="text-stone-400 text-sm">${esc(x.detalle)}</span>
            </div>`;
        }).join('');
        return `
            <div class="bg-stone-950 border border-amber-400/30 rounded-lg p-5 mb-5">
                <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <p class="text-amber-400 text-xs font-bold uppercase tracking-wider">Impacto en el portafolio</p>
                    ${nt ? `<p class="text-sm"><span class="text-stone-500">Efecto neto:</span> <span class="${nt[1]} font-semibold">${nt[0]}</span></p>` : ''}
                </div>
                <p class="text-stone-200 text-sm leading-relaxed mb-3">${esc(im.conclusion)}</p>
                <div>${filas}</div>
            </div>`;
    }

    // Puntaje de relevancia (0-10) con desglose al tocarlo
    function relevancia(n) {
        const p = n.puntaje;
        if (!p || !Number.isFinite(Number(p.total))) return '';
        const det = `Alcance ${p.alcance}/4 · Materialidad ${p.materialidad}/3 · Novedad ${p.novedad}/2 · Fuente ${p.fuente}/1`;
        return `<details class="relative ml-auto">
            <summary class="list-none cursor-pointer select-none text-stone-400 hover:text-amber-400 font-semibold" title="${det}">Relevancia <span class="text-white">${p.total}</span>/10</summary>
            <div class="absolute right-0 z-20 mt-2 w-60 bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-300 font-normal leading-relaxed shadow-xl">
                <p class="text-white font-semibold mb-1">Por qué entró esta noticia</p>
                <p>Alcance en el portafolio: ${p.alcance}/4</p><p>Materialidad: ${p.materialidad}/3</p><p>Novedad: ${p.novedad}/2</p><p>Calidad de la fuente: ${p.fuente}/1</p>
            </div></details>`;
    }

    function cabecera(n) {
        return `
            <div class="flex flex-wrap items-center gap-2 mb-3 text-xs">
                ${n.empresa ? `<span class="bg-sky-400/10 text-sky-300 border border-sky-400/20 px-2 py-0.5 rounded-full font-semibold">${esc(n.empresa)}</span>` : ''}
                ${n.categoria === 'portafolio' ? `<a href="portafolio.html" title="Stag Research tiene una posición en este activo" class="bg-violet-400/10 text-violet-300 border border-violet-400/30 px-2 py-0.5 rounded-full font-semibold hover:border-violet-300">En Mi portafolio</a>` : ''}
                ${n.pais ? `<span class="bg-sky-400/10 text-sky-300 border border-sky-400/20 px-2 py-0.5 rounded-full font-semibold">${esc(n.pais)}</span>` : ''}
                ${n.categoria === 'portafolio' ? '' : `<span class="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-semibold">${esc(CAT[n.categoria] || n.categoria)}</span>`}
                ${n.fecha_noticia ? `<span class="text-stone-500">${n.formato === 'informe' ? 'Datos con corte al' : 'Noticia del'} ${fmtFecha(n.fecha_noticia)}</span>` : ''}
                <a href="${esc(safeUrl(n.url))}" target="_blank" rel="noopener noreferrer" class="text-stone-400 hover:text-amber-400 underline underline-offset-2">Fuente: ${esc(n.fuente)}</a>
                ${relevancia(n)}
            </div>`;
    }

    // Tarjeta corta (portada)
    function tarjetaCorta(n, pagina = 'yentonces.html') {
        return `
        <article class="bg-stone-900 border border-stone-800 rounded-xl p-6 flex flex-col">
            ${cabecera(n)}
            <h4 class="serif text-lg font-bold text-white mb-2">${esc(n.titulo)}</h4>
            <p class="text-stone-400 text-sm mb-4 flex-1">${esc(n.resumen)}</p>
            ${ponderacion(n, true)}
            ${neto(n) ? `<p class="text-xs mb-4"><span class="text-stone-500">Impacto en el portafolio:</span> <span class="${neto(n)[1]} font-semibold">${neto(n)[0]}</span></p>` : ''}
            <div class="flex items-center justify-between gap-3">
                <a href="${pagina}#${esc(n.id)}" class="text-amber-400 text-sm font-semibold hover:text-amber-300">${n.formato === 'informe' ? 'Ver informe' : n.formato === 'hechos' ? 'Ver nota' : 'Ver análisis'} →</a>
                ${compartir(n, pagina)}
            </div>
        </article>`;
    }

    // Botón de compartir por WhatsApp
    function compartir(n, pagina = 'yentonces.html') {
        const url = location.origin + location.pathname.replace(/[^/]*$/, '') + pagina + '#' + n.id;
        const nt = neto(n);
        const txt = `*${n.titulo}*\n${nt ? `Impacto en el portafolio: ${nt[0]}\n` : ''}Stag Research\n${url}`;
        return `<a href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener noreferrer" aria-label="Compartir por WhatsApp"
                   class="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-300 hover:text-emerald-400 border border-stone-700 hover:border-emerald-500/50 rounded-md px-2.5 py-1.5 transition">
                   <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>
                   WhatsApp</a>`;
    }

    // Informe de solo hechos (formato "informe"): cifras clave, contexto y qué significa, sin lecturas ni ponderación
    const esInforme = n => n && (n.formato === 'informe' || n.formato === 'hechos');
    function notaInforme(n, pagina = 'yentonces.html') {
        const datos = Array.isArray(n.datos) && n.datos.length
            ? `<dl class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">${n.datos.map(d => `
                <div class="bg-stone-950 border border-stone-800 rounded-lg px-4 py-3">
                    <dt class="text-stone-500 text-[11px] uppercase tracking-wider">${esc(d.etiqueta)}</dt>
                    <dd class="text-white text-lg font-semibold mt-0.5">${esc(d.valor)}</dd>
                </div>`).join('')}</dl>` : '';
        const terminos = Array.isArray(n.terminos) && n.terminos.length
            ? `<p class="text-xs text-stone-500 mt-4">Términos en esta nota: ${n.terminos.map(t => `<button type="button" data-termino="${esc(t)}" class="text-stone-300 underline decoration-dotted underline-offset-2 hover:text-amber-400">${esc(t)}</button>`).join(' · ')}</p>` : '';
        return `
        <article id="${esc(n.id)}" data-nota data-categoria="${esc(n.categoria)}" data-afecta=""
                 class="bg-stone-900 border border-stone-800 rounded-xl p-5 sm:p-6 scroll-mt-32">
            ${cabecera(n)}
            <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">${n.formato === 'hechos' ? 'Solo hechos · Sin opinión' : 'Informe mensual · Solo hechos'}</p>
            <h3 class="serif text-xl sm:text-2xl font-bold text-white mb-3">${esc(n.titulo)}</h3>
            <p class="text-stone-200 mb-5 max-w-4xl" data-glosable>${esc(n.resumen)}</p>
            ${datos}
            ${n.contexto ? `<div class="mb-5" data-glosable>
                <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Contexto</p>
                <p class="text-stone-300 text-sm leading-relaxed max-w-4xl">${esc(n.contexto)}</p>
            </div>` : ''}
            ${n.que_significa ? `<div class="mb-5" data-glosable>
                <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Qué significa</p>
                <p class="text-stone-300 text-sm leading-relaxed max-w-4xl">${esc(n.que_significa)}</p>
            </div>` : ''}
            ${n.mirar ? `<p class="text-sm text-stone-300 border-t border-stone-800 pt-4" data-glosable><span class="text-amber-400 font-semibold">Qué mirar después:</span> ${esc(n.mirar)}</p>` : ''}
            ${terminos}
            <div class="mt-5 pt-4 border-t border-stone-800 flex justify-end">${compartir(n, pagina)}</div>
        </article>`;
    }

    // Nota completa (página Hoy): lo esencial visible, el análisis completo plegable
    function notaCompleta(n, pagina = 'yentonces.html') {
        if (esInforme(n)) return notaInforme(n, pagina);
        const afectados = Array.isArray(n.afectados) && n.afectados.length
            ? `<div class="mb-5">
                   <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">A quién afecta</p>
                   <div class="flex flex-wrap gap-2">${n.afectados.map(a => `<span class="bg-stone-800 text-stone-200 text-xs px-2.5 py-1 rounded-md">${esc(a)}</span>`).join('')}</div>
               </div>` : '';
        const terminos = Array.isArray(n.terminos) && n.terminos.length
            ? `<p class="text-xs text-stone-500 mt-4">Términos en esta nota: ${n.terminos.map(t => `<button type="button" data-termino="${esc(t)}" class="text-stone-300 underline decoration-dotted underline-offset-2 hover:text-amber-400">${esc(t)}</button>`).join(' · ')}</p>` : '';
        return `
        <article id="${esc(n.id)}" data-nota data-categoria="${esc(n.categoria)}" data-afecta="${esc((n.impacto && n.impacto.activos || []).filter(x => x.efecto !== 'neutral').map(x => x.activo).join(' '))}"
                 class="bg-stone-900 border border-stone-800 rounded-xl p-5 sm:p-6 scroll-mt-32">
            ${cabecera(n)}
            <h3 class="serif text-xl sm:text-2xl font-bold text-white mb-3">${esc(n.titulo)}</h3>
            <p class="text-stone-200 mb-5 max-w-4xl" data-glosable>${esc(n.resumen)}</p>
            ${n.contexto ? `<div class="mb-5" data-glosable>
                <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Contexto</p>
                <p class="text-stone-300 text-sm leading-relaxed max-w-4xl">${esc(n.contexto)}</p>
            </div>` : ''}
            ${ponderacion(n, false)}
            <div data-glosable>${impacto(n)}</div>
            <details class="group" data-detalle>
                <summary class="list-none cursor-pointer select-none inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300">
                    <span class="group-open:hidden">Ver análisis completo</span><span class="hidden group-open:inline">Ocultar análisis</span>
                    <svg viewBox="0 0 20 20" class="w-4 h-4 fill-current transition group-open:rotate-180" aria-hidden="true"><path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"/></svg>
                </summary>
                <div class="mt-5" data-glosable>
                    ${afectados}
                    <div class="grid md:grid-cols-2 gap-5 mb-5">
                        <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                            <p class="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Lectura alcista</p>
                            <p class="text-stone-200 text-sm leading-relaxed">${esc(n.alcista)}</p>
                        </div>
                        <div class="bg-rose-500/5 border border-rose-500/20 rounded-lg p-4">
                            <p class="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">Lectura bajista</p>
                            <p class="text-stone-200 text-sm leading-relaxed">${esc(n.bajista)}</p>
                        </div>
                    </div>
                    ${n.mirar ? `<p class="text-sm text-stone-300 border-t border-stone-800 pt-4"><span class="text-amber-400 font-semibold">Qué mirar después:</span> ${esc(n.mirar)}</p>` : ''}
                </div>
            </details>
            ${terminos}
            <div class="mt-5 pt-4 border-t border-stone-800 flex justify-end">${compartir(n, pagina)}</div>
        </article>`;
    }

    // Resumen del día: noticias × tipos de activo + balance por activo
    const SIM = { positivo: ['▲', 'text-emerald-400', 'Positivo'], negativo: ['▼', 'text-rose-400', 'Negativo'], neutral: ['■', 'text-stone-600', 'Neutral'], mixto: ['◆', 'text-amber-400', 'Mixto'] };
    const ACT_CORTO = { acciones: 'Acciones', renta_fija: 'Renta fija', dolar: 'Dólar', cdt: 'CDT' };
    function resumenDia(notas, enlaceBase) {
        notas = notas.filter(n => !esInforme(n));
        if (!notas.length) return `<p class="text-stone-400 text-sm">Esta edición trae solo informes de datos, sin efectos por tipo de activo.</p>`;
        const claves = ['acciones', 'renta_fija', 'dolar', 'cdt'];
        const efecto = (n, k) => ((n.impacto && n.impacto.activos) || []).find(x => x.activo === k);
        const balance = claves.map(k => {
            let pos = 0, neg = 0;
            notas.forEach(n => { const e = efecto(n, k); if (e && e.efecto === 'positivo') pos++; if (e && e.efecto === 'negativo') neg++; });
            const v = pos - neg;
            const [lab, col] = v >= 2 ? ['Favorable', 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'] : v <= -2 ? ['Desfavorable', 'text-rose-400 border-rose-500/30 bg-rose-500/5'] : ['Mixto', 'text-amber-400 border-amber-400/30 bg-amber-400/5'];
            return `<div class="border ${col} rounded-lg px-3 py-2">
                        <p class="text-stone-400 text-[11px] uppercase tracking-wider">${ACT[k]}</p>
                        <p class="font-semibold text-sm">${lab}</p>
                        <p class="text-stone-500 text-[11px]">${pos} a favor · ${neg} en contra</p>
                    </div>`;
        }).join('');
        const filas = notas.map(n => {
            const nt = neto(n);
            const celdas = claves.map(k => { const e = efecto(n, k); const [s, c, l] = SIM[e && e.efecto] || ['·', 'text-stone-600', '']; return `<td class="text-center px-2 py-2.5"><span class="${c} text-base" title="${l}${e && e.detalle ? ': ' + esc(e.detalle) : ''}">${s}</span></td>`; }).join('');
            return `<tr class="border-t border-stone-800 hover:bg-stone-800/40">
                <td class="py-2.5 pr-3 align-top"><a href="${enlaceBase}#${esc(n.id)}" data-ir="${esc(n.id)}" class="text-stone-200 hover:text-amber-400 text-sm leading-snug block min-w-[12rem]">${esc(n.titulo)}</a></td>
                <td class="px-2 py-2.5 text-xs font-semibold whitespace-nowrap ${nt ? nt[1] : ''}">${nt ? nt[0] : ''}</td>
                ${celdas}
            </tr>`;
        }).join('');
        return `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">${balance}</div>
            <ul class="sm:hidden divide-y divide-stone-800">${notas.map(n => {
                const nt = neto(n);
                const ef = claves.map(k => { const e = efecto(n, k); const [s, c] = SIM[e && e.efecto] || ['·', 'text-stone-600']; return `<span class="whitespace-nowrap"><span class="text-stone-500">${ACT_CORTO[k]}</span> <span class="${c}">${s}</span></span>`; }).join('');
                return `<li class="py-3"><a href="${enlaceBase}#${esc(n.id)}" data-ir="${esc(n.id)}" class="text-stone-200 text-sm leading-snug block mb-1.5">${esc(n.titulo)}</a>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">${nt ? `<span class="${nt[1]} font-semibold">${nt[0]}</span>` : ''}${ef}</div></li>`;
            }).join('')}</ul>
            <div class="hidden sm:block overflow-x-auto -mx-1 px-1">
                <table class="w-full text-left">
                    <thead><tr class="text-stone-500 text-[11px] uppercase tracking-wider">
                        <th class="pb-2 pr-3 font-semibold">Noticia</th><th class="pb-2 px-2 font-semibold">Efecto neto</th>
                        ${claves.map(k => `<th class="pb-2 px-2 font-semibold text-center whitespace-nowrap">${ACT_CORTO[k]}</th>`).join('')}
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <p class="text-stone-500 text-xs mt-3"><span class="text-emerald-400">▲</span> positivo · <span class="text-rose-400">▼</span> negativo · <span class="text-amber-400">◆</span> mixto · <span class="text-stone-600">■</span> sin efecto directo. Efecto general por tipo de activo; no es una recomendación.</p>`;
    }

    // Glosario emergente: los términos de cada nota se explican sin salir de la página
    let GLOSARIO = null;
    const cargarGlosario = () => GLOSARIO ? Promise.resolve(GLOSARIO) :
        fetch('data/glosario.json', { cache: 'no-store' }).then(r => r.json()).then(g => (GLOSARIO = Object.fromEntries((g.terminos || []).map(t => [slug(t.termino), t]))));
    function marcarTerminos(raiz, n) {
        const lista = (n.terminos || []).slice().sort((a, b) => b.length - a.length);
        raiz.querySelectorAll('[data-glosable]').forEach(zona => {
            lista.forEach(t => {
                if (zona.querySelector(`[data-termino="${CSS.escape(t)}"]`)) return;
                const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=$|[^\\p{L}\\p{N}])`, 'iu');
                const w = document.createTreeWalker(zona, NodeFilter.SHOW_TEXT, { acceptNode: x => x.parentElement.closest('button,a,[data-termino]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
                let nodo;
                while ((nodo = w.nextNode())) {
                    const m = re.exec(nodo.nodeValue);
                    if (!m) continue;
                    const ini = m.index + m[1].length;
                    const resto = nodo.splitText(ini); resto.splitText(m[2].length);
                    const b = document.createElement('button');
                    b.type = 'button'; b.dataset.termino = t;
                    b.className = 'underline decoration-dotted decoration-amber-400/70 underline-offset-2 hover:text-amber-300 cursor-help';
                    b.textContent = resto.nodeValue; resto.replaceWith(b);
                    break;
                }
            });
        });
    }
    function initPopover() {
        if (document.getElementById('pop-termino')) return;
        const pop = document.createElement('div');
        pop.id = 'pop-termino'; pop.setAttribute('role', 'dialog');
        pop.className = 'hidden fixed z-[60] max-w-xs bg-stone-900 border border-amber-400/40 rounded-lg shadow-2xl p-4 text-sm';
        document.body.appendChild(pop);
        const cerrar = () => pop.classList.add('hidden');
        document.addEventListener('click', e => {
            const b = e.target.closest('[data-termino]');
            if (!b) { if (!e.target.closest('#pop-termino')) cerrar(); return; }
            e.preventDefault();
            cargarGlosario().then(G => {
                const t = G[slug(b.dataset.termino)];
                if (!t) { location.href = 'glosario.html#' + slug(b.dataset.termino); return; }
                pop.innerHTML = `<p class="serif text-base font-bold text-white mb-1">${esc(t.termino)}</p>
                    <p class="text-stone-300 leading-relaxed mb-2">${esc(t.definicion)}</p>
                    <a href="glosario.html#${slug(t.termino)}" class="text-amber-400 text-xs font-semibold">Ver en el glosario →</a>`;
                pop.classList.remove('hidden');
                const r = b.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
                pop.style.width = w + 'px';
                pop.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 12)) + 'px';
                const h = pop.offsetHeight;
                pop.style.top = (r.bottom + 8 + h < innerHeight ? r.bottom + 8 : Math.max(12, r.top - h - 8)) + 'px';
            });
        });
        addEventListener('scroll', cerrar, { passive: true });
        addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
    }

    // Filtros por tipo de activo y categoría (página Hoy)
    function initFiltros(cont, notas) {
        const box = document.getElementById('filtros');
        if (!box) return;
        const cats = [...new Set(notas.map(n => n.categoria))];
        const chip = (grupo, valor, texto, activo) => `<button type="button" data-grupo="${grupo}" data-valor="${valor}" aria-pressed="${activo}"
            class="px-3 py-1.5 rounded-full text-xs font-semibold border transition aria-pressed:bg-amber-400 aria-pressed:text-stone-950 aria-pressed:border-amber-400 border-stone-700 text-stone-300 hover:border-amber-400">${texto}</button>`;
        box.innerHTML = `
            <div class="flex flex-wrap items-center gap-2 mb-2"><span class="text-stone-500 text-xs w-24 shrink-0">Afecta a</span>
                ${chip('activo', '', 'Todo', true)}${Object.keys(ACT).map(k => chip('activo', k, ACT_CORTO[k], false)).join('')}</div>
            <div class="flex flex-wrap items-center gap-2"><span class="text-stone-500 text-xs w-24 shrink-0">Categoría</span>
                ${chip('cat', '', 'Todas', true)}${cats.map(c => chip('cat', c, esc(CAT[c] || c), false)).join('')}</div>
            <p id="filtros-conteo" class="text-stone-500 text-xs mt-3"></p>`;
        const estado = { activo: '', cat: '' };
        const aplicar = () => {
            let vis = 0;
            cont.querySelectorAll('[data-nota]').forEach(a => {
                const ok = (!estado.activo || a.dataset.afecta.split(' ').includes(estado.activo)) && (!estado.cat || a.dataset.categoria === estado.cat);
                a.classList.toggle('hidden', !ok); if (ok) vis++;
            });
            document.getElementById('filtros-conteo').textContent = `Mostrando ${vis} de ${notas.length} notas`;
            const nada = document.getElementById('filtros-vacio');
            if (nada) nada.classList.toggle('hidden', vis > 0);
        };
        box.addEventListener('click', e => {
            const b = e.target.closest('[data-grupo]'); if (!b) return;
            estado[b.dataset.grupo] = b.dataset.valor;
            box.querySelectorAll(`[data-grupo="${b.dataset.grupo}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
            aplicar();
        });
        aplicar();
    }

    // Abre una nota (y su edición archivada si aplica) y desplaza hasta ella
    function irANota(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const ed = el.closest('details:not([data-detalle])'); if (ed) ed.open = true;
        el.classList.remove('hidden');
        const det = el.querySelector('[data-detalle]'); if (det) det.open = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const vacio = msg => `<div class="border border-dashed border-stone-700 rounded-xl p-10 text-center"><p class="text-stone-500 text-sm">${esc(msg)}</p></div>`;

    function cargar() {
        return fetch('data/notas.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
    }

    function agrupar(notas) {
        const porFecha = {};
        notas.forEach(n => (porFecha[n.fecha] ||= []).push(n));
        Object.values(porFecha).forEach(l => l.sort((a, b) => ((b.puntaje && b.puntaje.total) || 0) - ((a.puntaje && a.puntaje.total) || 0)));
        return { porFecha, fechas: Object.keys(porFecha).sort().reverse() };
    }

    // Portada: resumen del día + últimas N notas en versión corta
    window.renderPortada = function (contId, n = 3) {
        const cont = document.getElementById(contId), res = document.getElementById('resumen-portada');
        cargar().then(data => {
            const todas = Array.isArray(data.notas) ? data.notas : [];
            const { porFecha: pf, fechas: fs } = agrupar(todas);
            const notas = (fs.length ? pf[fs[0]] : []).slice(0, n);
            cont.innerHTML = notas.length ? notas.map(n => tarjetaCorta(n)).join('') : vacio('Las primeras notas se publicarán muy pronto.');
            if (res && todas.length) {
                const { porFecha, fechas } = agrupar(todas);
                const t = document.getElementById('resumen-portada-fecha'); if (t) t.textContent = 'Edición del ' + fmtFecha(fechas[0]);
                res.innerHTML = resumenDia(porFecha[fechas[0]], 'yentonces.html');
                const pa = document.getElementById('portada-actualizado'); if (pa && data.actualizado) pa.innerHTML = sello(data.actualizado);
            }
        }).catch(() => { cont.innerHTML = vacio('No pudimos cargar las notas en este momento.'); });
    };

    // Página Hoy: resumen del día, filtros, edición más reciente y archivo
    window.renderPagina = function () {
        const hoy = document.getElementById('notas-hoy');
        initPopover();
        cargar().then(data => {
            const notas = Array.isArray(data.notas) ? data.notas : [];
            if (data.actualizado) document.getElementById('notas-actualizado').innerHTML = sello(data.actualizado);
            if (!notas.length) { hoy.innerHTML = vacio('Las primeras notas se publicarán muy pronto.'); return; }
            const { porFecha, fechas } = agrupar(notas);
            const ed = porFecha[fechas[0]];
            document.getElementById('notas-hoy-titulo').textContent = 'Edición del ' + fmtFecha(fechas[0]);
            const r = document.getElementById('resumen-dia'); if (r) r.innerHTML = resumenDia(ed, '');
            // Todas las notas de la edición juntas, ordenadas por relevancia (La región, portafolio y biotecnología incluidas)
            hoy.innerHTML = ed.map(notaCompleta).join('') + `<div id="filtros-vacio" class="hidden">${vacio('Ninguna nota de hoy coincide con ese filtro.')}</div>`;
            ed.forEach(n => marcarTerminos(document.getElementById(n.id), n));
            initFiltros(hoy, ed);
            const resto = fechas.slice(1);
            if (resto.length) {
                document.getElementById('archivo-wrap').classList.remove('hidden');
                document.getElementById('archivo').innerHTML = resto.map(f => `
                    <details class="group/ed">
                        <summary class="cursor-pointer text-stone-300 font-semibold capitalize hover:text-amber-400">${fmtFecha(f)} · ${porFecha[f].length} notas</summary>
                        <div class="space-y-6 mt-4">${porFecha[f].map(notaCompleta).join('')}</div>
                    </details>`).join('');
                resto.forEach(f => porFecha[f].forEach(n => marcarTerminos(document.getElementById(n.id), n)));
            }
            document.addEventListener('click', e => {
                const a = e.target.closest('[data-ir]'); if (!a) return;
                e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.ir); irANota(a.dataset.ir);
            });
            if (location.hash) setTimeout(() => irANota(decodeURIComponent(location.hash.slice(1))), 50);
        }).catch(() => { hoy.innerHTML = vacio('No pudimos cargar las notas en este momento.'); });
    };


    // ===== Biotecnología (data/biotech.json): panorama y fichas, sin noticias; se actualiza el 1 de cada mes =====
    function medicamentoPrincipal(m) {
        if (!m || !m.nombre) return '';
        const chip = (t, cls) => t ? `<span class="${cls} text-xs font-semibold px-2.5 py-1 rounded-md border">${esc(t)}</span>` : '';
        return `
            <div class="mb-3">
                <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1.5">Medicamento principal</p>
                <div class="flex flex-wrap gap-1.5">
                    ${chip(m.nombre, 'bg-amber-400/10 text-amber-300 border-amber-400/30')}
                    ${m.fase ? `<button type="button" data-termino="${esc(m.fase)}" title="¿Qué significa esta etapa?" class="bg-sky-400/10 text-sky-300 border-sky-400/30 hover:border-sky-300 text-xs font-semibold px-2.5 py-1 rounded-md border cursor-help inline-flex items-center gap-1">${esc(m.fase)}<span aria-hidden="true" class="text-sky-300/70 text-[10px] leading-none border border-sky-300/50 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center">?</span></button>` : ''}
                    ${chip(m.enfermedad, 'bg-stone-800 text-stone-200 border-stone-700')}
                </div>
            </div>`;
    }
    function hitosLista(hitos) {
        return (hitos || []).length
            ? `<ul class="space-y-2">${hitos.map(h => `<li class="text-sm text-stone-300 flex flex-col sm:flex-row sm:gap-3"><span class="text-amber-400 text-xs sm:w-28 sm:shrink-0 sm:pt-0.5">${esc(h.fecha)}</span><span>${esc(h.texto)}</span></li>`).join('')}</ul>`
            : '<p class="text-stone-500 text-sm">Sin fechas confirmadas.</p>';
    }
    function fichaBiotech(c) {
        const prox = (c.hitos || [])[0];
        return `
        <div data-ficha="${esc(c.ticker)}" class="group/ficha bg-stone-900 border border-stone-800 rounded-xl p-5 flex flex-col">
            <div class="flex items-baseline justify-between gap-2 mb-2">
                <p class="text-white font-bold text-lg">${esc(c.nombre)}</p>
                <span class="text-sky-300 text-xs font-semibold">${String(c.bolsa || '').includes(':') ? esc(c.bolsa) : `${esc(c.bolsa)}: ${esc(c.ticker)}`}</span>
            </div>
            ${medicamentoPrincipal(c.medicamento_principal)}
            ${prox ? `<p class="text-sm text-stone-300 mb-3 group-has-[details[open]]/ficha:hidden"><span class="text-stone-500 text-xs font-bold uppercase tracking-wider block mb-1">Próximo hito</span><span class="text-amber-400 text-xs">${esc(prox.fecha)}</span> · ${esc(prox.texto)}</p>` : ''}
            <details class="group" open>
                <summary class="tap-amplio cursor-pointer text-stone-400 hover:text-amber-400 text-xs font-semibold list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-1"><span class="group-open:hidden">Ver más de la compañía</span><span class="hidden group-open:inline">Ver menos</span><span aria-hidden="true" class="transition group-open:rotate-180">▾</span></summary>
                <div class="mt-3 space-y-3">
                    <p class="text-stone-300 text-sm leading-relaxed"><span class="text-stone-500 text-xs font-bold uppercase tracking-wider block mb-1">Qué hace</span>${esc(c.que_hace)}</p>
                    ${c.estado ? `<p class="text-stone-400 text-sm leading-relaxed"><span class="text-stone-500 text-xs font-bold uppercase tracking-wider block mb-1">Estado</span>${esc(c.estado)}</p>` : ''}
                    <div><p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Próximos hitos</p>${hitosLista(c.hitos)}</div>
                    ${c.fuente_url ? `<a href="${esc(safeUrl(c.fuente_url))}" target="_blank" rel="noopener noreferrer" class="tap-amplio text-stone-500 hover:text-amber-400 text-xs underline underline-offset-2 inline-block">Fuente</a>` : ''}
                </div>
            </details>
        </div>`;
    }
    // ===== PDF del panorama: versión en fondo blanco para imprimir o guardar como PDF (carta horizontal) =====
    const CSS_PDF = `
        #pdf-panorama { display: none; }
        @media print {
            @page { size: letter landscape; margin: 0.4in 0.45in; }
            body.imprimir-panorama { background: #fff !important; }
            body.imprimir-panorama > *:not(#pdf-panorama) { display: none !important; }
            body.imprimir-panorama #pdf-panorama { display: block; }
        }
        #pdf-panorama { font-family: 'Inter', system-ui, sans-serif; color: #111; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #pdf-panorama .pp-cab { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
        #pdf-panorama h1 { font-size: 17pt; font-weight: 700; margin: 0; color: #111; }
        #pdf-panorama .pp-fecha { font-size: 8.5pt; color: #555; white-space: nowrap; }
        #pdf-panorama .pp-sub { font-size: 8.5pt; color: #444; margin: 2pt 0 9pt; }
        #pdf-panorama table { width: 100%; border-collapse: collapse; font-size: 8pt; line-height: 1.3; }
        #pdf-panorama thead th { text-align: left; font-size: 6.8pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #333; padding: 0 5pt 4pt; border-bottom: 1.2pt solid #111; }
        #pdf-panorama tbody td { padding: 4pt 5pt; border-bottom: 0.6pt solid #c8c8c8; vertical-align: top; }
        #pdf-panorama tr { break-inside: avoid; page-break-inside: avoid; }
        #pdf-panorama .pp-nom { font-weight: 700; }
        #pdf-panorama .pp-tk { display: block; font-size: 6.8pt; color: #666; margin-top: 1pt; }
        #pdf-panorama .pp-med { font-weight: 700; }
        #pdf-panorama .pp-fase { display: inline-block; border: 0.7pt solid #333; border-radius: 3pt; padding: 0 3.5pt; font-size: 7pt; white-space: nowrap; }
        #pdf-panorama .pp-hf { display: block; font-weight: 700; }
        #pdf-panorama col.c1 { width: 17%; } #pdf-panorama col.c2 { width: 14%; } #pdf-panorama col.c3 { width: 12%; } #pdf-panorama col.c4 { width: 20%; } #pdf-panorama col.c5 { width: 37%; }
    `;
    function pdfPanorama(pan) {
        const filas = (pan.companias || []).map(c => `
            <tr>
                <td><span class="pp-nom">${esc(c.nombre)}</span><span class="pp-tk">${esc(c.ticker)}</span></td>
                <td class="pp-med">${esc(c.medicamento)}</td>
                <td><span class="pp-fase">${esc(c.fase)}</span></td>
                <td>${esc(c.enfermedad)}</td>
                <td><span class="pp-hf">${esc(c.hito_fecha)}</span>${esc(c.hito)}</td>
            </tr>`).join('');
        return `
            <div class="pp-cab"><h1>Panorama de biotecnológicas</h1>${pan.actualizado ? `<span class="pp-fecha">Datos al ${esc(pan.actualizado)}</span>` : ''}</div>
            <p class="pp-sub">El medicamento más avanzado de cada compañía y su próximo paso.</p>
            <table>
                <colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5"></colgroup>
                <thead><tr><th>Compañía</th><th>Medicamento</th><th>Fase</th><th>Enfermedad</th><th>Próximo hito</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>`;
    }
    function prepararPdfPanorama(pan) {
        if (!document.getElementById('pdf-panorama-css')) {
            const st = document.createElement('style'); st.id = 'pdf-panorama-css'; st.textContent = CSS_PDF; document.head.appendChild(st);
        }
        let box = document.getElementById('pdf-panorama');
        if (!box) { box = document.createElement('div'); box.id = 'pdf-panorama'; document.body.appendChild(box); }
        box.innerHTML = pdfPanorama(pan);
        const btn = document.getElementById('bio-pdf-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const titulo = document.title;
            const fin = () => { document.body.classList.remove('imprimir-panorama'); document.title = titulo; window.removeEventListener('afterprint', fin); };
            document.body.classList.add('imprimir-panorama');
            document.title = 'Panorama de biotecnologicas';   // nombre sugerido del archivo al guardar como PDF
            window.addEventListener('afterprint', fin);
            window.print();
        });
    }
    function panoramaBiotech(pan) {
        const fase = f => `<button type="button" data-termino="${esc(f)}" class="bg-sky-400/10 text-sky-300 border border-sky-400/30 hover:border-sky-300 text-xs font-semibold px-2 py-0.5 rounded-md cursor-help whitespace-nowrap">${esc(f)}</button>`;
        const fuente = c => c.fuente_url ? `<a href="${esc(safeUrl(c.fuente_url))}" target="_blank" rel="noopener noreferrer" class="tap-amplio text-stone-500 hover:text-amber-400 underline underline-offset-2 text-xs">Fuente</a>` : '';
        const filas = pan.companias || [];
        const tabla = `
        <div class="hidden md:block overflow-hidden rounded-xl border border-stone-800">
            <table class="w-full text-sm text-left">
                <thead class="bg-stone-900 text-stone-500 text-xs uppercase tracking-wider">
                    <tr><th class="px-4 py-3 font-bold">Compañía</th><th class="px-4 py-3 font-bold">Medicamento</th><th class="px-4 py-3 font-bold">Fase</th><th class="px-4 py-3 font-bold">Enfermedad</th><th class="px-4 py-3 font-bold">Próximo hito</th></tr>
                </thead>
                <tbody class="divide-y divide-stone-800">${filas.map(c => `
                    <tr class="hover:bg-stone-900/60 align-top">
                        <td class="px-4 py-3"><span class="text-white font-semibold">${esc(c.nombre)}</span> <span class="text-sky-300 text-xs">${esc(c.ticker)}</span></td>
                        <td class="px-4 py-3 text-amber-300">${esc(c.medicamento)}</td>
                        <td class="px-4 py-3">${fase(c.fase)}</td>
                        <td class="px-4 py-3 text-stone-300">${esc(c.enfermedad)}</td>
                        <td class="px-4 py-3 text-stone-300"><span class="text-amber-400 text-xs block">${esc(c.hito_fecha)}</span>${esc(c.hito)} ${fuente(c)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
        const lista = `
        <ul class="md:hidden divide-y divide-stone-800 border-y border-stone-800">${filas.map(c => `
            <li class="py-3">
                <div class="flex items-baseline justify-between gap-2"><span class="text-white font-semibold">${esc(c.nombre)}</span><span class="text-sky-300 text-xs">${esc(c.ticker)}</span></div>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm"><span class="text-amber-300">${esc(c.medicamento)}</span>${fase(c.fase)}<span class="text-stone-400">${esc(c.enfermedad)}</span></div>
                <p class="text-sm text-stone-300 mt-1"><span class="text-amber-400 text-xs">${esc(c.hito_fecha)}</span> · ${esc(c.hito)} ${fuente(c)}</p>
            </li>`).join('')}
        </ul>`;
        return tabla + lista;
    }
    window.renderBiotech = function () {
        const cont = document.getElementById('bio-empresas');
        initPopover();
        fetch('data/biotech.json', { cache: 'no-store' }).then(r => r.json()).then(d => {
            if (d.panorama && (d.panorama.companias || []).length) {
                document.getElementById('bio-panorama').innerHTML = panoramaBiotech(d.panorama);
                if (d.panorama.actualizado) document.getElementById('bio-panorama-fecha').textContent = 'Datos al ' + d.panorama.actualizado;
                document.getElementById('bio-panorama-wrap').classList.remove('hidden');
                prepararPdfPanorama(d.panorama);
            }
            const cias = d.companias || [];
            cont.innerHTML = cias.length ? cias.map(fichaBiotech).join('') : vacio('Aún no hay fichas de compañías.');
            cont.removeAttribute('aria-busy');
            const f = document.getElementById('bio-empresas-fecha');
            if (f && d.actualizado) f.textContent = 'Datos al ' + d.actualizado;
        }).catch(() => { cont.innerHTML = vacio('No pudimos cargar esta sección en este momento.'); });
    };



    // Menú móvil
    window.initMenu = function () {
        document.querySelectorAll('[data-dropdown]').forEach(dd => {
            const b = dd.querySelector('button'), m = dd.querySelector('[data-menu]');
            const set = abierto => { m.classList.toggle('hidden', !abierto); b.setAttribute('aria-expanded', abierto); };
            let hoverAt = 0, cierre = null;
            // Puente invisible sobre el hueco entre el botón y el menú (mt-3), para que el mouse no "salga" al bajar
            const puente = document.createElement('span');
            puente.setAttribute('aria-hidden', 'true');
            puente.style.cssText = 'position:absolute;left:-1rem;right:-1rem;top:100%;height:0.875rem;';
            dd.appendChild(puente);
            const cancelarCierre = () => { if (cierre) { clearTimeout(cierre); cierre = null; } };
            b.addEventListener('click', e => { e.stopPropagation(); cancelarCierre(); if (Date.now() - hoverAt < 600) set(true); else set(m.classList.contains('hidden')); });
            dd.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { cancelarCierre(); hoverAt = Date.now(); set(true); } });
            // Pequeña espera antes de cerrar: si el mouse vuelve al menú en ese tiempo, sigue abierto
            dd.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { cancelarCierre(); cierre = setTimeout(() => set(false), 250); } });
            document.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
        });
        const btn = document.getElementById('menu-btn'), panel = document.getElementById('menu-movil');
        if (!btn || !panel) return;
        btn.addEventListener('click', () => {
            const abierto = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', !abierto); panel.classList.toggle('hidden', abierto);
        });
        panel.addEventListener('click', e => { if (e.target.closest('a')) { btn.setAttribute('aria-expanded', 'false'); panel.classList.add('hidden'); } });
    };


    // Barra superior: dólar (TRM oficial, datos.gov.co) y última actualización
    window.renderBarra = function () {
        const el = document.getElementById('barra-mercado');
        if (!el) return;
        const q = k => el.querySelector(`[data-${k}]`);
        const num = (v, d = 2) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
        const fecha = iso => String(iso || '').slice(0, 10).split('-').reverse().slice(0, 2).join('/');
        const var_ = pct => {
            if (!Number.isFinite(pct)) return '';
            const col = pct > 0 ? 'text-emerald-400' : pct < 0 ? 'text-rose-400' : 'text-stone-400';
            const sig = pct > 0 ? '▲' : pct < 0 ? '▼' : '■';
            return ` <span class="${col}">${sig} ${num(Math.abs(pct))}%</span>`;
        };
        const set = (k, html) => { const n = q(k); if (n) n.innerHTML = html; };
        const pintaTrm = (hoy, ant, vig) => {
            if (!Number.isFinite(hoy)) return;
            const pct = Number.isFinite(ant) && ant ? (hoy - ant) / ant * 100 : NaN;
            set('trm', `<span class="text-white font-semibold">$${num(hoy)}</span>${var_(pct)} <span class="text-stone-500 hidden xl:inline">${fecha(vig)}</span>`);
        };
        cargar().then(d => { if (d.actualizado) set('actualizado', d.actualizado.replace(/, \d{4}/, '').replace(/ \(hora Bogotá\)/, '')); }).catch(() => {});
        fetch('data/mercado.json', { cache: 'no-store' }).then(r => r.json()).then(m => {
            if (m.trm) pintaTrm(Number(m.trm.valor), Number(m.trm.anterior), m.trm.vigente_desde);
            if (m.brent) set('brent', `<span class="text-white font-semibold">US$${num(m.brent.valor)}</span>${var_(Number(m.brent.cambio_pct))} <span class="text-stone-500 hidden xl:inline">${fecha(m.brent.fecha)}</span>`);
            if (m.colcap) set('colcap', `<span class="text-white font-semibold">${num(m.colcap.valor)}</span>${var_(Number(m.colcap.cambio_pct))} <span class="text-stone-500 hidden xl:inline">${fecha(m.colcap.fecha)}</span>`);
            if (m.tasa_banrep) set('banrep', `<span class="text-white font-semibold">${num(m.tasa_banrep.valor)}%</span>`);
            if (m.inflacion) set('inflacion', `<span class="text-white font-semibold">${num(m.inflacion.valor)}%</span> <span class="text-stone-500">${m.inflacion.periodo || ''}</span>`);
        }).catch(() => {}).finally(() => {
            // Si el navegador alcanza la fuente oficial, la TRM se actualiza con el dato más reciente
            fetch('https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=2')
                .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(rows => { if (rows && rows[0]) pintaTrm(Number(rows[0].valor), rows[1] ? Number(rows[1].valor) : NaN, rows[0].vigenciadesde); })
                .catch(() => {})
                .finally(() => el.querySelectorAll('[data-trm],[data-brent],[data-colcap],[data-banrep],[data-inflacion]').forEach(n => { if (n.querySelector('.sk')) n.textContent = 'n. d.'; }));
        });
    };

    // Página de glosario: términos del día (última edición) + glosario completo
    window.renderGlosario = function () {
        Promise.all([cargar(), fetch('data/glosario.json', { cache: 'no-store' }).then(r => r.json())]).then(([d, g]) => {
            const terms = (g.terminos || []).slice().sort((a, b) => a.termino.localeCompare(b.termino, 'es'));
            const mapa = Object.fromEntries(terms.map(t => [slug(t.termino), t]));
            const ficha = (t, destacada) => `
                <div id="${slug(t.termino)}" class="scroll-mt-24 ${destacada ? 'bg-stone-900 border border-amber-400/30' : 'bg-stone-900 border border-stone-800'} rounded-xl p-5">
                    <p class="serif text-lg font-bold text-white mb-1">${esc(t.termino)}</p>
                    <p class="text-stone-300 text-sm leading-relaxed">${esc(t.definicion)}</p>
                </div>`;
            const notas = Array.isArray(d.notas) ? d.notas : [];
            const ult = notas.length ? notas.map(n => n.fecha).sort().reverse()[0] : null;
            const delDia = [...new Set(notas.filter(n => n.fecha === ult).flatMap(n => n.terminos || []))]
                .map(t => mapa[slug(t)]).filter(Boolean);
            const dia = document.getElementById('terminos-dia');
            if (ult) document.getElementById('terminos-dia-fecha').textContent = 'Edición del ' + fmtFecha(ult);
            dia.innerHTML = delDia.length ? delDia.map(t => ficha(t, true)).join('') : vacio('Aún no hay términos para la edición de hoy.');
            document.getElementById('glosario').innerHTML = terms.map(t => ficha(t, false).replace(`id="${slug(t.termino)}"`, `id="g-${slug(t.termino)}"`)).join('');
            if (location.hash) {
                const h = location.hash.slice(1);
                const e = document.getElementById(h) || document.getElementById('g-' + h);
                if (e) e.scrollIntoView();
            }
        }).catch(() => { document.getElementById('terminos-dia').innerHTML = vacio('No pudimos cargar el glosario en este momento.'); });
    };
})();
