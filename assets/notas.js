// Renderizado de notas ¿Y Entonces? — compartido por index.html y yentonces.html
// Datos: data/notas.json (esquema en bot/INSTRUCCIONES.md)
(function () {
    const CAT = { bvc: 'BVC', macro: 'Macro Colombia', commodities: 'Commodities', latam: 'LatAm', internacional: 'Mercados internacionales', politica: 'Política económica', sectores: 'Sectores' };
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const slug = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '#';
    const fmtFecha = f => {
        const [y, m, d] = String(f).split('-').map(Number);
        if (!y) return esc(f);
        return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };


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

    function cabecera(n) {
        return `
            <div class="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <span class="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-semibold">${esc(CAT[n.categoria] || n.categoria)}</span>
                <a href="${esc(safeUrl(n.url))}" target="_blank" rel="noopener noreferrer" class="text-stone-400 hover:text-amber-400 underline underline-offset-2">Fuente: ${esc(n.fuente)}</a>
            </div>`;
    }

    // Tarjeta corta (portada)
    function tarjetaCorta(n) {
        return `
        <article class="bg-stone-900 border border-stone-800 rounded-xl p-6 flex flex-col">
            ${cabecera(n)}
            <h4 class="serif text-lg font-bold text-white mb-2">${esc(n.titulo)}</h4>
            <p class="text-stone-400 text-sm mb-4 flex-1">${esc(n.resumen)}</p>
            ${ponderacion(n, true)}
            <a href="yentonces.html#${esc(n.id)}" class="text-amber-400 text-sm font-semibold hover:text-amber-300">Ver análisis →</a>
        </article>`;
    }

    // Nota completa (página ¿Y Entonces?)
    function notaCompleta(n) {
        const afectados = Array.isArray(n.afectados) && n.afectados.length
            ? `<div class="mb-5">
                   <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">A quién afecta</p>
                   <div class="flex flex-wrap gap-2">${n.afectados.map(a => `<span class="bg-stone-800 text-stone-200 text-xs px-2.5 py-1 rounded-md">${esc(a)}</span>`).join('')}</div>
               </div>` : '';
        return `
        <article id="${esc(n.id)}" class="bg-stone-900 border border-stone-800 rounded-xl p-6 sm:p-8 scroll-mt-24">
            ${cabecera(n)}
            <h3 class="serif text-2xl font-bold text-white mb-3">${esc(n.titulo)}</h3>
            <p class="text-stone-200 mb-5">${esc(n.resumen)}</p>
            ${n.contexto ? `<div class="mb-5">
                <p class="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Contexto</p>
                <p class="text-stone-300 text-sm leading-relaxed">${esc(n.contexto)}</p>
            </div>` : ''}
            ${afectados}
            ${ponderacion(n, false)}
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
            ${Array.isArray(n.terminos) && n.terminos.length ? `<p class="text-xs text-stone-500 mt-4">Términos en esta nota: ${n.terminos.map(t => `<a href="glosario.html#${slug(t)}" class="text-stone-300 underline underline-offset-2 hover:text-amber-400">${esc(t)}</a>`).join(' · ')}</p>` : ''}
        </article>`;
    }

    const vacio = msg => `<div class="border border-dashed border-stone-700 rounded-xl p-10 text-center"><p class="text-stone-500 text-sm">${esc(msg)}</p></div>`;

    function cargar() {
        return fetch('data/notas.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
    }

    function agrupar(notas) {
        const porFecha = {};
        notas.forEach(n => (porFecha[n.fecha] ||= []).push(n));
        return { porFecha, fechas: Object.keys(porFecha).sort().reverse() };
    }

    // Portada: últimas N notas en versión corta
    window.renderPortada = function (contId, n = 3) {
        const cont = document.getElementById(contId);
        cargar().then(data => {
            const notas = (Array.isArray(data.notas) ? data.notas : []).slice(0, n);
            cont.innerHTML = notas.length ? notas.map(tarjetaCorta).join('') : vacio('Las primeras notas ¿Y Entonces? se publicarán muy pronto.');
        }).catch(() => { cont.innerHTML = vacio('No pudimos cargar las notas en este momento.'); });
    };

    // Página ¿Y Entonces?: edición más reciente completa + archivo
    window.renderPagina = function () {
        const hoy = document.getElementById('notas-hoy');
        cargar().then(data => {
            const notas = Array.isArray(data.notas) ? data.notas : [];
            if (data.actualizado) document.getElementById('notas-actualizado').textContent = 'Actualizado: ' + data.actualizado;
            if (!notas.length) { hoy.innerHTML = vacio('Las primeras notas ¿Y Entonces? se publicarán muy pronto.'); return; }
            const { porFecha, fechas } = agrupar(notas);
            document.getElementById('notas-hoy-titulo').textContent = 'Edición del ' + fmtFecha(fechas[0]);
            hoy.innerHTML = porFecha[fechas[0]].map(notaCompleta).join('');
            const resto = fechas.slice(1);
            if (resto.length) {
                document.getElementById('archivo-wrap').classList.remove('hidden');
                document.getElementById('archivo').innerHTML = resto.map(f => `
                    <details class="group">
                        <summary class="cursor-pointer text-stone-300 font-semibold capitalize hover:text-amber-400">${fmtFecha(f)} · ${porFecha[f].length} notas</summary>
                        <div class="space-y-6 mt-4">${porFecha[f].map(notaCompleta).join('')}</div>
                    </details>`).join('');
            }
            // Si llega con #id de una nota archivada, abrir su edición y desplazar
            if (location.hash) {
                const el = document.getElementById(location.hash.slice(1));
                if (el) { const d = el.closest('details'); if (d) d.open = true; el.scrollIntoView(); }
            }
        }).catch(() => { hoy.innerHTML = vacio('No pudimos cargar las notas en este momento.'); });
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
            set('trm', `<span class="text-white font-semibold">$${num(hoy)}</span>${var_(pct)} <span class="text-stone-500">${fecha(vig)}</span>`);
        };
        cargar().then(d => { if (d.actualizado) set('actualizado', d.actualizado); }).catch(() => {});
        fetch('data/mercado.json', { cache: 'no-store' }).then(r => r.json()).then(m => {
            if (m.trm) pintaTrm(Number(m.trm.valor), Number(m.trm.anterior), m.trm.vigente_desde);
            if (m.brent) set('brent', `<span class="text-white font-semibold">US$${num(m.brent.valor)}</span>${var_(Number(m.brent.cambio_pct))} <span class="text-stone-500">${fecha(m.brent.fecha)}</span>`);
            if (m.colcap) set('colcap', `<span class="text-white font-semibold">${num(m.colcap.valor)}</span>${var_(Number(m.colcap.cambio_pct))} <span class="text-stone-500">${fecha(m.colcap.fecha)}</span>`);
            if (m.tasa_banrep) set('banrep', `<span class="text-white font-semibold">${num(m.tasa_banrep.valor)}%</span>`);
            if (m.inflacion) set('inflacion', `<span class="text-white font-semibold">${num(m.inflacion.valor)}%</span> <span class="text-stone-500">${m.inflacion.periodo || ''}</span>`);
        }).catch(() => {}).finally(() => {
            // Si el navegador alcanza la fuente oficial, la TRM se actualiza con el dato más reciente
            fetch('https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=2')
                .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(rows => { if (rows && rows[0]) pintaTrm(Number(rows[0].valor), rows[1] ? Number(rows[1].valor) : NaN, rows[0].vigenciadesde); })
                .catch(() => {})
                .finally(() => el.querySelectorAll('[data-trm],[data-brent],[data-colcap],[data-banrep],[data-inflacion]').forEach(n => { if (/cargando/i.test(n.textContent)) n.textContent = 'n. d.'; }));
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
