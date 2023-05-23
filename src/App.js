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
  const [actualGraph, setActualGraph] = useState(null); // actual graph
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false); // loading for the graph
  const [removeUploadButton, setRemoveUploadButton] = useState(false);
  const [uploaded, setUploaded] = useState(false); // if the file is uploaded
  const [closestGraph, setClosestGraph] = useState(null); // closest graph for each cluster
  const [farthestGraph, setFarthestGraph] = useState(null); // farthest graph for each cluster
  const [graphId, setGraphId] = useState(0); // current cluster graphId
  const [resolved, setResolved] = useState(true); // if the graph is resolved
  const [downloadData, setDownloadData] = useState([]); // data to be downloaded
  const [generated, setGenerated] = useState(false); // if the result file is generated
  const [questionsAnswered, setQuestionsAnswered] = useState(0); // number of questions answered
  const [numClusters, setNumClusters] = useState(3); // hardcoded for now, change once the backend is changed.
  const [peaks, setPeaks] = useState([]); // peaks
  const [peakHeights, setPeakHeights] = useState([]); // peak heights
  const [valleys, setValleys] = useState([]); // valleys
  const [valleyHeights, setValleyHeights] = useState([]); // valley heights
  const [peakReference, setPeakReference] = useState([]); // peak reference
  const [peakReferenceHeights, setPeakReferenceHeights] = useState([]); // peak reference heights
  const [valleyReference, setValleyReference] = useState([]); // valley reference
  const [valleyReferenceHeights, setValleyReferenceHeights] = useState([]); // valley reference heights
  const [euclideanDistance, setEuclideanDistance] = useState(0); // euclidean distance

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 1400,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  const headers = [
    { label: "Well ID", key: "obj" },
    { label: "Label", key: "label" },
  ];

  const generateJSON = (data) => {
    let labels = data.labels;
    let cluster_id = data.cluster_id;

    let obj = [];
    for (let i = 0; i < cluster_id.length; i++) {
      if (cluster_id[i] === -1) obj.push({ obj: i, label: -1 });
      else obj.push({ obj: i, label: labels[cluster_id[i]] });
    }

    return obj;
  };

  const csvReport = {
    data: downloadData,
    headers: headers,
    filename: "Results.csv",
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
            label: `Expected Graph: ${expGraph}`,
            data: expGraph && csvData[expGraph]?.split(","),
            borderColor: "rgb(34,139,34)",
            backgroundColor: "rgba(34,139,34, 0.5)",
            pointRadius: 0,
            tension: 0.1,
          },
          {
            label: `Actual Graph: ${actualGraph} (Cluster No.: " + graphId + ")`,
            data: farthestGraph && csvData[farthestGraph]?.split(","),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            pointRadius: 0,
            tension: 0.1,
          },
        ]
      : [
          {
            label: `Expected Graph ${expGraph}`,
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
        setUploaded(true);
        setExpGraph(res.data.expected_graph);
        setPeakReference(res.data.peaks);
        setPeakReferenceHeights(res.data.peak_heights);
        setValleyReference(res.data.valleys);
        setValleyReferenceHeights(res.data.valley_heights);
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
      .then((res) => {})
      .catch((err) => {
        console.log(err);
      });
  };

  const getFarthestGraph = (num) => {
    axios
      .get("http://127.0.0.1:5000/getFarthestGraph?graph_id=" + num)
      .then((res) => {
        setFarthestGraph(res.data.farthest_graph);
        setActualGraph(res.data.farthest_graph);
        setPeaks(res.data.peaks);
        setPeakHeights(res.data.peak_heights);
        setValleys(res.data.valleys);
        setValleyHeights(res.data.valley_heights);
        setEuclideanDistance(res.data.euclidean_dist);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getClosestGraph = () => {
    axios
      .get("http://127.0.0.1:5000/getClosestGraph?graph_id=" + graphId)
      .then((res) => {
        setClosestGraph(res.data.closest_graph);
        setActualGraph(res.data.closest_graph);
        setPeaks(res.data.peaks);
        setPeakHeights(res.data.peak_heights);
        setValleys(res.data.valleys);
        setValleyHeights(res.data.valley_heights);
        setEuclideanDistance(res.data.euclidean_dist);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div>
      {!loading ? (
        <div className="flex flex-col gap-y-2 py-8 mx-8 items-center justify-center min-h-screen">
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
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
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

          <div className="grid grid-cols-12 gap-16 w-full mt-8 justify-center items-center px-4">
            <div className="col-span-8">
              {uploaded && (
                <div className="flex flex-row gap-12 items-center justify-center gap-y-2 pb-8 pt-2 bg-red-100 rounded-t-lg">
                  <div>
                    <h1 className="text-center font-bold">File Name</h1>
                    <p className="text-center">{file.name}</p>
                  </div>
                  <div>
                    <h1 className="text-center font-bold">
                      K used in clustering
                    </h1>
                    <p className="text-center">{numClusters}</p>
                  </div>
                </div>
              )}

              {uploaded && (
                <div className="flex flex-row gap-12 items-center justify-center gap-y-2 pb-2 mb-8 bg-red-100 rounded-b-lg">
                  <div>
                    <h1 className="text-center font-bold">
                      No. of questions answered
                    </h1>
                    <p
                      className={`text-center ${
                        (farthestGraph === -1 || closestGraph === -1) &&
                        `text-xl font-bold`
                      }`}
                    >
                      {questionsAnswered}
                    </p>
                  </div>
                  <div>
                    <h1 className="text-center font-bold">No. of clusters</h1>
                    <p
                      className={`text-center ${
                        (farthestGraph === -1 || closestGraph === -1) &&
                        `text-xl font-bold`
                      }`}
                    >
                      {numClusters}
                    </p>
                  </div>
                </div>
              )}

              {resolved &&
                expGraph &&
                farthestGraph &&
                farthestGraph !== -1 && (
                  <span className="w-full">
                    <Line options={options} data={data} className="h-full" />
                  </span>
                )}
              {!resolved && expGraph && closestGraph && closestGraph !== -1 && (
                <span className="w-full">
                  <Line options={options} data={data} className="h-full" />
                </span>
              )}

              {resolved &&
                expGraph &&
                farthestGraph &&
                farthestGraph !== -1 && (
                  <div
                    className={`flex flex-col gap-y-2 my-8 items-center justify-center`}
                  >
                    <p>Does the actual graph match the expected graph?</p>
                    <div className="flex items-center justify-center gap-8">
                      <button
                        className="bg-green-500 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded"
                        onClick={() => {
                          axios
                            .get(
                              "http://127.0.0.1:5000/labelTrue?graph_id=" +
                                graphId
                            )
                            .then((res) => {
                              setGraphId(graphId + 1);
                              setLoading(true);
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
                          setLoading(true);
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
                        setLoading(true);
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
                          .get(
                            "http://127.0.0.1:5000/labelFalse?graph_id=" +
                              graphId
                          )
                          .then((res) => {
                            console.log(res);
                            setLoading(true);
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

              {/* center the csv button below */}
              {uploaded && (
                <div className="flex flex-col gap-y-2 items-center justify-center">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded"
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
                      setNumClusters(3); // hard coded for now, change once the backend has changed.
                      setGenerated(false);
                      setDownloadData([]);
                    }}
                  >
                    Wanna try again? Click here to reset
                  </button>
                </div>
              )}
            </div>

            <div className="col-span-4">
              <div
                className={`flex flex-col gap-y-2 items-center justify-center bg-blue-100 rounded-xl ${
                  uploaded && `p-2`
                }`}
              >
                {uploaded && (
                  <>
                    <h1 className="text-center font-bold text-green-600">
                      Expected Graph
                    </h1>

                    <div className="grid grid-cols-2 justify-center text-center ">
                      <div className="col-span-1 flex flex-col gap-x-2 overflow-auto h-72 mb-8">
                        <h1 className="text-center font-bold">Peaks</h1>
                        <table className="table-auto">
                          <thead>
                            <tr>
                              <th className="px-4 py-2">Index</th>
                              <th className="px-4 py-2">Height</th>
                            </tr>
                          </thead>
                          <tbody>
                            {peakReference?.map((peak, index) => (
                              <tr key={index}>
                                <td className="border px-4 py-2">{peak}</td>
                                <td className="border px-4 py-2">
                                  {peakReferenceHeights[index].toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="col-span-1 flex flex-col gap-x-2 overflow-auto h-72">
                        <h1 className="text-center font-bold">Valleys</h1>
                        <table className="table-auto">
                          <thead>
                            <tr>
                              <th className="px-4 py-2">Index</th>
                              <th className="px-4 py-2">Depth</th>
                            </tr>
                          </thead>
                          <tbody>
                            {valleyReference?.map((valley, index) => (
                              <tr key={index}>
                                <td className="border px-4 py-2">{valley}</td>
                                <td className="border px-4 py-2">
                                  {valleyReferenceHeights[index].toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {uploaded && (
                  <>
                    <h1 className="text-center font-bold text-red-500">
                      Actual Graph
                    </h1>

                    <div className="grid grid-cols-2 justify-center text-center ">
                      <div className="col-span-1 flex flex-col gap-x-2 overflow-auto h-72 mb-8">
                        <h1 className="text-center font-bold">Peaks</h1>
                        <table className="table-auto">
                          <thead>
                            <tr>
                              <th className="px-4 py-2">Index</th>
                              <th className="px-4 py-2">Height</th>
                            </tr>
                          </thead>
                          <tbody>
                            {peaks?.map((peak, index) => (
                              <tr key={index}>
                                <td className="border px-4 py-2">{peak}</td>
                                <td className="border px-4 py-2">
                                  {peakHeights[index].toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="col-span-1 flex flex-col gap-x-2 overflow-auto h-72">
                        <h1 className="text-center font-bold">Valleys</h1>
                        <table className="table-auto">
                          <thead>
                            <tr>
                              <th className="px-4 py-2">Index</th>
                              <th className="px-4 py-2">Depth</th>
                            </tr>
                          </thead>
                          <tbody>
                            {valleys?.map((valley, index) => (
                              <tr key={index}>
                                <td className="border px-4 py-2">{valley}</td>
                                <td className="border px-4 py-2">
                                  {valleyHeights[index].toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Show the euclideanDistance between the two graphs stored in state */}
                {uploaded && (
                  <div className="flex flex-col gap-y-2 items-center justify-center">
                    <h1 className="font-bold">Euclidean Distance</h1>
                    <p className="text-center font-semibold">
                      {euclideanDistance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!generated && (farthestGraph === -1 || closestGraph === -1) && (
            <div className="flex flex-col gap-y-2 my-8 items-center justify-center">
              <p>Results are ready!</p>
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
                onClick={async () => {
                  await axios
                    .get("http://127.0.0.1:5000/getLabelGraphId")
                    .then((res) => {
                      setDownloadData(generateJSON(res.data));
                    });
                }}
              >
                {downloadData.length > 0 ? (
                  <CSVLink {...csvReport} onClick={() => setGenerated(true)}>
                    Download Results
                  </CSVLink>
                ) : (
                  "Generate Results"
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          role="status"
          className="min-h-screen w-full flex items-center justify-center"
        >
          <svg
            aria-hidden="true"
            class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
      )}
    </div>
  );
}
