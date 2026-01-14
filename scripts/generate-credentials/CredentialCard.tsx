import React from "react";

export interface CredentialData {
    name: string;
    lastname: string;
    idNumber: string;
    role: string;
    qrCodeDataUrl: string;
    templateImagePath: string;
}

interface CredentialCardProps {
    credential: CredentialData;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
    credential,
}) => {
    console.log(credential.role);
    return (
        <div className="relative w-[945px] h-[1300px] border border-gray-300 overflow-hidden print:border-2">
            {/* Template Background */}
            <img
                src={credential.templateImagePath}
                alt={`Template ${credential.role}`}
                className="absolute inset-0 w-full h-full object-cover"
            />

            <div className={`flex relative top-80 w-full justify-center ${credential.role === "B" && "left-[20px]"}`}>
                <div className="w-fit flex flex-col justify-center text-center bg-white/90 backdrop-blur-sm px-3 py-2 rounded shadow-sm">
                    <div className="text-5xl text-gray-600">{credential.idNumber}</div>
                </div>
            </div>
            {/* Content Overlay */}
            <div className={`absolute w-full ${credential.role === "B" ? "left-[20px]" : "justify-center "} top-[400px] z-10 h-full w-full flex flex-col justify-between p-4`}>
                <div className="flex justify-center">
                    <img
                        src={credential.qrCodeDataUrl}
                        alt="QR Code"
                        className="w-[460px] h-[460px] p-1 rounded"
                    />
                </div>
            </div>

            {/* Name and ID - Bottom */}
            {(credential.role === "C - COM" || credential.role === "X - TEC") && (
                <div className="absolute bottom-[265px] left-[150px] w-full justify-center flex z-20">
                    <div className="w-fit text-center flex flex-col justify-center bg-white backdrop-blur-sm px-3 py-2 rounded shadow-sm">
                        {credential.role.trim() === "C - COM" && (
                            <div className="text-5xl text-gray-600">COM</div>
                        )}
                        {credential.role.trim() === "X - TEC" && (
                            <div className="text-5xl text-gray-600">TEC</div>
                        )}
                    </div>
                </div>
            )}
            <div className={`flex absolute bottom-20 w-full justify-center ${credential.role === "B" && "left-[20px]"}`}>
                <div className="w-fit text-center flex flex-col justify-center bg-white/90 backdrop-blur-sm px-3 py-2 rounded shadow-sm">
                    <div className="text-6xl font-semibold text-gray-900 mb-1">
                        {credential.name}
                    </div>
                    <div className="text-6xl font-semibold text-gray-900 mb-1">
                        {credential.lastname}
                    </div>
                </div>
            </div>
        </div>
    );
};
