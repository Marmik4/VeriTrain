import { useState } from "react";
import { ethers } from "ethers";

// Styles
const styles = {
  container: { 
    fontFamily: "'Inter', sans-serif", 
    position: "fixed", 
    top: 0,
    left: 0,
    width: "100vw",   
    height: "100vh",   
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)", 
    color: "#1f2937",
    margin: 0,
    padding: 0,
    overflow: "auto" 
  },
  card: { background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", width: "100%", maxWidth: "600px" },
  header: { textAlign: "center", marginBottom: "35px" },
  title: { margin: "0", background: "-webkit-linear-gradient(45deg, #4338ca, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "2.2rem", fontWeight: "800" },
  subtitle: { color: "#6b7280", margin: "10px 0 0 0", fontSize: "1rem" },
  section: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", marginBottom: "20px", transition: "transform 0.2s" },
  label: { display: "flex", alignItems: "center", gap: "10px", fontSize: "0.95rem", fontWeight: "700", marginBottom: "15px", color: "#1f2937" },
  badge: { background: "#4338ca", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" },
  button: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "0.95rem", transition: "all 0.2s", color: "white" },
  input: { width: "100%", padding: "12px", border: "2px dashed #cbd5e1", borderRadius: "8px", background: "white", boxSizing: "border-box", cursor: "pointer" },
  hash: { background: "#1e293b", color: "#10b981", padding: "15px", borderRadius: "8px", fontFamily: "'Fira Code', monospace", fontSize: "0.85rem", wordBreak: "break-all", marginTop: "15px", borderLeft: "4px solid #10b981" },
  status: { marginTop: "30px", padding: "15px", background: "#1e293b", color: "#e2e8f0", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.85rem", minHeight: "40px", display: "flex", alignItems: "center" }
};

// ABI matching same as struct in solidity
const IPRegistryABI = [
  { "inputs": [{"internalType": "string","name": "_hash","type": "string"},{"internalType": "string","name": "_metadata","type": "string"}], "name": "registerIP", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { 
    "inputs": [{"internalType": "string","name": "","type": "string"}], 
    "name": "assets", 
    "outputs": [
      {"internalType": "string","name": "ipHash","type": "string"},
      {"internalType": "address","name": "owner","type": "address"},
      {"internalType": "uint256","name": "timestamp","type": "uint256"},
      {"internalType": "string","name": "metadataURI","type": "string"}
    ], 
    "stateMutability": "view", 
    "type": "function" 
  }
];

// Address found after running solidity code
const CONTRACT_ADDRESS = "0x298B0831b7a81fbA33a4BD45Fdbddb9c3db69b4C"; 



async function calculateHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function App() {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum && !ethers.BrowserProvider) return alert("Please install MetaMask!");
    try {
      if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
      } else { setAccount("0xLocalUser"); }
      setStatus("Wallet Connected Successfully.");
    } catch (err) { setStatus("Connection Error: " + err.message); }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setVerificationData(null);
    setIsLoading(true);
    setStatus("Calculating SHA-256 Digital Fingerprint...");
    try {
      const h = await calculateHash(f);
      setHash(h);
      setStatus("Hash Calculated.");
    } catch (err) { setStatus("Hashing Error"); } 
    finally { setIsLoading(false); }
  };

  const registerAsset = async () => {
    if (!hash || !account) return alert("Please Connect Wallet & Upload File first.");
    try {
      setStatus("Initiating Transaction...");
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, IPRegistryABI, signer);
      const tx = await contract.registerIP(hash, "ipfs://placeholder");
      setStatus("Transaction Broadcasted! Waiting for Block Confirmation...");
      await tx.wait();
      setStatus(`Success! Asset Registered.\nTx Hash: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      setStatus("Registration Failed: " + (err.reason || err.message));
    } finally { setIsLoading(false); }
  };

  const verifyAsset = async () => {
    if (!hash) return alert("Upload a file to verify.");
    try {
      setStatus("Querying Blockchain Ledger...");
      setIsLoading(true);
      setVerificationData(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, IPRegistryABI, provider);

      // Call the mapping
      const result = await contract.assets(hash);
      
      const owner = result[1];     
      const timestamp = result[2]; 

      if (Number(timestamp) > 0) {
        const date = new Date(Number(timestamp) * 1000).toLocaleString();
        setVerificationData({ exists: true, owner, date });
        setStatus("Verification Complete: Valid Asset Found.");
      } else {
        setVerificationData({ exists: false });
        setStatus("Verification Complete: No Record Found.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Read Error: " + (err.reason || err.message));
    } finally { setIsLoading(false); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>VeriTrain</h1>
          <p style={styles.subtitle}>Enterprise IP Registry & Verification System</p>
        </div>

        <div style={styles.section}>
          <div style={styles.label}><span style={styles.badge}>1</span> IDENTITY VERIFICATION</div>
          <button onClick={connectWallet} style={{...styles.button, background: account ? "#10b981" : "#4338ca"}}>
            {account ? `Connected: ${account.substring(0,6)}...` : "Connect MetaMask Wallet"}
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.label}><span style={styles.badge}>2</span> DOCUMENT PROCESSOR</div>
          <input type="file" onChange={handleFileChange} style={styles.input} />
          {hash && <div style={styles.hash}>{hash}</div>}
        </div>

        <div style={styles.section}>
          <div style={styles.label}><span style={styles.badge}>3</span> BLOCKCHAIN OPERATIONS</div>
          <div style={{display: "flex", gap: "15px"}}>
            <button onClick={registerAsset} disabled={!hash || !account || isLoading} style={{...styles.button, background: "#4f46e5", opacity: (!hash || !account) ? 0.5 : 1}}>REGISTER (Write)</button>
            <button onClick={verifyAsset} disabled={!hash || isLoading} style={{...styles.button, background: "#0ea5e9", opacity: !hash ? 0.5 : 1}}>VERIFY (Read)</button>
          </div>
        </div>

        {verificationData && (
          <div style={{marginTop: "20px", padding: "20px", borderRadius: "12px", textAlign: "center", border: "1px solid", background: verificationData.exists ? "#f0fdf4" : "#fef2f2", borderColor: verificationData.exists ? "#86efac" : "#fca5a5"}}>
            {verificationData.exists ? (
              <>
                <h3 style={{margin: "0 0 10px 0", color: "#166534"}}>✅ AUTHENTIC ASSET</h3>
                <div style={{fontSize: "0.9rem", textAlign: "left", color: "#166534"}}>
                  <p><strong>Owner:</strong> {verificationData.owner}</p>
                  <p><strong>Timestamp:</strong> {verificationData.date}</p>
                </div>
              </>
            ) : <h3 style={{margin: 0, color: "#991b1b"}}>❌ NOT REGISTERED</h3>}
          </div>
        )}

        <div style={styles.status}>&gt; {status || "System Ready..."}</div>
      </div>
    </div>
  );
}

export default App;