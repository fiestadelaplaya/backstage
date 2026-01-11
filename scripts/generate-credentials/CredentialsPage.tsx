import React from "react";
import { CredentialCard, CredentialData } from "./CredentialCard";

interface CredentialsPageProps {
  credentials: CredentialData[];
  credentialsPerRow?: number;
}

export const CredentialsPage: React.FC<CredentialsPageProps> = ({
  credentials,
  credentialsPerRow = 2,
}) => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div
        className="grid mx-auto"
        style={{
          gridTemplateColumns: `repeat(${credentialsPerRow}, 1fr)`,
          maxWidth: "fit-content",
        }}
      >
        {credentials.map((credential, index) => (
          <CredentialCard key={index} credential={credential} />
        ))}
      </div>
    </div>
  );
};
