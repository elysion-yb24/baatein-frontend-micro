"use client";
import { useEffect, useState } from "react";

export default function PartnerDetailsPage({ params }) {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPanModal, setShowPanModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // NEW STATE

  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`https://battein-onboard-brown.vercel.app/api/partners/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPartner(data.partner || data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch partner details");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading partner details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!partner) return <div>No partner found.</div>;

  const panNumber = partner.kyc?.panNumber || "N/A";
  const panCardFile = partner.kyc?.panCardFile;
  const bankDetails = partner.bankDetails || {};
  const spokenLanguages = partner.spokenLanguages || [];
  const hobby = partner.hobby || "N/A";
  const bio = partner.bio || "N/A";
  const audioIntro = partner.audioIntro;
  const status = partner.kyc?.status || "Pending";
  const profilePicture = partner.profilePicture || null;

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Partner Details</h1>

      {/* PAN Card */}
      <div className="mb-4">
        <strong>PAN Card Number:</strong> {panNumber}
      </div>
      <div className="mb-4">
        <strong>PAN Card Image:</strong>{" "}
        {panCardFile ? (
          <>
            <img
              src={panCardFile}
              alt="PAN Card"
              className="w-40 h-24 object-contain border rounded cursor-pointer inline-block"
              onClick={() => setShowPanModal(true)}
            />
            {showPanModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded shadow-lg relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
                    onClick={() => setShowPanModal(false)}
                  >
                    &times;
                  </button>
                  <img src={panCardFile} alt="PAN Card" className="max-w-full max-h-[70vh]" />
                </div>
              </div>
            )}
          </>
        ) : (
          <span>N/A</span>
        )}
      </div>

      {/* Profile Picture */}
      <div className="mb-4">
        <strong>Profile Picture:</strong>{" "}
        {profilePicture ? (
          <>
            <img
              src={profilePicture}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border cursor-pointer inline-block"
              onClick={() => setShowProfileModal(true)}
            />
            {showProfileModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded shadow-lg relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
                    onClick={() => setShowProfileModal(false)}
                  >
                    &times;
                  </button>
                  <img src={profilePicture} alt="Profile" className="max-w-full max-h-[70vh] rounded-full" />
                </div>
              </div>
            )}
          </>
        ) : (
          <span>N/A</span>
        )}
      </div>

      {/* Bank */}
      <div className="mb-4">
        <strong>Bank Details:</strong>
        <ul className="ml-4 list-disc">
          {Object.entries(bankDetails).map(([key, value]) => (
            <li key={key} className="mb-1">
              <strong>{key}:</strong> {String(value)}
            </li>
          ))}
        </ul>
      </div>

      {/* Status */}
      <div className="mb-4">
        <strong>Status:</strong>{" "}
        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
          {status}
        </span>
      </div>

      {/* Others */}
      <div className="mb-4">
        <strong>Others:</strong>
        <ul className="ml-4 list-disc">
          <li><strong>Spoken Languages:</strong> {spokenLanguages.length ? spokenLanguages.join(", ") : "N/A"}</li>
          <li><strong>Hobby:</strong> {hobby}</li>
          <li><strong>Bio:</strong> {bio}</li>
          <li>
            <strong>Audio Intro:</strong>{" "}
            {audioIntro ? <audio controls src={audioIntro} className="inline-block align-middle" /> : "N/A"}
          </li>
        </ul>
      </div>
    </div>
  );
}
