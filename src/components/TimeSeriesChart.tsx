"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChartSeries } from "@/lib/stats";
import {
  formatCount,
  formatDay,
  formatDayLong,
  formatListeningTime,
  formatTimeTick,
  labelIndexes,
  niceScale,
  niceTimeScale,
} from "@/lib/formatStats";

// Courbe journalière avec survol (repère vertical + info-bulle), parcours au
// clavier et son jumeau en tableau. Une seule série à l'écran : s'il y en a
// plusieurs, un sélecteur de mesure choisit laquelle (jamais deux axes Y).
//
// Spécifications de la DA et de la charte graphique : ligne de 2 px en cyan (la
// mesure active), remplissage en simple voile, quadrillage en traits fins et
// discrets, repère final avec un anneau de la couleur de la surface. Le texte
// (axes, valeurs) garde les teintes de texte : la couleur de la série n'est
// portée que par la marque.

const HEIGHT = 208; // hauteur de l'SVG, bande de l'axe X comprise
const MARGIN = { top: 12, right: 12, bottom: 28, left: 52 };
const NO_POINTS: ChartSeries["points"] = [];

function formatValue(unit: ChartSeries["unit"], value: number): string {
  return unit === "time" ? formatListeningTime(value) : formatCount(value);
}

// Graduation de l'axe Y : des durées courtes pour le temps d'écoute (30m, 1h), sinon des nombres.
function formatTick(unit: ChartSeries["unit"], tick: number): string {
  return unit === "time" ? formatTimeTick(tick) : formatCount(tick);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function TimeSeriesChart({ series, label }: { series: ChartSeries[]; label: string }) {
  const [activeKey, setActiveKey] = useState(series[0]?.key);
  const [hover, setHover] = useState<number | null>(null);
  const [announce, setAnnounce] = useState(false);
  const [width, setWidth] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = `chart-fill-${useId().replace(/:/g, "")}`;

  const active = series.find((s) => s.key === activeKey) ?? series[0];
  const points = active ? active.points : NO_POINTS;
  const n = points.length;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);

  const plotW = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const geometry = useMemo(() => {
    if (!active || n === 0 || plotW === 0) return null;
    // Un temps a ses propres pas « ronds » (30m, 1h, 3h) ; un compte, des pas décimaux.
    const peak = Math.max(...points.map((p) => p.value));
    const scale = active.unit === "time" ? niceTimeScale(peak, 4) : niceScale(peak, 4, true);
    const step = n > 1 ? plotW / (n - 1) : 0;
    const x = (i: number) => MARGIN.left + (n > 1 ? i * step : plotW / 2);
    const y = (v: number) => MARGIN.top + plotH * (1 - v / scale.max);
    const coords = points.map((p, i) => [x(i), y(p.value)] as const);
    const line = coords.map(([cx, cy], i) => `${i === 0 ? "M" : "L"}${cx.toFixed(1)},${cy.toFixed(1)}`).join(" ");
    const baseline = MARGIN.top + plotH;
    const area = `${line} L${coords[n - 1][0].toFixed(1)},${baseline} L${coords[0][0].toFixed(1)},${baseline} Z`;
    return { scale, step, x, y, line, area, baseline };
  }, [active, points, n, plotW, plotH]);

  if (!active || n === 0) return null;

  function moveTo(next: number) {
    setHover(clamp(next, 0, n - 1));
  }

  function onPointerMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg || !geometry) return;
    const x = e.clientX - svg.getBoundingClientRect().left;
    setAnnounce(false);
    moveTo(n > 1 ? Math.round((x - MARGIN.left) / geometry.step) : 0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const current = hover ?? n - 1;
    const handlers: Record<string, () => void> = {
      ArrowLeft: () => moveTo(hover === null ? n - 1 : current - 1),
      ArrowRight: () => moveTo(hover === null ? n - 1 : current + 1),
      Home: () => moveTo(0),
      End: () => moveTo(n - 1),
      Escape: () => setHover(null),
    };
    const handler = handlers[e.key];
    if (!handler) return;
    e.preventDefault();
    setAnnounce(true);
    handler();
  }

  const shown = hover ?? n - 1; // sans survol, le repère est sur le dernier jour
  const shownPoint = points[shown];

  // Étiquettes de l'axe X : 3 sur petit écran, 5 sinon, réparties régulièrement.
  const xLabels = labelIndexes(n, width < 460 ? 3 : 5);

  const tooltipX = geometry ? clamp(geometry.x(shown), 72, Math.max(width - 72, 72)) : 0;
  const tooltipY = geometry ? geometry.y(shownPoint.value) : 0;
  // Sous le point quand il est trop haut pour que l'info-bulle tienne au-dessus.
  const tooltipBelow = tooltipY < 70;

  return (
    <div className="chart">
      {series.length > 1 && (
        <div className="chart__metrics" role="group" aria-label="Metric">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`pill${s.key === active.key ? " active" : ""}`}
              aria-pressed={s.key === active.key}
              onClick={() => setActiveKey(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Le survol à la souris et les flèches du clavier lisent les mêmes valeurs ;
          le tableau juste en dessous donne toutes les valeurs sans rien survoler. */}
      <div
        ref={wrapRef}
        className="chart__plot"
        style={{ height: HEIGHT }}
        tabIndex={0}
        role="group"
        aria-label={`${label} — use the arrow keys to read each day`}
        onKeyDown={onKeyDown}
        onBlur={() => setHover(null)}
      >
        {geometry && (
          <>
            <svg ref={svgRef} width={width} height={HEIGHT} aria-hidden="true">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--vynl-cyan)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--vynl-cyan)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {geometry.scale.ticks.map((tick) => {
                const ty = MARGIN.top + plotH * (1 - tick / geometry.scale.max);
                return (
                  <g key={tick}>
                    <line className="chart-grid" x1={MARGIN.left} x2={MARGIN.left + plotW} y1={ty} y2={ty} />
                    <text className="chart-axis" x={MARGIN.left - 10} y={ty + 4} textAnchor="end">
                      {formatTick(active.unit, tick)}
                    </text>
                  </g>
                );
              })}

              <path d={geometry.area} fill={`url(#${gradientId})`} />
              <path
                d={geometry.line}
                fill="none"
                stroke="var(--vynl-cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hover !== null && (
                <line
                  className="chart-crosshair"
                  x1={geometry.x(hover)}
                  x2={geometry.x(hover)}
                  y1={MARGIN.top}
                  y2={geometry.baseline}
                />
              )}

              {/* Repère : anneau de la couleur de la surface pour rester lisible sur la courbe. */}
              <circle cx={geometry.x(shown)} cy={geometry.y(shownPoint.value)} r="6" fill="var(--vynl-vinyle)" />
              <circle cx={geometry.x(shown)} cy={geometry.y(shownPoint.value)} r="4" fill="var(--vynl-cyan)" />

              {xLabels.map((i, k) => (
                <text
                  key={i}
                  className="chart-axis"
                  x={geometry.x(i)}
                  y={HEIGHT - 8}
                  textAnchor={k === 0 ? "start" : k === xLabels.length - 1 ? "end" : "middle"}
                >
                  {formatDay(points[i].day)}
                </text>
              ))}

              {/* Zone de survol plus large que la courbe : on vise un jour, pas un trait de 2 px. */}
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={plotW}
                height={plotH}
                fill="transparent"
                onPointerMove={onPointerMove}
                onPointerDown={onPointerMove}
                // À la souris, l'info-bulle suit le pointeur et disparaît à la sortie ; au
                // doigt elle reste affichée après le toucher (sinon on ne la verrait jamais).
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") setHover(null);
                }}
              />
            </svg>

            {hover !== null && (
              <div
                className="chart__tooltip"
                style={{
                  left: tooltipX,
                  top: tooltipBelow ? tooltipY + 14 : tooltipY - 14,
                  transform: tooltipBelow ? "translateX(-50%)" : "translate(-50%, -100%)",
                }}
              >
                <span>{formatDayLong(shownPoint.day)}</span>
                <span className="chart__tooltip-row">
                  <span className="chart__key" aria-hidden="true" />
                  <strong>{formatValue(active.unit, shownPoint.value)}</strong>
                  <span>{active.label.toLowerCase()}</span>
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="sr-only" aria-live="polite">
        {announce && hover !== null
          ? `${formatDayLong(shownPoint.day)}: ${formatValue(active.unit, shownPoint.value)} ${active.label.toLowerCase()}`
          : ""}
      </div>

      <details className="chart-table">
        <summary>View as table</summary>
        <div className="chart-table__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Day</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="num">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Du plus récent au plus ancien : c'est ce qu'on cherche en premier. */}
              {points
                .map((p, i) => ({ p, i }))
                .reverse()
                .map(({ p, i }) => (
                  <tr key={p.day}>
                    <th scope="row">{formatDayLong(p.day)}</th>
                    {series.map((s) => (
                      <td key={s.key} className="num">
                        {formatValue(s.unit, s.points[i]?.value ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
