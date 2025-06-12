"use client";
import { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { compressImage, userOnboardingApi } from "@/utils";
import Cookies from "universal-cookie";

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

// Delete partner
const deletePartner = async (partnerId) => {
  await fetch(`https://battein-onboard-brown.vercel.app/api/partners/${partnerId}`, {
    method: 'DELETE',
  });
};

export default function PartnersPage() {
  const cookies = new Cookies(null, { path: '/' });

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
  const [selectedPartner,setSelectedPartner]=useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [partnersPerPage] = useState(10); // Default to 10 partners per page
  const [totalPartners, setTotalPartners] = useState(0);

  // Add a new state for action loading
  const [actionLoading, setActionLoading] = useState(false);

  // Add state for profile picture modal
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [modalProfilePic, setModalProfilePic] = useState(null);

  // Add state for inline editing
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

  const fetchPartners = () => {
    setLoading(true);
    // Include pagination parameters in the API URL
    const apiUrl = `https://battein-onboard-brown.vercel.app/api/partners?page=${currentPage}&limit=${partnersPerPage}`;
    
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log("Total partners fetched:", data.partners?.length || 0);
        setPartners(data.partners || []);
        setTotalPartners(data.pagination?.total || data.partners?.length || 0);
        setLoading(false);
        
        if (data.partners?.length > 0) {
          setNotification({
            type: "success",
            message: `${data.partners.length} partners loaded successfully`
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching partners:", err);
        setError("Failed to fetch partners");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPartners();
  }, [currentPage]); // Add currentPage as a dependency to refetch when page changes

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

  const openApproveModal = (partner) => {
    setActionPartnerId(partner?._id)
    setSelectedPartner(partner);
    setActionNote("");
    setShowApproveModal(true);
  };

  const openRejectModal = (partner) => {
    setSelectedPartner(partner);
    setActionNote("");
    setShowRejectModal(true);
  };



  const avatar_Images= [
    "https://baatein.blob.core.windows.net/profile/avatars/67330ec8fd6d9676d4f561a3_avatar",
    "https://baatein.blob.core.windows.net/profile/avatars/6736678efd6d9676d4003e21_avatar",
    "https://baatein.blob.core.windows.net/profile/avatars/6718015be89759019e441e45_avatar",
    "https://baatein.blob.core.windows.net/profile/avatars/670b97e55fa05dd4aea47e44_avatar"
  ]

  function reencodeImageBlob(blob, mimeType = 'image/jpeg', quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
  
        canvas.toBlob(
          (newBlob) => {
            if (newBlob) resolve(newBlob);
            else reject(new Error('Canvas toBlob failed'));
          },
          mimeType,
          quality
        );
      };
  
      img.onerror = () => reject(new Error('Image load error'));
  
      img.src = URL.createObjectURL(blob);
    });
  }
  
  
  const handleApprovePartner = async () => {
    setActionLoading(true);
    setLoading(true);
    try {
      console.log("Selectedd partner",selectedPartner);
      // console.log('profile',selectedPartner?.profilePicture,typeof selectedPartner?.profilePicture);
      const formData = new FormData()

      formData.append('name',selectedPartner?.name);
      formData.append('phone',selectedPartner?.phoneNumber);
      formData.append('about',selectedPartner?.bio)
      formData.append('videoRpm',29);
      formData.append('payoutVideoRpm',9);
      formData.append('rpm',6);
      formData.append('payoutAudioRpm',2);
      formData.append('role','friend');
      formData.append('age',22);
      formData.append('status','offline');

      if(selectedPartner?.bankDetails?.upiId){
        formData.append('upi',selectedPartner?.bankDetails?.upiId);
      }

      if (selectedPartner?.spokenLanguages?.length > 0) {
        selectedPartner.spokenLanguages.forEach(language => {
          formData.append('language', language.toLowerCase());
        });
      }

      if(selectedPartner?.earningPreference?.toLowerCase === "video"){
        formData.append('isVideoCallAllowed',true);
        formData.append('isVideoCallAllowedAdmin',true);
      }
      
      const imageResponse = await fetch(selectedPartner?.profilePicture || avatar_Images[Math.floor(Math.random()*avatar_Images.length)]);
      const imageBlob = await imageResponse.blob();
      const fixedBlob = await reencodeImageBlob(imageBlob, 'image/jpeg', 0.8);


      const compressedAvatar=await compressImage(fixedBlob);
      formData.append('avatar',compressedAvatar);
      
      const audioResponse=await fetch(selectedPartner?.audioIntro);
      const audioBlob=await audioResponse.blob();
      formData.append('sample',audioBlob);

      const apiData = await userOnboardingApi('/auth/api/team/add-people', formData, cookies.get('access_token'))
      if (apiData?.success) {
          console.log('success',apiData);
      } else {
          throw new Error(apiData?.message);
      }
      await approvePartner(selectedPartner?._id, actionNote);
      fetchPartners();
      setShowApproveModal(false);
      setNotification({
        type: "success",
        message: "Partner approved successfully!"
      });
    } catch (e) {
      console.error(e);
      setNotification({
        type: "error",
        message: "Failed to approve partner"
      });
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  };

  const handleRejectPartner = async () => {
    setActionLoading(true);
    setLoading(true);
    try {
      await rejectPartner(actionPartnerId, actionNote);
      await deletePartner(actionPartnerId);
      fetchPartners();
      setShowRejectModal(false);
      setNotification({
        type: "success",
        message: "Partner rejected and deleted successfully!"
      });
    } catch (e) {
      setNotification({
        type: "error",
        message: "Failed to reject and delete partner"
      });
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  };

  // Filter partners by phone number (client-side search, but only on current page)
  const filteredPartners = partners.filter((partner) => {
    const phone = (partner.phoneNumber || partner.kyc?.phone || "").replace(/\s+/g, "").toLowerCase();
    const searchValue = search.replace(/\s+/g, "").toLowerCase();
    return phone.includes(searchValue);
  });

  // Calculate totalPages from totalPartners and partnersPerPage
  const totalPages = Math.ceil(totalPartners / partnersPerPage);

  // Add handler to start editing
  const handleStartEdit = (partner) => {
    setEditingPartnerId(partner._id);
    setEditForm({
      name: partner.name || "",
      phoneNumber: partner.phoneNumber || "",
      gender: partner.gender || "",
      spokenLanguages: Array.isArray(partner.spokenLanguages) ? partner.spokenLanguages.join(", ") : partner.spokenLanguages || "",
      hobbies: Array.isArray(partner.hobbies) ? partner.hobbies.join(", ") : partner.hobbies || "",
      bio: partner.bio || "",
      audioIntro: partner.audioIntro || "",
      profilePicture: partner.profilePicture || "",
      kyc: {
        panNumber: partner.kyc?.panNumber || "",
        panCardFile: partner.kyc?.panCardFile || "",
      },
      bankDetails: partner.bankDetails ? { 
        bankAccountNumber: partner.bankDetails.bankAccountNumber || "",
        accountHolderName: partner.bankDetails.accountHolderName || "",
        ifscCode: partner.bankDetails.ifscCode || "",
        branchName: partner.bankDetails.branchName || "",
        upiId: partner.bankDetails.upiId || "",
        cancelCheque: partner.bankDetails.cancelCheque || "",
        ...partner.bankDetails 
      } : {
        bankAccountNumber: "",
        accountHolderName: "",
        ifscCode: "",
        branchName: "",
        upiId: "",
        cancelCheque: "",
      },
      capturedPhoto: partner.capturedPhoto || "",
      status: partner.status || "",
      earningPreference: partner.earningPreference || "",
    });
    setEditSuccess("");
    setEditError("");
  };

  // Add handler to update edit form
  const handleEditInput = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("bankDetails.")) {
      const key = name.replace("bankDetails.", "");
      setEditForm((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, [key]: value } }));
    } else if (name.startsWith("kyc.")) {
      const key = name.replace("kyc.", "");
      setEditForm((prev) => ({ ...prev, kyc: { ...prev.kyc, [key]: value } }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Add handler to save edit
  const handleSaveEdit = async (partnerId) => {
    setEditSaving(true);
    setEditSuccess("");
    setEditError("");
    try {
      const payload = {
        name: editForm.name,
        phoneNumber: editForm.phoneNumber,
        gender: editForm.gender,
        spokenLanguages: editForm.spokenLanguages.split(",").map((lang) => lang.trim()).filter(Boolean),
        hobbies: editForm.hobbies.split(",").map((h) => h.trim()).filter(Boolean),
        bio: editForm.bio,
        audioIntro: editForm.audioIntro,
        profilePicture: editForm.profilePicture,
        kyc: { 
          panNumber: editForm.kyc.panNumber,
          panCardFile: editForm.kyc.panCardFile,
        },
        bankDetails: editForm.bankDetails,
        capturedPhoto: editForm.capturedPhoto,
        status: editForm.status,
        earningPreference: editForm.earningPreference,
      };
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update partner");
      setEditSuccess("Partner updated successfully!");
      setEditingPartnerId(null);
      fetchPartners();
    } catch (err) {
      setEditError(err.message || "Failed to update partner");
    } finally {
      setEditSaving(false);
    }
  };

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

      {/* Add spinner overlay for actionLoading */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[100]">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-lg text-gray-700">Processing...</span>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 002-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
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
                              onClick={() => openApproveModal(partner)}
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
                            {/* Edit Partner Section */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700 border-b pb-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h2v2h-2v-2z"></path>
                                </svg>
                                Edit Partner Section
                              </h3>
                              <div className="flex justify-end mb-4">
                                {editingPartnerId === partner._id ? (
                                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                                      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                          <h2 className="text-2xl font-bold text-gray-900">Edit Partner Details</h2>
                                          <button
                                            onClick={() => setEditingPartnerId(null)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                          >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="p-6 space-y-8">
                                          {/* Basic Information */}
                                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                </svg>
                                              </div>
                                              Basic Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                                <input 
                                                  type="text" 
                                                  name="name" 
                                                  value={editForm.name} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                                <input 
                                                  type="text" 
                                                  name="phoneNumber" 
                                                  value={editForm.phoneNumber} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                                <select 
                                                  name="gender" 
                                                  value={editForm.gender} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                >
                                                  <option value="">Select Gender</option>
                                                  <option value="Male">Male</option>
                                                  <option value="Female">Female</option>
                                                  <option value="Other">Other</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                                <select 
                                                  name="status" 
                                                  value={editForm.status} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                >
                                                  {/* <option value="">Select Status</option> */}
                                                  <option value="Pending">Pending</option>
                                                  <option value="Approved">Approved</option>
                                                  <option value="Rejected">Rejected</option>
                                                  {/* <option value="Active">Active</option>
                                                  <option value="Inactive">Inactive</option> */}
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Earning Preference</label>
                                                <select 
                                                  name="earningPreference" 
                                                  value={editForm.earningPreference} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                >
                                                  <option value="">Select Preference</option>
                                                  <option value="audio">Audio</option>
                                                  <option value="video">Video</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Spoken Languages (comma separated)</label>
                                                <input 
                                                  type="text" 
                                                  name="spokenLanguages" 
                                                  value={editForm.spokenLanguages} 
                                                  onChange={handleEditInput} 
                                                  placeholder="English, Hindi, Spanish"
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies (comma separated)</label>
                                                <input 
                                                  type="text" 
                                                  name="hobbies" 
                                                  value={editForm.hobbies} 
                                                  onChange={handleEditInput} 
                                                  placeholder="Reading, Swimming, Cooking"
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                                <textarea 
                                                  name="bio" 
                                                  value={editForm.bio} 
                                                  onChange={handleEditInput} 
                                                  rows="4"
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm resize-none" 
                                                />
                                              </div>
                                            </div>
                                          </div>

                                          {/* Media Files */}
                                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                              </div>
                                              Media Files
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                                                <div className="space-y-4">
                                                  {editForm.profilePicture ? (
                                                    <div className="relative inline-block">
                                                      <img 
                                                        src={editForm.profilePicture} 
                                                        alt="Profile Preview" 
                                                        className="w-40 h-40 rounded-xl object-cover border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                                                        onError={(e) => {
                                                          e.target.style.display = 'none';
                                                        }}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => setEditForm(prev => ({ ...prev, profilePicture: "" }))}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                      >
                                                        ×
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const input = document.querySelector('input[name="profilePicture"]');
                                                          input.style.display = input.style.display === 'none' ? 'block' : 'none';
                                                        }}
                                                        className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors shadow-lg"
                                                        title="Edit URL"
                                                      >
                                                        ✎
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                                      <div className="text-center">
                                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                                        </svg>
                                                        <p className="text-sm text-gray-500">Add Image</p>
                                                      </div>
                                                    </div>
                                                  )}
                                                  <input 
                                                    type="url" 
                                                    name="profilePicture" 
                                                    value={editForm.profilePicture} 
                                                    onChange={handleEditInput} 
                                                    placeholder="Enter image URL"
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                    style={{ display: editForm.profilePicture ? 'none' : 'block' }}
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                  {editForm.earningPreference === 'video' ? 'Video Intro' : 'Audio Intro'}
                                                </label>
                                                <div className="space-y-4">
                                                  {editForm.audioIntro ? (
                                                    <div className="relative">
                                                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                                                        {editForm.earningPreference === 'video' ? (
                                                          <video
                                                            controls
                                                            src={editForm.audioIntro}
                                                            className="w-full h-32 rounded"
                                                          />
                                                        ) : (
                                                          <audio
                                                            controls
                                                            src={editForm.audioIntro}
                                                            className="w-full"
                                                          />
                                                        )}
                                                      </div>
                                                      <button
                                                        type="button"
                                                        onClick={() => setEditForm(prev => ({ ...prev, audioIntro: "" }))}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                      >
                                                        ×
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const input = document.querySelector('input[name="audioIntro"]');
                                                          input.style.display = input.style.display === 'none' ? 'block' : 'none';
                                                        }}
                                                        className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors shadow-lg"
                                                        title="Edit URL"
                                                      >
                                                        ✎
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                                      <div className="text-center">
                                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 15.536a5 5 0 010-7.072m-2.828 9.9a9 9 0 010-14.142"></path>
                                                        </svg>
                                                        <p className="text-sm text-gray-500">Add {editForm.earningPreference === 'video' ? 'Video' : 'Audio'}</p>
                                                      </div>
                                                    </div>
                                                  )}
                                                  <input 
                                                    type="url" 
                                                    name="audioIntro" 
                                                    value={editForm.audioIntro} 
                                                    onChange={handleEditInput} 
                                                    placeholder={`Enter ${editForm.earningPreference === 'video' ? 'video' : 'audio'} URL`}
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                    style={{ display: editForm.audioIntro ? 'none' : 'block' }}
                                                  />
                                                </div>
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Captured Photo</label>
                                                <div className="space-y-4">
                                                  {editForm.capturedPhoto ? (
                                                    <div className="relative inline-block">
                                                      <img 
                                                        src={editForm.capturedPhoto} 
                                                        alt="Captured Photo Preview" 
                                                        className="w-48 h-36 rounded-xl object-cover border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                                                        onError={(e) => {
                                                          e.target.style.display = 'none';
                                                        }}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => setEditForm(prev => ({ ...prev, capturedPhoto: "" }))}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                      >
                                                        ×
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const input = document.querySelector('input[name="capturedPhoto"]');
                                                          input.style.display = input.style.display === 'none' ? 'block' : 'none';
                                                        }}
                                                        className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors shadow-lg"
                                                        title="Edit URL"
                                                      >
                                                        ✎
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="w-48 h-36 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                                      <div className="text-center">
                                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                        </svg>
                                                        <p className="text-sm text-gray-500">Add Photo</p>
                                                      </div>
                                                    </div>
                                                  )}
                                                  <input 
                                                    type="url" 
                                                    name="capturedPhoto" 
                                                    value={editForm.capturedPhoto} 
                                                    onChange={handleEditInput} 
                                                    placeholder="Enter image URL"
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                    style={{ display: editForm.capturedPhoto ? 'none' : 'block' }}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* KYC Details */}
                                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                                                </svg>
                                              </div>
                                              KYC Details
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">PAN Card Number</label>
                                                <input 
                                                  type="text" 
                                                  name="kyc.panNumber" 
                                                  value={editForm.kyc.panNumber} 
                                                  onChange={handleEditInput} 
                                                  placeholder="Enter PAN number"
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">PAN Card Document</label>
                                                <div className="space-y-4">
                                                  {editForm.kyc.panCardFile ? (
                                                    <div className="relative inline-block">
                                                      <img 
                                                        src={editForm.kyc.panCardFile} 
                                                        alt="PAN Card Preview" 
                                                        className="w-48 h-32 rounded-xl object-cover border-2 border-gray-200 shadow-lg cursor-pointer hover:opacity-80 transition-all hover:shadow-xl"
                                                        onError={(e) => {
                                                          e.target.style.display = 'none';
                                                        }}
                                                        onClick={() => handleShowPanModal(editForm.kyc.panCardFile)}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => setEditForm(prev => ({ ...prev, kyc: { ...prev.kyc, panCardFile: "" } }))}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                      >
                                                        ×
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const input = document.querySelector('input[name="kyc.panCardFile"]');
                                                          input.style.display = input.style.display === 'none' ? 'block' : 'none';
                                                        }}
                                                        className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors shadow-lg"
                                                        title="Edit URL"
                                                      >
                                                        ✎
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                                      <div className="text-center">
                                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                        </svg>
                                                        <p className="text-sm text-gray-500">Add PAN Card</p>
                                                      </div>
                                                    </div>
                                                  )}
                                                  <input 
                                                    type="url" 
                                                    name="kyc.panCardFile" 
                                                    value={editForm.kyc.panCardFile} 
                                                    onChange={handleEditInput} 
                                                    placeholder="Enter PAN card image URL"
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                    style={{ display: editForm.kyc.panCardFile ? 'none' : 'block' }}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Bank Details */}
                                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                                </svg>
                                              </div>
                                              Bank Details
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                                                <input 
                                                  type="text" 
                                                  name="bankDetails.bankAccountNumber" 
                                                  value={editForm.bankDetails.bankAccountNumber} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                                                <input 
                                                  type="text" 
                                                  name="bankDetails.accountHolderName" 
                                                  value={editForm.bankDetails.accountHolderName} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                                                <input 
                                                  type="text" 
                                                  name="bankDetails.ifscCode" 
                                                  value={editForm.bankDetails.ifscCode} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                                                <input 
                                                  type="text" 
                                                  name="bankDetails.branchName" 
                                                  value={editForm.bankDetails.branchName} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                                                <input 
                                                  type="text" 
                                                  name="bankDetails.upiId" 
                                                  value={editForm.bankDetails.upiId} 
                                                  onChange={handleEditInput} 
                                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white shadow-sm" 
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Cancel Cheque</label>
                                                <div className="space-y-4">
                                                  {editForm.bankDetails.cancelCheque ? (
                                                    <div className="relative inline-block">
                                                      <img 
                                                        src={editForm.bankDetails.cancelCheque} 
                                                        alt="Cancel Cheque Preview" 
                                                        className="w-48 h-32 rounded-xl object-cover border-2 border-gray-200 shadow-lg cursor-pointer hover:opacity-80 transition-all hover:shadow-xl"
                                                        onError={(e) => {
                                                          e.target.style.display = 'none';
                                                        }}
                                                        onClick={() => handleShowPanModal(editForm.bankDetails.cancelCheque)}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => setEditForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, cancelCheque: "" } }))}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                      >
                                                        ×
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const input = document.querySelector('input[name="bankDetails.cancelCheque"]');
                                                          input.style.display = input.style.display === 'none' ? 'block' : 'none';
                                                        }}
                                                        className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-blue-600 transition-colors shadow-lg"
                                                        title="Edit URL"
                                                      >
                                                        ✎
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                                      <div className="text-center">
                                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                        </svg>
                                                        <p className="text-sm text-gray-500">Add Cheque</p>
                                                      </div>
                                                    </div>
                                                  )}
                                                  <input 
                                                    type="url" 
                                                    name="bankDetails.cancelCheque" 
                                                    value={editForm.bankDetails.cancelCheque} 
                                                    onChange={handleEditInput} 
                                                    placeholder="Enter cancel cheque image URL"
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white shadow-sm"
                                                    style={{ display: editForm.bankDetails.cancelCheque ? 'none' : 'block' }}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Buttons - Sticky Footer */}
                                      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex-shrink-0">
                                        <div className="flex justify-end gap-4">
                                          <button 
                                            onClick={() => setEditingPartnerId(null)} 
                                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                          >
                                            Cancel
                                          </button>
                                          <button 
                                            onClick={() => handleSaveEdit(partner._id)} 
                                            disabled={editSaving} 
                                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 shadow-lg"
                                          >
                                            {editSaving ? (
                                              <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                                </svg>
                                                Saving...
                                              </>
                                            ) : (
                                              <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Save Changes
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        {/* Success/Error Messages */}
                                        {editSuccess && (
                                          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            {editSuccess}
                                          </div>
                                        )}
                                        {editError && (
                                          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                            {editError}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStartEdit(partner)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-all text-sm gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h2v2h-2v-2z" />
                                    </svg>
                                    Edit Partner Details
                                  </button>
                                )}
                              </div>
                              <div className="text-center py-8 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h2v2h-2v-2z"></path>
                                </svg>
                                <p className="text-sm">Click "Edit Partner Details" to modify partner information</p>
                              </div>
                            </div>

                            {/* PAN Details Section */}
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
                                  {Array.isArray(partner.spokenLanguages) && partner.spokenLanguages.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {partner.spokenLanguages.map((lang, idx) => (
                                        <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                          {lang}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Not specified</span>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-700 mb-2">Hobbies</span>
                                  <div className="flex flex-wrap gap-2">
                                    {Array.isArray(partner.hobbies) && partner.hobbies.length > 0 ? (
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
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-700 mb-2">Earning Preference</span>
                                  <span className="text-gray-900 bg-blue-50 px-3 py-2 rounded-lg inline-block w-fit">
                                    {partner.earningPreference ? (partner.earningPreference.charAt(0).toUpperCase() + partner.earningPreference.slice(1)) : 'Not specified'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-700 mb-2">Profile Picture</span>
                                  <div className="flex items-center gap-4">
                                    {partner.profilePicture ? (
                                      <img
                                        src={partner.profilePicture}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border shadow cursor-pointer transition-transform hover:scale-105"
                                        onClick={() => {
                                          setModalProfilePic(partner.profilePicture);
                                          setShowProfilePicModal(true);
                                        }}
                                      />
                                    ) : (
                                      <span className="text-gray-500">No profile picture</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col col-span-1 md:col-span-2">
                                  <span className="font-medium text-gray-700 mb-2">Bio</span>
                                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{partner.bio || "No bio available"}</p>
                                </div>
                                {partner.audioIntro && (
                                  <div className="flex flex-col col-span-1 md:col-span-2">
                                    <span className="font-medium text-gray-700 mb-2">
                                      Audio Introduction
                                    </span>
                                    <div>
                                      {partner.earningPreference === 'video' ? (
                                        <video
                                          controls
                                          src={partner.audioIntro}
                                          className="w-full max-w-md h-48 rounded"
                                        />
                                      ) : (
                                        <audio
                                          controls
                                          src={partner.audioIntro}
                                          className="w-full"
                                        />
                                      )}
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

      {/* Pagination */}
      <div className="mt-6">
        <nav className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {partners.length > 0 ? (currentPage - 1) * partnersPerPage + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-700">
              {Math.min(currentPage * partnersPerPage, totalPartners)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">{totalPartners}</span> partners
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white text-blue-700 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(totalPartners / partnersPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current page
                  return page === 1 || 
                         page === Math.ceil(totalPartners / partnersPerPage) ||
                         Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <Fragment key={`ellipsis-${page}`}>
                        <span className="px-2">...</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "bg-white text-blue-700 border border-gray-200 hover:bg-blue-50"
                          }`}
                        >
                          {page}
                        </button>
                      </Fragment>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-white text-blue-700 border border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalPartners / partnersPerPage)))}
              disabled={currentPage >= Math.ceil(totalPartners / partnersPerPage)}
              className="px-3 py-1 bg-white text-blue-700 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        </nav>
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

      {/* Profile Picture Modal */}
      {showProfilePicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] animate-fade-in" onClick={() => setShowProfilePicModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-4 max-w-2xl w-full flex flex-col items-center relative animate-zoom-in" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={() => setShowProfilePicModal(false)}
            >
              &times;
            </button>
            <img src={modalProfilePic} alt="Profile Zoomed" className="max-w-full max-h-[70vh] rounded-xl transition-all" />
          </div>
        </div>
      )}

      {/* Add Animation styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
        @keyframes zoom-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in {
          animation: zoom-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Custom Scrollbar Styles */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Smooth scrolling */
        .custom-scrollbar {
          scroll-behavior: smooth;
        }
        
        /* Hide URL inputs when they're empty or not focused */
        .url-input-hidden {
          opacity: 0.7;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .url-input-hidden:focus {
          opacity: 1;
          color: #111827;
        }
      `}</style>
    </div>
  );
}