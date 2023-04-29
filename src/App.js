import axios from "axios";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function App() {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [expGraph, setExpGraph] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [farthestGraph, setFarthestGraph] = useState(null);
  const [graphId, setGraphId] = useState(1);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  const actualGraphOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Expected Graph",
      },
    },
  };

  // Read the csv file
  const fileReader = new FileReader();

  useEffect(() => {
    if (file) {
      fileReader.readAsText(file);
      fileReader.onload = (e) => {
        const csv = e.target.result;
        const data = csv.split("\n");
        setCsvData(data);
      };

      fileReader.onerror = (e) => {
        console.log(e);
      };
    }
  }, [file]);

  const labels = expGraph && csvData[expGraph].split(",").map((_, i) => i);

  const data = {
    labels,
    datasets: [
      {
        label: "Expected Graph",
        data: expGraph && csvData[expGraph].split(","),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: "Actual Graph (Cluster No.: " + graphId + ")",
        data: farthestGraph && csvData[farthestGraph].split(","),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgb(53, 162, 235, 0.5)",
        pointRadius: 0,
        tension: 0.1,
      },
    ],
  };

  const actualGraphData = {
    labels,
    datasets: [
      {
        label: "Dataset 1",
        data: farthestGraph && csvData[farthestGraph].split(","),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        pointRadius: 0,
        tension: 0.1,
      },
    ],
  };

  // Send uploaded csv file to server
  const handleFileUpload = () => {
    setUploading(true);
    setExpGraph(null);
    const formData = new FormData();
    formData.append("file", file);
    axios
      .post("http://127.0.0.1:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        console.log(res);
        setExpGraph(res.data.expected_graph);
        setUploading(false);
        getFarthestGraph();
      })
      .catch((err) => {
        console.log(err);
        setUploading(false);
      });
  };

  const getFarthestGraph = () => {
    axios
      .get("http://127.0.0.1:5000/getFarthestGraph?graph_id=" + graphId)
      .then((res) => {
        console.log(res);
        setFarthestGraph(res.data.farthest_graph);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="flex flex-col gap-y-2 items-center justify-center min-h-screen">
      <p>Please select a csv file to upload</p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-medium text-sm py-1 px-4 rounded"
        onClick={handleFileUpload}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <div className="flex w-full gap-8 justify-center items-center px-40">
        {expGraph && farthestGraph && (
          <span className="w-full">
            <Line options={options} data={data} className="h-full" />
          </span>
        )}
        {/* {farthestGraph && (
          <span className="w-full">
            <Line options={actualGraphOptions} data={actualGraphData} />
          </span>
        )} */}
      </div>
    </div>
  );
}
