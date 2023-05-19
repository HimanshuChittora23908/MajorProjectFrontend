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
import { CSVLink } from "react-csv";

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
  const [removeUploadButton, setRemoveUploadButton] = useState(false);
  const [uploaded, setUploaded] = useState(false); // if the file is uploaded
  const [closestGraph, setClosestGraph] = useState(null); // closest graph for each cluster
  const [farthestGraph, setFarthestGraph] = useState(null); // farthest graph for each cluster
  const [graphId, setGraphId] = useState(0); // current cluster graphId
  const [resolved, setResolved] = useState(true); // if the graph is resolved
  const [downloadData, setDownloadData] = useState([]); // data to be downloaded
  const [generated, setGenerated] = useState(false); // if the result file is generated
  const [questionsAnswered, setQuestionsAnswered] = useState(0); // number of questions answered
  const [numClusters, setNumClusters] = useState(8); // hardcoded for now, change once the backend is changed.

  const options = {
    scales: {
      y:  {
        beginAtZero: true,
        min: 0,
        max: 1400,
      }
    },
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  const headers = [
    { label: "Well ID", key: "wellId" },
    { label: "Label", key: "label" },
  ];

  const generateJSON = (data) => {

    let labels = data.labels
    let cluster_id = data.cluster_id

    let obj = []
    for(let i=0;i<cluster_id.length;i++){
      if(cluster_id[i] === -1)
        obj.push({obj: i, label: -1})
      else
        obj.push({obj: i, label: labels[cluster_id[i]]})
    }

    return obj
  }

  const csvReport = {
    data: downloadData,
    headers: headers,
    filename: 'Results.csv'
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

  const labels = expGraph && csvData[expGraph]?.split(",").map((_, i) => i);

  const data = {
    labels,
    datasets: resolved
      ? [
          {
            label: "Expected Graph",
            data: expGraph && csvData[expGraph]?.split(","),
            borderColor: "rgb(34,139,34)",
            backgroundColor: "rgba(34,139,34, 0.5)",
            pointRadius: 0,
            tension: 0.1,
          },
          {
            label: "Actual Graph (Cluster No.: " + graphId + ")",
            data: farthestGraph && csvData[farthestGraph]?.split(","),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            pointRadius: 0,
            tension: 0.1,
          },
        ]
      : [
          {
            label: "Expected Graph",
            data: expGraph && csvData[expGraph]?.split(","),
            borderColor: "rgb(34,139,34)",
            backgroundColor: "rgba(34,139,34, 0.5)",
            pointRadius: 0,
            tension: 0.1,
          },
          {
            label: "Actual Graph (Cluster No.: " + graphId + ")",
            data: closestGraph && csvData[closestGraph]?.split(","),
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
    setRemoveUploadButton(true);
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
        setUploaded(true);
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
    axios
      .post("http://127.0.0.1:5000/furtherCluster?cluster_no=" + graphId)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
    <div className="flex flex-col gap-y-2 py-8 mx-32 items-center justify-center min-h-screen">
      {!removeUploadButton && (
        <div className="flex items-center justify-center w-1/2">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-500 border-dashed rounded-lg cursor-pointer bg-gray-100 dark:hover:bg-bray-800 hover:bg-gray-200"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                aria-hidden="true"
                className="w-10 h-10 mb-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and
                drop
              </p>
              <p className="text-xs mb-2 text-gray-500">
                Only CSV files are allowed
              </p>
              {file && (
                <p className="text-sm font-semibold text-gray-700">
                  Uploaded: {file.name}
                </p>
              )}
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
        </div>
      )}
      {file && !uploaded && (
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-500 font-medium text-sm py-1 px-4 rounded"
          onClick={handleFileUpload}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      )}

      {/* Create a centered div displaying the no. of questions answered */}
      {uploaded && (
        <div className="flex flex-row gap-12 items-center justify-center gap-y-2">
        <div>
          <h1>No. of questions answered</h1>
          <p className={`text-center ${(farthestGraph === -1 || closestGraph === -1) && `text-xl font-bold`}`}>{questionsAnswered}</p>
        </div>
        <div>
          <h1>No. of clusters</h1>
          <p className={`text-center ${(farthestGraph === -1 || closestGraph === -1) && `text-xl font-bold`}`}>{numClusters}</p>
        </div>
        </div>
      )}
              


      <div className="flex w-full mt-8 gap-8 justify-center items-center px-40">
        {resolved && expGraph && farthestGraph && farthestGraph !== -1 && (
          <span className="w-full">
            <Line options={options} data={data} className="h-full" />
          </span>
        )}
        {!resolved && expGraph && closestGraph && closestGraph !== -1 && (
          <span className="w-full">
            <Line options={options} data={data} className="h-full" />
          </span>
        )}
      </div>

      {resolved && expGraph && farthestGraph && farthestGraph !== -1 && (
        <div
          className={`flex flex-col gap-y-2 my-8 items-center justify-center`}
        >
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
                    getFarthestGraph(graphId + 1);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
                  setQuestionsAnswered(questionsAnswered + 1);
              }}
            >
              Yes
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded"
              onClick={() => {
                setResolved(false); // set resolved as false because we will now show the closest graph of same cluster
                getClosestGraph();
                setQuestionsAnswered(questionsAnswered + 1);
              }}
            >
              No
            </button>
          </div>
        </div>
      )}
      {!resolved && expGraph && closestGraph && closestGraph !== -1 && (
        <div
          className={`flex flex-col gap-y-2 my-8 items-center justify-center`}
        >
          <p>Does the actual graph match the expected graph?</p>
          <div className="flex items-center justify-center gap-8">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded"
              onClick={() => {
                console.log("Subclustering");
                setQuestionsAnswered(questionsAnswered + 1);
                setNumClusters(numClusters + 1); // increment the number of clusters
                furtherCluster(graphId); // further cluster the cluster with graphId
                setResolved(true); // set resolved as true because we will now show the farthest graph of next cluster
                getFarthestGraph(graphId);
              }}
            >
              Yes
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded"
              onClick={() => {
                setResolved(true); // set resolved as true because we will now show the farthest graph of next cluster
                setQuestionsAnswered(questionsAnswered + 1);
                axios
                  .get("http://127.0.0.1:5000/labelFalse?graph_id=" + graphId)
                  .then((res) => {
                    console.log(res);
                    setGraphId(graphId + 1);
                    getFarthestGraph(graphId + 1);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }}
            >
              No
            </button>
          </div>
        </div>
      )}
      {!generated && (farthestGraph === -1 || closestGraph === -1) && (
        <div className="flex flex-col gap-y-2 my-8 items-center justify-center">
          <p>Results are ready!</p>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
            onClick={() => {
              axios.get("http://127.0.0.1:5000/getLabelGraphId").then((res) => {
                console.log(res);
                setDownloadData(generateJSON(res.data));
                setGenerated(true);
              });
            }}
          >
            Generate File
          </button>
        </div>
      )}
      {generated && (
        <div className="flex flex-col gap-y-2 mb-8 items-center justify-center rounded-md px-4 py-2 bg-green-500 hover:bg-green-700 text-white font-semibold">
        <CSVLink {...csvReport}>Export to CSV</CSVLink>
      </div>
      )}

      {/* Reset Button */}
      {uploaded && (
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-500 font-medium text-sm py-1 px-4 rounded -mt-4"
          onClick={() => {
            setFile(null);
            setUploaded(false);
            setRemoveUploadButton(false);
            setGraphId(0);
            setExpGraph(null);
            setClosestGraph(null);
            setFarthestGraph(null);
            setResolved(true);
            setGenerated(false);
            setQuestionsAnswered(0);
            setNumClusters(8); // hard coded for now, change once the backend has changed.
          }}
        >
          Wanna try again? Click here to reset
        </button>
      )}
    </div>
  );
}
