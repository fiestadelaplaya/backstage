import React from "react";
import { CredentialCard, CredentialData } from "./CredentialCard";

interface CredentialsPageProps {
  credentials: (CredentialData | null)[];
  credentialsPerRow?: number;
  noPadding?: boolean;
}

export const CredentialsPage: React.FC<CredentialsPageProps> = ({
  credentials,
  credentialsPerRow = 2,
  noPadding = false,
}) => {
  const CARD_WIDTH = 945;
  const CARD_HEIGHT = 1300;
  
  return (
    <div 
      className={noPadding ? '' : 'min-h-screen p-8'}
      style={noPadding ? { 
        width: `${credentialsPerRow * CARD_WIDTH}px`, 
        height: `${Math.ceil(credentials.length / credentialsPerRow) * CARD_HEIGHT}px`,
        margin: 0, 
        padding: 0,
        backgroundColor: 'white',
      } : undefined}
    >
      <div
        className={noPadding ? '' : 'mx-auto'}
        style={{
          gridTemplateColumns: noPadding 
            ? `repeat(${credentialsPerRow}, ${CARD_WIDTH}px)`
            : `repeat(${credentialsPerRow}, 1fr)`,
          gridTemplateRows: noPadding 
            ? `repeat(${Math.ceil(credentials.length / credentialsPerRow)}, ${CARD_HEIGHT}px)`
            : undefined,
          gap: noPadding ? '0' : undefined,
          display: 'grid',
          ...(noPadding ? { 
            width: `${credentialsPerRow * CARD_WIDTH}px`, 
            height: `${Math.ceil(credentials.length / credentialsPerRow) * CARD_HEIGHT}px`,
            margin: 0,
            padding: 0,
          } : { maxWidth: 'fit-content' }),
        }}
      >
        {credentials.map((credential, index) => (
          credential ? (
            <CredentialCard key={index} credential={credential} />
          ) : (
            <div key={index} className="bg-white" style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }} />
          )
        ))}
      </div>
    </div>
  );
};
