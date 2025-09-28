import React, { useEffect, useMemo, useRef } from 'react';
import type { ProjectComputation } from '@/core/calc';
import type { ChartConfiguration } from '@/types/chartjsTypes';
import type { ChartConstructor, ChartInstance } from '@/types/chartjs';
import {
  SENSITIVITY_STEPS,
  SENSITIVITY_VARIABLES,
  SensitivityKey,
  SensitivityRow,
  SensitivityState,
} from './sensitivityUtils';

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

interface TooltipContext {
  dataset?: { label?: string };
  parsed?: { x?: number };
}

interface SensitivityAnalysisProps {
  base: ProjectComputation;
  adjusted: ProjectComputation;
  adjustments: SensitivityState;
  rows: SensitivityRow[];
  onChange: (state: SensitivityState) => void;
  onReset: () => void;
}

export const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({
  base,
  adjusted,
  adjustments,
  rows,
  onChange,
  onReset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartInstance | null>(null);

  const chartConfig = useMemo<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Δ PV HT',
          data: rows.map((row) => Number(row.deltaPvHt.toFixed(2))),
          backgroundColor: rows.map((row) => (row.deltaPvHt >= 0 ? '#1d4ed8' : '#f97316')),
        },
        {
          label: 'Δ Marge €',
          data: rows.map((row) => Number(row.deltaMarge.toFixed(2))),
          backgroundColor: rows.map((row) => (row.deltaMarge >= 0 ? '#0f766e' : '#dc2626')),
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipContext) => {
              const datasetLabel = typeof context.dataset?.label === 'string' ? context.dataset.label : '';
              const value = typeof context.parsed?.x === 'number' ? context.parsed.x : 0;
              return `${datasetLabel}: ${euroFormatter.format(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            callback: (value: string | number) => euroFormatter.format(Number(value)),
          },
          grid: {
            drawBorder: false,
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    },
  }), [rows]);

  useEffect(() => {
    const ChartGlobal = (window as Window & { Chart?: ChartConstructor }).Chart;
    const canvas = canvasRef.current;
    if (!ChartGlobal || !canvas) {
      return;
    }
    chartInstance.current?.destroy();
    chartInstance.current = new ChartGlobal(canvas, chartConfig);
    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [chartConfig]);

  const handleSliderChange = (key: SensitivityKey, value: number) => {
    onChange({
      ...adjustments,
      [key]: value,
    });
  };

  const deltaPv = adjusted.totaux.pvHt - base.totaux.pvHt;
  const deltaMargin = adjusted.totaux.margeApresRemise - base.totaux.margeApresRemise;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Analyse de sensibilité</h2>
        <p className="text-sm text-gray-600">
          Ajustez les hypothèses clés ±5/10/15%. Le graphique Tornado indique l’impact marginal par variable.
        </p>
      </header>

      <div className="grid gap-4">
        {SENSITIVITY_VARIABLES.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
              <span>{label}</span>
              <span>{numberFormatter.format(adjustments[key])}%</span>
            </div>
            <div className="flex items-center gap-2">
              {SENSITIVITY_STEPS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSliderChange(key, option)}
                  className={`rounded border px-3 py-1 text-xs font-semibold focus:outline-none focus:ring focus:ring-blue-300 ${
                    adjustments[key] === option
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  +{option}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleSliderChange(key, 0)}
                className={`rounded border px-3 py-1 text-xs font-semibold focus:outline-none focus:ring focus:ring-blue-300 ${
                  adjustments[key] === 0
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                0%
              </button>
              {SENSITIVITY_STEPS.map((option) => (
                <button
                  key={`neg-${option}`}
                  type="button"
                  onClick={() => handleSliderChange(key, -option)}
                  className={`rounded border px-3 py-1 text-xs font-semibold focus:outline-none focus:ring focus:ring-blue-300 ${
                    adjustments[key] === -option
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  -{option}%
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm">
        <div className="flex justify-between">
          <span>Δ Prix de vente HT</span>
          <span className="font-semibold">{euroFormatter.format(deltaPv)}</span>
        </div>
        <div className="flex justify-between">
          <span>Δ Marge €</span>
          <span className="font-semibold">{euroFormatter.format(deltaMargin)}</span>
        </div>
      </div>

      <div className="h-72">
        {rows.every((row) => row.deltaPvHt === 0 && row.deltaMarge === 0) ? (
          <p className="text-sm text-gray-500">Aucun impact calculé : ajustez un curseur pour afficher le graphique.</p>
        ) : (
          <canvas ref={canvasRef} aria-label="Graphique Tornado" role="img" />
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-blue-300"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
};
