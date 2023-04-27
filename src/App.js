import axios from "axios";
import { useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);

  console.log(file);

  // Send uploaded csv file to server
  const handleFileUpload = () => {
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
      })
      .catch((err) => console.log(err));
  };

  return (
    <h1 className="flex flex-col gap-y-2 items-center justify-center h-screen">
      <p>Please select a csv file to upload</p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleFileUpload}
      >
        Upload
      </button>
    </h1>
  );
}
