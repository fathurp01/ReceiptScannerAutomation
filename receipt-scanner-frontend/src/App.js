import React, { useState } from "react";
import UploadForm from "./components/UploadForm";
import ReceiptList from "./components/ReceiptList";
import AnalyticsChart from "./components/AnalyticsChart";
import ExportExcelButton from "./components/ExportExcelButton";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const reloadData = () => setRefreshKey((prev) => prev + 1);

  return (
    <div className="App">
      <h1 style={{ textAlign: "center", marginTop: "1rem" }}>
        🧾 Struk Scanner Dashboard
      </h1>
      <UploadForm onSuccess={reloadData} />
      <ExportExcelButton />
      <AnalyticsChart />
      <ReceiptList key={refreshKey} />
    </div>
  );
}

export default App;
