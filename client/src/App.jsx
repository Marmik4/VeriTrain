import { useState } from "react";
import { ethers } from "ethers";
import IPRegistryABI from "./IPRegistry.json";

// --- SECURITY LOGIC (SHA-256 Hashing) ---
async function calculateHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}

const CONTRACT_ADDRESS = "0x298B0831b7a81fbA33a4BD45Fdbddb9c3db69b4C";

function App() {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("");   // <-- FIXED
  const [account, setAccount] = useState("");

  // 1. Connect Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);               // FIXED
        setStatus("Wallet Connected!");
      } catch (error) {
        setStatus("Error connecting wallet: " + error.message);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // 2. File Upload → Hash
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0]; // <-- FIXED
    if (selectedFile) {
      setFile(selectedFile);
      setStatus("Calculating Hash...");
      try {
        const fileHash = await calculateHash(selectedFile);
        setHash(fileHash);
        setStatus("Ready to Register.");
      } catch (error) {
        setStatus("Error calculating hash.");
        console.error(error);
      }
    }
  };

  // 3. Blockchain Interaction
  const registerAsset = async () => {
    if (!hash) return alert("Please upload a file first.");
    if (!window.ethereum) return alert("No Wallet Found.");

    try {
      setStatus("Interacting with Blockchain...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        IPRegistryABI.abi,
        signer
      );

      const tx = await contract.registerIP(hash, "ipfs://demo-metadata-link");

      setStatus("Transaction Sent! Waiting for confirmation...");

      await tx.wait();

      setStatus(`Success! Asset Registered.\nTx Hash: ${tx.hash}`);
    } catch (error) {
      console.error(error);

      const fallbackMessage =
        error.reason ||
        error.message ||
        "Unknown blockchain error";

      setStatus("Failed: " + fallbackMessage);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1>VeriTrain IP Registry</h1>
      <p>Upload your work to secure it on the blockchain.</p>

      {/* Wallet Section */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <button onClick={connectWallet} style={buttonStyle}>
          {account ? `Connected: ${account.substring(0, 6)}...` : "Connect Wallet"}
        </button>
      </div>

      {/* File Upload Section */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h3>1. Select File</h3>
        <input type="file" onChange={handleFileChange} />

        {hash && (
          <div
            style={{
              marginTop: "15px",
              background: "#f4f4f4",
              padding: "10px",
              wordBreak: "break-all",
            }}
          >
            <strong>Digital Fingerprint (SHA-256):</strong>
            <p style={{ color: "blue", fontFamily: "monospace" }}>{hash}</p>
          </div>
        )}
      </div>

      <button
        onClick={registerAsset}
        disabled={!hash || !account}
        style={{
          ...buttonStyle,
          backgroundColor: hash ? "#4CAF50" : "#ccc",
        }}
      >
        Register on Blockchain
      </button>

      {status && (
        <p
          style={{
            marginTop: "20px",
            whiteSpace: "pre-wrap",
            fontWeight: "bold",
          }}
        >
          Status: {status}
        </p>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  backgroundColor: "#007BFF",
  color: "white",
  border: "none",
  borderRadius: "5px",
};

export default App;
