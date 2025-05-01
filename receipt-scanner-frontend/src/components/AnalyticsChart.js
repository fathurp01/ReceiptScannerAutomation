import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

function AnalyticsChart() {
  const [dataPerMinggu, setDataPerMinggu] = useState([]);
  const [dataPerToko, setDataPerToko] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/receipts/")
      .then((res) => {
        const list = res.data;

        // 🚀 Total per minggu (by tanggal yang dikelompokkan kasar)
        const perMinggu = {};
        const perToko = {};

        list.forEach(r => {
          const date = new Date(r.tanggal.split(".").reverse().join("-"));
          const yearWeek = `${date.getFullYear()}-W${getWeek(date)}`;
          perMinggu[yearWeek] = (perMinggu[yearWeek] || 0) + r.total;

          const toko = r.toko.toUpperCase();
          perToko[toko] = (perToko[toko] || 0) + r.total;
        });

        const weeklyData = Object.entries(perMinggu).map(([week, total]) => ({ week, total }));
        const tokoData = Object.entries(perToko).map(([toko, total]) => ({ name: toko, value: total }));

        setDataPerMinggu(weeklyData);
        setDataPerToko(tokoData);
      });
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  return (
    <div style={{ padding: "2rem" }}>
      <h3>📈 Statistik Pengeluaran</h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem" }}>
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h4>Total per Minggu</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataPerMinggu}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: "300px" }}>
          <h4>Total per Toko</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dataPerToko} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {dataPerToko.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Fungsi bantu: dapatkan minggu ke-x dari tahun
function getWeek(date) {
  const onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

export default AnalyticsChart;
