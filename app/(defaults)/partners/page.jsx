"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Approve with additional information
const approvePartner = async (partnerId, note) => {
  const response = await fetch('/api/update-partner-status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerId,
      status: 'Approved',
      note
    })
  });
  return response.json();
};

// Reject with reason
const rejectPartner = async (partnerId, reason) => {
  const response = await fetch('/api/update-partner-status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerId,
      status: 'Rejected',
      rejectionReason: reason
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
  const [notification, setNotification] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionPartnerId, setActionPartnerId] = useState(null);
  const [actionNote, setActionNote] = useState("");

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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Helper to get avatar URL
  const getAvatarUrl = (partner) => {
    if (partner.avatarUrl) return partner.avatarUrl;
    // Use random avatar API (e.g., DiceBear Avatars)
    const name = partner.bankDetails?.accountHolderName || "Partner";
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  };

  // Helper to get partner name
  const getPartnerName = (partner) => partner.name || "N/A";

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

  const openApproveModal = (partnerId) => {
    setActionPartnerId(partnerId);
    setActionNote("");
    setShowApproveModal(true);
  };

  const openRejectModal = (partnerId) => {
    setActionPartnerId(partnerId);
    setActionNote("");
    setShowRejectModal(true);
  };

  const handleApprovePartner = async () => {
    setLoading(true);
    try {
      await approvePartner(actionPartnerId, actionNote);
      fetchPartners();
      setShowApproveModal(false);
      setNotification({
        type: "success",
        message: "Partner approved successfully!"
      });
    } catch (e) {
      setNotification({
        type: "error",
        message: "Failed to approve partner"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPartner = async () => {
    setLoading(true);
    try {
      await rejectPartner(actionPartnerId, actionNote);
      fetchPartners();
      setShowRejectModal(false);
      setNotification({
        type: "success",
        message: "Partner rejected successfully!"
      });
    } catch (e) {
      setNotification({
        type: "error",
        message: "Failed to reject partner"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter partners by phone number
  const filteredPartners = partners.filter((partner) => {
    const phone = (partner.phoneNumber || partner.kyc?.phone || "").replace(/\s+/g, "").toLowerCase();
    const searchValue = search.replace(/\s+/g, "").toLowerCase();
    return phone.includes(searchValue);
  });

  if (loading && partners.length === 0) return (
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all transform animate-slide-in ${notification.type === "success" ? "bg-green-100 text-green-800 border-l-4 border-green-500" :
            "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}>
          <div className={`p-2 rounded-full ${notification.type === "success" ? "bg-green-200" : "bg-red-200"}`}>
            {notification.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
          </div>
          <div>{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-blue-900">Partners Management</h1>
        <p className="text-gray-600">Review and manage partner applications</p>
      </div>

      {/* Search Section */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by phone number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPartners}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && partners.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Partners Table */}
      <div className="overflow-hidden bg-white rounded-2xl shadow-lg">
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
            {filteredPartners.map((partner) => (
              <>
                <tr key={partner._id} className="hover:bg-blue-50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200 shadow-sm group-hover:scale-105 transition-transform">
                      <img
                        src={getAvatarUrl(partner)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-blue-900">{getPartnerName(partner)}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      +91 {partner.phoneNumber || partner.kyc?.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${partner.status === 'Approved'
                        ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                        : partner.status === 'Rejected'
                          ? 'bg-red-100 text-red-800 ring-1 ring-red-600/20'
                          : 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20'
                      }`}>
                      {partner.status === 'Approved' && (
                        <svg className="mr-1.5 h-2 w-2 text-green-600" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      )}
                      {partner.status === 'Rejected' && (
                        <svg className="mr-1.5 h-2 w-2 text-red-600" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      )}
                      {(!partner.status || partner.status === 'Pending') && (
                        <svg className="mr-1.5 h-2 w-2 text-yellow-600" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      )}
                      {partner.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all text-sm flex items-center gap-2"
                      onClick={() => handleExpand(partner._id)}
                    >
                      {expandedPartnerId === partner._id ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                          </svg>
                          Hide Details
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                          View Details
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                {expandedPartnerId === partner._id && (
                  <tr key={`${partner._id}-details`}>
                    <td colSpan={5} className="bg-gray-50 p-6">
                      <div className="max-w-4xl mx-auto">
                        {/* Partner Details Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
                          {/* Profile Header */}
                          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                              <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-lg">
                                  <img
                                    src={getAvatarUrl(partner)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <div className="flex-grow">
                                <h2 className="text-2xl font-bold">{getPartnerName(partner)}</h2>
                                <p className="opacity-90">+91 {partner.phoneNumber || partner.kyc?.phone || 'N/A'}</p>
                                <div className="mt-2 max-w-lg">
                                  <p className="text-blue-100">{partner.bio || "No bio available"}</p>
                                </div>
                              </div>
                              <div className="mt-4 md:mt-0 flex md:flex-col gap-3 flex-wrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${partner.status === 'Approved'
                                    ? 'bg-green-100 text-green-800'
                                    : partner.status === 'Rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {partner.status || "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="bg-gray-50 px-6 py-4 flex gap-3 flex-wrap">
                            <button
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:from-green-600 hover:to-green-700 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-green-600"
                              onClick={() => openApproveModal(partner._id)}
                              disabled={partner.status === 'Approved'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                              Approve Partner
                            </button>
                            <button
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:from-red-600 hover:to-red-700 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-500 disabled:hover:to-red-600"
                              onClick={() => openRejectModal(partner._id)}
                              disabled={partner.status === 'Rejected'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                              Reject Partner
                            </button>
                          </div>

                          {/* Tabs Content */}
                          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* PAN Section */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700 border-b pb-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                                </svg>
                                PAN Details
                              </h3>
                              <div className="space-y-4">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-700 w-40">PAN Card Number:</span>
                                  <span className="text-gray-900">{partner.kyc?.panNumber || "Not provided"}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-700 w-40">PAN Card Document:</span>
                                  {partner.kyc?.panCardFile ? (
                                    <button
                                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm flex items-center gap-2 text-sm"
                                      onClick={() => handleShowPanModal(partner.kyc.panCardFile)}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                      </svg>
                                      View Document
                                    </button>
                                  ) : (
                                    <span className="text-red-500">Not uploaded</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bank Details */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700 border-b pb-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                </svg>
                                Bank Details
                              </h3>
                              <div className="space-y-3">
                                {Object.entries(partner.bankDetails || {}).map(([key, value]) => (
                                  key === "cancelCheque" && value ? (
                                    <div key={key} className="flex items-center">
                                      <span className="font-medium text-gray-700 w-40 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <button
                                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm flex items-center gap-2 text-sm"
                                        onClick={() => handleShowPanModal(value)}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                        View Document
                                      </button>
                                    </div>
                                  ) : (
                                    <div key={key} className="flex items-start">
                                      <span className="font-medium text-gray-700 w-40 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span className="text-gray-900 flex-1">{String(value) || "N/A"}</span>
                                    </div>
                                  )
                                ))}
                                {(!partner.bankDetails || Object.keys(partner.bankDetails).length === 0) && (
                                  <div className="text-center py-4 text-gray-500">
                                    No bank details provided
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow col-span-1 lg:col-span-2">
                              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700 border-b pb-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                Additional Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-700 mb-2">Spoken Language</span>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                                    </svg>
                                    <span className="text-gray-800">{partner.spokenLanguage || "Not specified"}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-700 mb-2">Hobbies</span>
                                  <div className="flex flex-wrap gap-2">
                                    {Array.isArray(partner.hobbies) && partner.hobbies.length ? (
                                      partner.hobbies.map((hobby, index) => (
                                        <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                          {hobby}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-500">Not specified</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col col-span-1 md:col-span-2">
                                  <span className="font-medium text-gray-700 mb-2">Bio</span>
                                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{partner.bio || "No bio available"}</p>
                                </div>
                                {partner.audioIntro && (
                                  <div className="flex flex-col col-span-1 md:col-span-2">
                                    <span className="font-medium text-gray-700 mb-2">Audio Introduction</span>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <audio
                                        controls
                                        src={partner.audioIntro}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
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
          <div className="flex flex-col items-center justify-center py-16 bg-white">
            <div className="bg-blue-50 p-4 rounded-full mb-6">
              <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No partners found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {search ? "Try changing your search criteria or clear the search box" : "There are no partners in the system yet"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Approve Partner
                </h3>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                You're about to approve this partner. You can add an optional note that will be saved with this approval.
              </p>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Approval Note (Optional)
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Enter any notes about this approval..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovePartner}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Reject Partner
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Please provide a reason for rejecting this partner. This information will be saved with the rejection.
              </p>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPartner}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={!actionNote.trim()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAN Card Modal */}
      {showPanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Document Viewer</h3>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={handleClosePanModal}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="bg-gray-100 p-4 flex items-center justify-center">
              <img src={modalPanCard} alt="Document" className="max-w-full max-h-[70vh] object-contain" />
            </div>
            <div className="p-4 flex justify-end">
              <button
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleClosePanModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Animation styles */}
      <style jsx>{`
        @keyframes slide-in {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}