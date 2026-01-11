import React from "react";
import { createRoot } from "react-dom/client";
import { CredentialsPage } from "./CredentialsPage";
import { CredentialData } from "./CredentialCard";

// Sample data for development
const sampleCredentials: Omit<CredentialData, "qrCodeDataUrl" | "templateImagePath">[] = [
  { name: "John", lastname: "Doe", idNumber: "1", role: "B" },
  { name: "Jane", lastname: "Smith", idNumber: "67890", role: "D" },
  { name: "Bob", lastname: "Johnson", idNumber: "11111", role: "X" },
];

// Generate QR codes and load templates
async function loadCredentialData(): Promise<CredentialData[]> {
  const QRCode = (await import("qrcode")).default;

  const credentials: CredentialData[] = await Promise.all(
    sampleCredentials.map(async (cred) => {
      // Generate QR code
      const qrData = JSON.stringify({ id: cred.idNumber });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Load template image (Vite serves files from publicDir at root)
      const templatePath = `/${cred.role.toUpperCase()}.png`;

      return {
        ...cred,
        qrCodeDataUrl,
        templateImagePath: templatePath,
      };
    })
  );

  return credentials;
}

// Main component
function App() {
  const [credentials, setCredentials] = React.useState<CredentialData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [credentialsPerRow, setCredentialsPerRow] = React.useState(2);

  React.useEffect(() => {
    loadCredentialData().then((data) => {
      setCredentials(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading credentials...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Credential Preview</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span>Credentials per row:</span>
              <input
                type="number"
                min="1"
                max="4"
                value={credentialsPerRow}
                onChange={(e) => setCredentialsPerRow(parseInt(e.target.value, 10) || 2)}
                className="border border-gray-300 rounded px-3 py-1 w-20"
              />
            </label>
            <div className="text-sm text-gray-600">
              Edit <code className="bg-gray-100 px-2 py-1 rounded">dev.tsx</code> to change sample data
            </div>
          </div>
        </div>
        <CredentialsPage
          credentials={credentials}
          credentialsPerRow={credentialsPerRow}
        />
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
