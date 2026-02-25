// ============================================
// Stock Distribution Chart Component
// Doughnut chart for inventory visualization
// ============================================

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const StockChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            family: "'Inter', sans-serif",
          },
        },
      },
      title: {
        display: true,
        text: "Stock Distribution",
        font: {
          size: 16,
          family: "'Inter', sans-serif",
          weight: "600",
        },
        padding: { bottom: 20 },
      },
    },
    cutout: "75%",
  };

  const chartData = {
    labels: data && data.length > 0 ? data.map((d) => d._id) : ["No Data"],
    datasets: [
      {
        label: "Stock Units",
        data: data && data.length > 0 ? data.map((d) => d.totalQuantity) : [0],
        backgroundColor:
          data && data.length > 0
            ? [
                "#8D6E63", // Primary Brown
                "#5D4037", // Dark Brown
                "#D7CCC8", // Light Brown
                "#A1887F", // Medium Brown
                "#795548", // Standard Brown
                "#BDBDBD", // Grey
                "#E0E0E0", // Light Grey
                "#4E342E", // Very Dark Brown
                "#A1887F", // Repeat Medium
              ]
            : ["#f3f4f6"], // Light grey for "No Data"
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  return (
    <div style={{ height: "320px", width: "100%", position: "relative" }}>
      <Doughnut options={options} data={chartData} />
    </div>
  );
};

export default StockChart;
