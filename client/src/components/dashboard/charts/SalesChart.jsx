import React, { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const SalesChart = ({ data, labels }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({
    labels: labels || ["No Data"],
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
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    // Gold to semi-transparent gold gradient
    gradient.addColorStop(0, "#5D4037");
    gradient.addColorStop(1, "rgba(93, 64, 55, 0.6)");

    setChartData({
      labels: labels || ["No Data"],
      datasets: [
        {
          label: "Sales Count",
          data: data || [],
          backgroundColor: gradient,
          hoverBackgroundColor: "#B8860B", // Darker gold on hover
          borderRadius: 8,
          barThickness: 28,
          maxBarThickness: 35,
        },
      ],
    });
  }, [data, labels]);

  return (
    <div style={{ height: "320px", width: "100%" }}>
      <Bar ref={chartRef} options={options} data={chartData} />
    </div>
  );
};

export default SalesChart;
