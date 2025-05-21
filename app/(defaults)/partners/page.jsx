"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Approve with additional information
const approvePartner = async (partnerId, note) => {
  const response = await fetch(`/api/partners/${partnerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'Approved',
      note: note // Optional note about the approval
    })
  });
  return response.json();
};

// Reject with reason
const rejectPartner = async (partnerId, reason) => {
  const response = await fetch(`/api/partners/${partnerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'Rejected',
      rejectionReason: reason // Reason for rejection
    })
  });
  return response.json();
};

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  const [showPanModal, setShowPanModal] = useState(false);
  const [modalPanCard, setModalPanCard] = useState(null);
  const [search, setSearch] = useState("");

  const fetchPartners = () => {
    setLoading(true);
    fetch("https://battein-onboard-brown.vercel.app/api/partners")
      .then((res) => res.json())
      .then((data) => {
        setPartners(data.partners || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch partners");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Helper to get avatar URL
  const getAvatarUrl = (partner) => {
    if (partner.kyc?.avatarUrl) return partner.kyc.avatarUrl;
    // Use random avatar API (e.g., DiceBear Avatars)
    const name = partner.bankDetails?.accountHolderName || "Partner";
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  };

  // Helper to get partner name
  const getPartnerName = (partner) => partner.bankDetails?.accountHolderName || "N/A";

  const handleExpand = (partnerId) => {
    setExpandedPartnerId(expandedPartnerId === partnerId ? null : partnerId);
  };

  const handleShowPanModal = (panCardFile) => {
    setModalPanCard(panCardFile);
    setShowPanModal(true);
  };

  const handleClosePanModal = () => {
    setShowPanModal(false);
    setModalPanCard(null);
  };

  // Filter partners by phone number
  const filteredPartners = partners.filter((partner) => {
    const phone = (partner.phoneNumber || partner.kyc?.phone || "").replace(/\s+/g, "").toLowerCase();
    const searchValue = search.replace(/\s+/g, "").toLowerCase();
    return phone.includes(searchValue);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span className="text-lg text-gray-500">Loading partners...</span>
    </div>
  );
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Partners</h1>
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by phone number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="overflow-x-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Avatar</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPartners.map((partner, idx) => (
                <>
                  <tr key={partner._id} className="hover:bg-blue-50 transition-all group">
                    <td className="px-6 py-3">
                      <img
                        src={getAvatarUrl(partner)}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm group-hover:scale-105 transition-transform"
                      />
                    </td>
                    <td className="px-6 py-3 font-bold text-lg text-blue-900">{getPartnerName(partner)}</td>
                    <td className="px-6 py-3 text-gray-600">+91 {partner.phoneNumber || partner.kyc?.phone || 'N/A'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${partner.kyc?.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : partner.kyc?.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {partner.kyc?.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors text-sm"
                        onClick={() => handleExpand(partner._id)}
                      >
                        {expandedPartnerId === partner._id ? "Hide Details" : "View Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedPartnerId === partner._id && (
                    <tr key={partner._id + "-details"}>
                      <td colSpan={5} className="bg-gray-50 px-6 py-6">
                        <div className="max-w-3xl mx-auto bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-10 border border-gray-200">
                          {/* Profile Card */}
                          <div className="flex items-center gap-8 mb-10 border-b pb-8">
                            <img
                              src={getAvatarUrl(partner)}
                              alt="Avatar"
                              className="w-28 h-28 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                            />
                            <div>
                              <div className="text-3xl font-extrabold mb-2 text-blue-900 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {getPartnerName(partner)}
                              </div>
                              <div className="text-gray-500 mb-2 italic text-lg">{partner.bio || "N/A"}</div>
                              <span className={`px-5 py-2 rounded text-base font-semibold ${partner.kyc?.status === 'Approved' ? 'bg-green-100 text-green-800' : partner.kyc?.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{partner.kyc?.status || "Pending"}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* PAN Section */}
                            <div className="bg-white rounded-xl p-6 border shadow-sm mb-6">
                              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                PAN Details
                              </h3>
                              <div className="mb-3"><strong>PAN Card Number:</strong> {partner.kyc?.panNumber || "N/A"}</div>
                              <div className="mb-2 flex items-center gap-4">
                                <strong>PAN Card Image:</strong>
                                {partner.kyc?.panCardFile ? (
                                  <button
                                    className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border text-xs"
                                    onClick={() => handleShowPanModal(partner.kyc.panCardFile)}
                                  >
                                    View Image
                                  </button>
                                ) : (
                                  <span className="ml-2">N/A</span>
                                )}
                              </div>
                            </div>
                            {/* Bank Details */}
                            <div className="bg-white rounded-xl p-6 border shadow-sm mb-6">
                              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M9 16h6" /></svg>
                                Bank Details
                              </h3>
                              <ul className="ml-2">
                                {Object.entries(partner.bankDetails || {}).map(([key, value]) => (
                                  key === "cancelCheque" && value ? (
                                    <li key={key} className="mb-2">
                                      <strong>{key}:</strong>
                                      <button
                                        className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border text-xs"
                                        onClick={() => handleShowPanModal(value)}
                                      >
                                        View Image
                                      </button>
                                    </li>
                                  ) : (
                                    <li key={key} className="mb-1">
                                      <strong>{key}:</strong> {String(value)}
                                    </li>
                                  )
                                ))}
                              </ul>
                            </div>
                            {/* Others Section */}
                            <div className="bg-white rounded-xl p-6 border shadow-sm col-span-1 md:col-span-2 mt-2">
                              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5" /></svg>
                                Others
                              </h3>
                              <ul className="ml-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <li>
                                  <strong>Spoken Language:</strong>{' '}
                                  {partner.spokenLanguage ? partner.spokenLanguage : 'N/A'}
                                </li>
                                <li>
                                  <strong>Hobbies:</strong>{' '}
                                  {Array.isArray(partner.hobbies) && partner.hobbies.length ? partner.hobbies.join(', ') : 'N/A'}
                                </li>
                                <li className="col-span-2"><strong>Bio:</strong> {partner.bio || 'N/A'}</li>
                                <li className="col-span-2"><strong>Audio Intro:</strong> {partner.audioIntro ? <audio controls src={partner.audioIntro} className="inline-block align-middle" /> : 'N/A'}</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filteredPartners.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-blue-200 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.364 17.364A9 9 0 1112 3v0a9 9 0 013.364 14.364z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
              </svg>
              <div className="text-xl text-gray-400 font-semibold">No partners found.</div>
            </div>
          )}
        </div>
      </div>
      {/* PAN Card Modal */}
      {showPanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={handleClosePanModal}
            >
              &times;
            </button>
            <img src={modalPanCard} alt="PAN Card" className="max-w-full max-h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
