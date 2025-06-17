"use client";
import { useEffect, useState, Fragment } from "react";
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

// Delete partner
const deletePartner = async (partnerId) => {
  await fetch(`https://battein-onboard-brown.vercel.app/api/partners/${partnerId}`, {
    method: 'DELETE',
  });
};

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  const [showPanModal, setShowPanModal] = useState(false);
  const [modalPanCard, setModalPanCard] = useState(null);
  const [search, setSearch] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    phone: ""
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [activeSearchFilters, setActiveSearchFilters] = useState({
    name: "",
    phone: ""
  });
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionPartnerId, setActionPartnerId] = useState(null);
  const [actionNote, setActionNote] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [partnersPerPage] = useState(10); // Default to 10 partners per page
  const [totalPartners, setTotalPartners] = useState(0);

  // Add a new state for action loading
  const [actionLoading, setActionLoading] = useState(false);
  
  // Add separate loading state for search
  const [searchLoading, setSearchLoading] = useState(false);

  // Add state for profile picture modal
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [modalProfilePic, setModalProfilePic] = useState(null);

  // Add state for inline editing
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

  const fetchPartners = (searchQuery = "") => {
    setLoading(true);
    // Include pagination and search parameters in the API URL
    let apiUrl = `https://battein-onboard-brown.vercel.app/api/partners?page=${currentPage}&limit=${partnersPerPage}`;
    
    // Add search parameter if provided
    if (searchQuery.trim()) {
      apiUrl += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log("Total partners fetched:", data.partners?.length || 0);
        setPartners(data.partners || []);
        setTotalPartners(data.pagination?.total || data.partners?.length || 0);
        setLoading(false);

        // Don't show search notifications here - we'll handle them after filtering
        if (!searchQuery.trim() && data.partners?.length > 0) {
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

  // Fetch all partners for search (without pagination)
  const fetchAllPartnersForSearch = () => {
    setSearchLoading(true);
    // Clear any existing notifications to prevent error notifications during search
    setNotification(null);
    
    // Fetch all partners without pagination for search
    const apiUrl = `https://battein-onboard-brown.vercel.app/api/partners?limit=1000`; // Large limit to get all partners

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log("All partners fetched for search:", data.partners?.length || 0);
        setPartners(data.partners || []);
        setTotalPartners(data.pagination?.total || data.partners?.length || 0);
        setSearchLoading(false);
        
        // Trigger search result notification immediately
        triggerSearchNotification(data.partners || []);
      })
      .catch((err) => {
        console.error("Error fetching all partners for search:", err);
        setNotification({
          type: "error",
          message: "Failed to fetch partners for search"
        });
        setSearchLoading(false);
      });
  };

  useEffect(() => {
    // Only fetch paginated partners if search is not active
    if (!isSearchActive) {
      fetchPartners(search);
    }
  }, [currentPage, isSearchActive]); // Add currentPage as a dependency to refetch when page changes

  // Separate effect for search to reset to page 1 when searching
  useEffect(() => {
    // Only handle this if search is not active (for the old search functionality)
    if (!isSearchActive) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchPartners(search);
      }
    }
  }, [search, isSearchActive]); // Trigger search when search term changes

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Function to trigger search notifications
  const triggerSearchNotification = (partnersData) => {
    const hasActiveFilters = activeSearchFilters.name.trim() || activeSearchFilters.phone.trim();

    if (hasActiveFilters) {
      const activeFilters = [];
      if (activeSearchFilters.name.trim()) activeFilters.push(`name: "${activeSearchFilters.name}"`);
      if (activeSearchFilters.phone.trim()) activeFilters.push(`phone: "${activeSearchFilters.phone}"`);

      // Filter the partners data directly
      let filtered = partnersData;
      if (activeSearchFilters.name.trim()) {
        filtered = filtered.filter((partner) => {
          const name = (partner.name || "").toLowerCase();
          return name.includes(activeSearchFilters.name.toLowerCase());
        });
      }
      if (activeSearchFilters.phone.trim()) {
        filtered = filtered.filter((partner) => {
          const phone = (partner.phoneNumber || partner.kyc?.phone || "").replace(/\s+/g, "");
          return phone.includes(activeSearchFilters.phone.replace(/\s+/g, ""));
        });
      }

      if (filtered.length > 0) {
        setNotification({
          type: "success",
          message: `Found ${filtered.length} partner(s) matching filters: ${activeFilters.join(", ")}`
        });
      } else {
        setNotification({
          type: "info",
          message: `No partners found matching filters: ${activeFilters.join(", ")}`
        });
      }
    }
  };

  // Handle advanced search form submission
  const handleAdvancedSearch = () => {
    // Clear any existing notifications first
    setNotification(null);
    
    // Clear partners immediately when search starts
    setPartners([]);
    
    // Set active search filters to current search filters
    setActiveSearchFilters({
      name: searchFilters.name,
      phone: searchFilters.phone
    });
    setIsSearchActive(true);
    
    // Clear general search when using advanced search
    setSearch("");
    setShowAdvancedSearch(true);
    
    // Reset to first page
    setCurrentPage(1);
    
    // Fetch all partners for search (without pagination)
    fetchAllPartnersForSearch();
  };

  // Handle clearing advanced search
  const handleClearAdvancedSearch = () => {
    setSearchFilters({
      name: "",
      phone: ""
    });
    setActiveSearchFilters({
      name: "",
      phone: ""
    });
    setIsSearchActive(false);
    setShowAdvancedSearch(false);
    setSearch("");
    
    // Reset to page 1 and fetch paginated partners
    setCurrentPage(1);
    
    setNotification({
      type: "success",
      message: "Filters cleared - showing all partners"
    });
    
    // Fetch paginated partners again
    setTimeout(() => {
      fetchPartners();
    }, 100);
  };

  // Handle advanced search input changes
  const handleAdvancedSearchInput = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper to get avatar URL
  const getAvatarUrl = (partner) => {
    if (partner.avatarUrl) return partner.avatarUrl;
    if (partner.profilePicture) return partner.profilePicture;
    if (partner.capturedPhoto) return partner.capturedPhoto;
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
    setActionLoading(true);
    setLoading(true);
    try {
      await approvePartner(actionPartnerId, actionNote);
      fetchPartners(search); // Preserve search term
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
      setActionLoading(false);
    }
  };

  const handleRejectPartner = async () => {
    setActionLoading(true);
    setLoading(true);
    try {
      await rejectPartner(actionPartnerId, actionNote);
      await deletePartner(actionPartnerId);
      fetchPartners(search); // Preserve search term
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

  // Function to filter partners - only applies active search filters
  const getFilteredPartners = () => {
    let filtered = partners;

    // Only apply search filters if search is active
    if (isSearchActive) {
      // Apply active search filters
      const hasActiveFilters = activeSearchFilters.name.trim() || activeSearchFilters.phone.trim();
      if (hasActiveFilters) {
        filtered = filtered.filter((partner) => {
          let matches = true;

          // Filter by name
          if (activeSearchFilters.name.trim()) {
            const name = (partner.name || "").toLowerCase();
            matches = matches && name.includes(activeSearchFilters.name.toLowerCase());
          }

          // Filter by phone
          if (activeSearchFilters.phone.trim()) {
            const phone = (partner.phoneNumber || partner.kyc?.phone || "").replace(/\s+/g, "");
            matches = matches && phone.includes(activeSearchFilters.phone.replace(/\s+/g, ""));
          }

          return matches;
        });
      }
    }

    return filtered;
  };

  // Backend doesn't support search, so we filter on frontend as fallback
  const filteredPartners = getFilteredPartners();

  // When search is active, show all results; otherwise use pagination
  const displayedPartners = isSearchActive ? filteredPartners : filteredPartners;

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
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all transform animate-slide-in ${
          notification.type === "success" ? "bg-green-100 text-green-800 border-l-4 border-green-500" :
          notification.type === "info" ? "bg-blue-100 text-blue-800 border-l-4 border-blue-500" :
          "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}>
          <div className={`p-2 rounded-full ${
            notification.type === "success" ? "bg-green-200" : 
            notification.type === "info" ? "bg-blue-200" : 
            "bg-red-200"
          }`}>
            {notification.type === "success" ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : notification.type === "info" ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
          </div>
          <div className="text-sm sm:text-base">{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 sm:ml-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-blue-900">Partners Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Review and manage partner applications</p>
      </div>

      {/* Search Section */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-xl shadow-sm">
        {/* Active Search Status */}
        {isSearchActive && (activeSearchFilters.name || activeSearchFilters.phone) && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
                <span className="text-sm text-blue-700">
                  Active filters: {[
                    activeSearchFilters.name && `Name: "${activeSearchFilters.name}"`,
                    activeSearchFilters.phone && `Phone: "${activeSearchFilters.phone}"`
                  ].filter(Boolean).join(", ")}
                </span>
            </div>
              <button
                  onClick={handleClearAdvancedSearch}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                  Clear All
              </button>
            </div>
          </div>
        )}
        {/* Search Filters - Always Visible */}
        <div className="space-y-4">
          {/* Search Fields - Name and Phone Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                placeholder="Name ...."
                value={searchFilters.name}
                onChange={e => handleAdvancedSearchInput('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                placeholder="Phone number ...."
                value={searchFilters.phone}
                onChange={e => handleAdvancedSearchInput('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAdvancedSearch}
              disabled={(!searchFilters.name.trim() && !searchFilters.phone.trim()) || searchLoading}
              className={`px-8 py-2 rounded-lg transition-colors font-medium ${
                (searchFilters.name.trim() || searchFilters.phone.trim()) && !searchLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Search
            </button>
          </div>
        </div>
      </div>



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

      {/* Partners Table - Desktop */}
      <div className="hidden lg:block overflow-hidden bg-white rounded-2xl shadow-lg">
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
            {displayedPartners.map((partner) => (
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
                          <div className="p-6 space-y-6">
                            {/* Additional Info */}
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
                                  <div className="flex items-start gap-8">
                                    {partner.profilePicture ? (
                                      <>
                                        <div className="text-center">
                                          <span className="font-medium text-gray-700 mb-2 block">Profile Picture</span>
                                          <img
                                            src={partner.profilePicture}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border shadow cursor-pointer transition-transform hover:scale-105"
                                            onClick={() => {
                                              setModalProfilePic(partner.profilePicture);
                                              setShowProfilePicModal(true);
                                            }}
                                          />
                                        </div>
                                        
                                        {partner.earningPreference === 'video' && partner.capturedPhoto && (
                                          <div className="text-center">
                                            <span className="font-medium text-gray-700 mb-2 block">Captured Image</span>
                                            <img
                                              src={partner.capturedPhoto}
                                              alt="Captured"
                                              className="w-24 h-24 rounded-full object-cover border shadow cursor-pointer transition-transform hover:scale-105"
                                              onClick={() => {
                                                setModalProfilePic(partner.capturedPhoto);
                                                setShowProfilePicModal(true);
                                              }}
                                            />
                                          </div>
                                        )}
                                      </>
                                    ) : partner.capturedPhoto ? (
                                      <div className="text-center">
                                        <span className="font-medium text-gray-700 mb-2 block">Captured Image</span>
                                        <img
                                          src={partner.capturedPhoto}
                                          alt="Captured"
                                          className="w-24 h-24 rounded-full object-cover border shadow cursor-pointer transition-transform hover:scale-105"
                                          onClick={() => {
                                            setModalProfilePic(partner.capturedPhoto);
                                            setShowProfilePicModal(true);
                                          }}
                                        />
                                      </div>
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
                                      {partner.earningPreference === 'video' ? 'Audio Introduction' : 'Audio Introduction'}
                                    </span>
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
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {searchLoading ? (
                <svg className="animate-spin w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : (
                <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              )}
                                    </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchLoading ? "Searching..." : "No partners found"}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
              {search ? (
                <>
                  No partners found for "<strong>{search}</strong>" on page {currentPage}
                  {Math.ceil(totalPartners / partnersPerPage) > 1 && (
                    <span className="block mt-2">
                      Try searching on other pages or modify your search terms
                    </span>
                  )}
                </>
              ) : (
                "There are no partners in the system yet"
              )}
            </p>
            {search && (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <button
                  onClick={() => setSearch("")}
                  className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Clear search
                </button>
                {Math.ceil(totalPartners / partnersPerPage) > 1 && (
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        ← Page {currentPage - 1}
                      </button>
                    )}
                    {currentPage < Math.ceil(totalPartners / partnersPerPage) && (
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        Page {currentPage + 1} →
                      </button>
                                  )}
                                </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Partners Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {displayedPartners.map((partner) => (
          <div key={partner._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-blue-200 shadow-sm">
                    <img
                      src={getAvatarUrl(partner)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm sm:text-base">{getPartnerName(partner)}</h3>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      +91 {partner.phoneNumber || partner.kyc?.phone || 'N/A'}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${partner.status === 'Approved'
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                  : partner.status === 'Rejected'
                    ? 'bg-red-100 text-red-800 ring-1 ring-red-600/20'
                    : 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20'
                  }`}>
                  {partner.status === 'Approved' && (
                    <svg className="mr-1 h-2 w-2 text-green-600" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  )}
                  {partner.status === 'Rejected' && (
                    <svg className="mr-1 h-2 w-2 text-red-600" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  )}
                  {(!partner.status || partner.status === 'Pending') && (
                    <svg className="mr-1 h-2 w-2 text-yellow-600" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  )}
                  {partner.status || "Pending"}
                                        </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4">
              <button
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all text-sm flex items-center justify-center gap-2"
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
                                  </div>

            {/* Expanded Details - Mobile */}
            {expandedPartnerId === partner._id && (
              <div className="border-t border-gray-100 bg-gray-50 animate-slide-down">
                <div className="p-4 space-y-4">
                  {/* Status Actions */}
                  {(!partner.status || partner.status === 'Pending') && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => openApproveModal(partner._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(partner._id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Reject
                      </button>
                                </div>
                  )}

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900 mt-1">{partner.email || 'N/A'}</p>
                                </div>
                    <div className="bg-white p-3 rounded-lg">
                      <span className="font-medium text-gray-600">City:</span>
                      <p className="text-gray-900 mt-1">{partner.city || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <span className="font-medium text-gray-600">State:</span>
                      <p className="text-gray-900 mt-1">{partner.state || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <span className="font-medium text-gray-600">Earning Preference:</span>
                      <p className="text-gray-900 mt-1">{partner.earningPreference || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Expandable sections for full details */}
                  <div className="space-y-2">
                    <details className="bg-white rounded-lg border border-gray-200">
                      <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Additional Information
                      </summary>
                      <div className="p-3 pt-0 space-y-3 text-sm">
                        {/* Profile Pictures */}
                        <div className="flex items-start gap-4">
                          {partner.profilePicture && (
                            <div className="text-center">
                              <span className="font-medium text-gray-600 block mb-1">Profile Picture</span>
                                      <img
                                        src={partner.profilePicture}
                                        alt="Profile"
                                className="w-16 h-16 rounded-lg object-cover cursor-pointer border-2 border-gray-200"
                                        onClick={() => {
                                          setModalProfilePic(partner.profilePicture);
                                          setShowProfilePicModal(true);
                                        }}
                                      />
                            </div>
                          )}
                          {partner.earningPreference === 'video' && partner.capturedPhoto && (
                            <div className="text-center">
                              <span className="font-medium text-gray-600 block mb-1">Captured Image</span>
                              <img
                                src={partner.capturedPhoto}
                                alt="Captured"
                                className="w-16 h-16 rounded-lg object-cover cursor-pointer border-2 border-gray-200"
                                onClick={() => {
                                  setModalProfilePic(partner.capturedPhoto);
                                  setShowProfilePicModal(true);
                                }}
                              />
                                  </div>
                          )}
                                </div>

                        {/* Bio */}
                        {partner.bio && (
                          <div>
                            <span className="font-medium text-gray-600">Bio:</span>
                            <p className="text-gray-900 mt-1 bg-gray-50 p-2 rounded">{partner.bio}</p>
                                </div>
                        )}

                        {/* Languages */}
                        {partner.languages && partner.languages.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-600">Languages:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {partner.languages.map((lang, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  {lang}
                                    </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hobbies */}
                        {partner.hobbies && partner.hobbies.length > 0 && (
                                    <div>
                            <span className="font-medium text-gray-600">Hobbies:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {partner.hobbies.map((hobby, index) => (
                                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                  {hobby}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Audio/Video Introduction */}
                        {partner.audioIntro && (
                          <div>
                            <span className="font-medium text-gray-600">
                              {partner.earningPreference === 'video' ? 'Video Introduction:' : 'Audio Introduction:'}
                            </span>
                                      {partner.earningPreference === 'video' ? (
                                        <video
                                          controls
                                          src={partner.audioIntro}
                                className="mt-1 w-full max-w-xs h-32 rounded border"
                                        />
                                      ) : (
                              <audio controls src={partner.audioIntro} className="mt-1 w-full" />
                                      )}
                                    </div>
                        )}
                                  </div>
                    </details>

                    <details className="bg-white rounded-lg border border-gray-200">
                      <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        PAN Details
                      </summary>
                      <div className="p-3 pt-0 space-y-2 text-sm">
                        {partner.panDetails && Object.keys(partner.panDetails).length > 0 ? (
                          Object.entries(partner.panDetails).map(([key, value]) => (
                            key === "panCard" && value ? (
                              <div key={key} className="flex items-center justify-between">
                                <span className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <button
                                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200 hover:bg-blue-100"
                                  onClick={() => handleShowPanModal(value)}
                                >
                                  View Document
                                </button>
                              </div>
                            ) : (
                              <div key={key}>
                                <span className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <p className="text-gray-900 mt-1">{String(value) || "N/A"}</p>
                              </div>
                            )
                          ))
                        ) : (
                          <p className="text-gray-500 italic">No PAN details available</p>
                                )}
                              </div>
                    </details>

                    <details className="bg-white rounded-lg border border-gray-200">
                      <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                        Bank Details
                      </summary>
                      <div className="p-3 pt-0 space-y-2 text-sm">
                        {partner.bankDetails && Object.keys(partner.bankDetails).length > 0 ? (
                          Object.entries(partner.bankDetails).map(([key, value]) => (
                            key === "cancelCheque" && value ? (
                              <div key={key} className="flex items-center justify-between">
                                <span className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <button
                                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200 hover:bg-blue-100"
                                  onClick={() => handleShowPanModal(value)}
                                >
                                  View Document
                                </button>
                            </div>
                            ) : (
                              <div key={key}>
                                <span className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <p className="text-gray-900 mt-1">{String(value) || "N/A"}</p>
                          </div>
                            )
                          ))
                        ) : (
                          <p className="text-gray-500 italic">No bank details available</p>
                        )}
                        </div>
                    </details>
                      </div>
                </div>
              </div>
                )}
          </div>
            ))}

        {filteredPartners.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl">
            <div className="bg-blue-50 p-4 rounded-full mb-6">
              {searchLoading ? (
                <svg className="animate-spin w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : (
                <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchLoading ? "Searching..." : "No partners found"}
            </h3>
            <p className="text-gray-500 text-center max-w-md text-sm sm:text-base mb-4">
              {search ? (
                <>
                  No partners found for "<strong>{search}</strong>" on page {currentPage}
                  {Math.ceil(totalPartners / partnersPerPage) > 1 && (
                    <span className="block mt-2">
                      Try searching on other pages or modify your search terms
                    </span>
                  )}
                </>
              ) : (
                "There are no partners in the system yet"
              )}
            </p>
            {search && (
              <div className="flex flex-col gap-2 items-center w-full max-w-sm">
              <button
                onClick={() => setSearch("")}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                Clear search
                </button>
                {Math.ceil(totalPartners / partnersPerPage) > 1 && (
                  <div className="flex gap-2 w-full">
                    {currentPage > 1 && (
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                      >
                        ← Page {currentPage - 1}
                      </button>
                    )}
                    {currentPage < Math.ceil(totalPartners / partnersPerPage) && (
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                      >
                        Page {currentPage + 1} →
              </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isSearchActive && (
        <div className="mt-4 sm:mt-6">
          <nav className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
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
            <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 bg-white text-blue-700 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 text-xs sm:text-sm"
            >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(totalPartners / partnersPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current page
                  return page === 1 ||
                    page === Math.ceil(totalPartners / partnersPerPage) ||
                    Math.abs(page - currentPage) <= 1;
                })
                  .slice(0, 7) // Show up to 7 pages
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <Fragment key={`ellipsis-${page}`}>
                          <span className="px-1 sm:px-2 text-xs sm:text-sm">...</span>
                        <button
                          onClick={() => setCurrentPage(page)}
                            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm min-w-[32px] ${currentPage === page
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
                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm min-w-[32px] ${currentPage === page
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
                className="px-2 sm:px-3 py-1 bg-white text-blue-700 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 text-xs sm:text-sm"
            >
              Next
            </button>
          </div>
        </nav>
      </div>
      )}
      
      {/* Search Results Summary */}
      {isSearchActive && (
        <div className="mt-4 sm:mt-6 text-center">
          <div className="text-xs sm:text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">{displayedPartners.length}</span>{" "}
            search results (all matching partners displayed)
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-green-50 px-4 sm:px-6 py-4 border-b border-green-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-green-800 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Approve Partner
                </h3>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4">
              <p className="text-gray-700 mb-4 text-sm sm:text-base">
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
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-red-50 px-4 sm:px-6 py-4 border-b border-red-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-red-800 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Reject Partner
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4">
              <p className="text-gray-700 mb-4 text-sm sm:text-base">
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
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-colors"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPartner}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
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
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
              <h3 className="font-semibold text-base sm:text-lg">Document Viewer</h3>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={handleClosePanModal}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="bg-gray-100 p-2 sm:p-4 flex items-center justify-center flex-1 overflow-hidden">
              <img src={modalPanCard} alt="Document" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="p-3 sm:p-4 flex justify-end flex-shrink-0">
              <button
                className="px-3 sm:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] animate-fade-in p-4" onClick={() => setShowProfilePicModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-3 sm:p-4 max-w-2xl w-full flex flex-col items-center relative animate-zoom-in max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl sm:text-2xl z-10"
              onClick={() => setShowProfilePicModal(false)}
            >
              &times;
            </button>
            <img src={modalProfilePic} alt="Profile Zoomed" className="max-w-full max-h-[80vh] rounded-xl transition-all object-contain" />
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
        
        @keyframes slide-down {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
            max-height: 0;
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
            max-height: 1000px;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
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