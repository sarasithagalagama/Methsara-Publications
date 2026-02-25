// ============================================
// Revenue Chart Component
// Line chart for visualizing revenue trnds
// ============================================

import React, { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const RevenueChart = ({ data, labels }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({
    labels: labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [],
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 12,
            weight: "600",
          },
          color: "#64748b",
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        titleFont: {
          family: "'Outfit', sans-serif",
          size: 14,
          weight: "700",
        },
        bodyFont: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 13,
        },
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: {
          color: "rgba(0, 0, 0, 0.04)",
          drawTicks: false,
        },
        ticks: {
          padding: 10,
          color: "#94a3b8",
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 11,
          },
          callback: (value) => `Rs. ${value.toLocaleString()}`,
        },
      },
      x: {
        border: { display: false },
        grid: {
          display: false,
        },
        ticks: {
          padding: 10,
          color: "#94a3b8",
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 11,
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
        backgroundColor: "#5D4037",
        borderWidth: 3,
        borderColor: "#fff",
      },
      line: {
        borderWidth: 3,
        borderColor: "#5D4037",
        fill: true,
        tension: 0.4,
      },
    },
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(93, 64, 55, 0.25)");
    gradient.addColorStop(1, "rgba(93, 64, 55, 0)");

    setChartData({
      labels: labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Revenue (Rs)",
          data: data || [],
          backgroundColor: gradient,
          borderColor: "#5D4037",
          fill: true,
        },
      ],
    });
  }, [data, labels]);

  return (
    <div style={{ height: "320px", width: "100%" }}>
      <Line ref={chartRef} options={options} data={chartData} />
    </div>
  );
};

export default RevenueChart;
