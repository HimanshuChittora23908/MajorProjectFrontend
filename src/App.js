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
  const [expGraph, setExpGraph] = useState(null); // expected graph
  const [uploading, setUploading] = useState(false);
  const [closestGraph, setClosestGraph] = useState(null); // closest graph for each cluster
  const [farthestGraph, setFarthestGraph] = useState(null); // farthest graph for each cluster
  const [graphId, setGraphId] = useState(0); // current cluster graphId
  const [resolved, setResolved] = useState(true); // if the graph is resolved

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
    datasets: resolved ? [
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
    ] : [
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
        data: closestGraph && csvData[closestGraph].split(","),
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
        getFarthestGraph(0);
      })
      .catch((err) => {
        console.log(err);
        setUploading(false);
      });
  };

  const furtherCluster = (graphId) => {
    axios.post("http://127.0.0.1:5000/furtherCluster?cluster_no=" + graphId)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const getFarthestGraph = (num) => {
    axios
      .get("http://127.0.0.1:5000/getFarthestGraph?graph_id=" + num)
      .then((res) => {
        console.log(res);
        setFarthestGraph(res.data.farthest_graph);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getClosestGraph = () => {
    axios
      .get("http://127.0.0.1:5000/getClosestGraph?graph_id=" + graphId)
      .then((res) => {
        console.log(res);
        setClosestGraph(res.data.closest_graph);
      })
      .catch((err) => {
        console.log(err);
      });
  };


  return (
    <div className="flex flex-col gap-y-2 py-16 items-center justify-center min-h-screen">
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
      <div className="flex w-full mt-8 gap-8 justify-center items-center px-40">
        {resolved && expGraph && farthestGraph && (
          <span className="w-full">
            <Line options={options} data={data} className="h-full" />
          </span>
        )}
        {!resolved && expGraph && closestGraph && (
          <span className="w-full">
            <Line options={options} data={data} className="h-full" />
          </span>
        )}

      </div>
      
      {resolved && expGraph && farthestGraph && (
        <div className={`flex flex-col gap-y-2 my-8 items-center justify-center`}>
          <p>Does the actual graph match the expected graph?</p>
          <div className="flex items-center justify-center gap-8">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded"
              onClick={() => {
                axios
                  .get("http://127.0.0.1:5000/labelTrue?graph_id=" + graphId)
                  .then((res) => {
                    console.log(res);
                    setGraphId(graphId + 1);
                    getFarthestGraph(graphId+1);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }}
            >
              Yes
            </button>
            <button className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded"
              onClick={() => {
                setResolved(false); // set resolved as false because we will now show the closest graph of same cluster
                getClosestGraph();
              }}>
              No
            </button>
          </div>
        </div>
      )}
      {!resolved && expGraph && closestGraph && (
        <div className={`flex flex-col gap-y-2 my-8 items-center justify-center`}>
        <p>Does the actual graph match the expected graph?</p>
        <div className="flex items-center justify-center gap-8">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded"
            onClick={() => {
              console.log('Subclustering')
              furtherCluster(graphId) // further cluster the cluster with graphId
              setResolved(true); // set resolved as true because we will now show the farthest graph of next cluster
              setGraphId(graphId + 1);
              getFarthestGraph(graphId+1);
            }}
          >
            Yes
          </button>
          <button className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded"
            onClick={() => {
              setResolved(true); // set resolved as true because we will now show the farthest graph of next cluster
              axios
                .get("http://127.0.0.1:5000/labelFalse?graph_id=" + graphId)
                .then((res) => {
                  console.log(res);
                  setGraphId(graphId + 1);
                  getFarthestGraph(graphId+1);
                })
                .catch((err) => {
                  console.log(err);
                });
            }}>
            No
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
