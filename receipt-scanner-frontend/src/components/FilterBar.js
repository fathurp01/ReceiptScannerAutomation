import React from "react";

function FilterBar({ filters, setFilters }) {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
      <input
        type="text"
        name="toko"
        placeholder="Filter toko (misal: Indomaret)"
        value={filters.toko}
        onChange={handleChange}
      />
      <input
        type="date"
        name="tanggal"
        value={filters.tanggal}
        onChange={handleChange}
      />
      <button onClick={() => setFilters({ toko: "", tanggal: "" })}>
        Reset
      </button>
    </div>
  );
}

export default FilterBar;
