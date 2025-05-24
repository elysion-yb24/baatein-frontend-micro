"use client";
import { useEffect, useState } from "react";

export default function PartnerDetailsPage({ params }) {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPanModal, setShowPanModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [filePreviews, setFilePreviews] = useState({});

  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`https://battein-onboard-brown.vercel.app/api/partners/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const p = data.partner || data;
        setPartner(p);
        setForm({
          name: p.name || "",
          kyc: {
            panNumber: p.kyc?.panNumber || "",
            panCardFile: p.kyc?.panCardFile || "",
            status: p.kyc?.status || "Pending",
          },
          profilePicture: p.profilePicture || "",
          bankDetails: { ...p.bankDetails },
          spokenLanguage: p.spokenLanguage || [],
          hobby: p.hobby || "",
          bio: p.bio || "",
          audioIntro: p.audioIntro || "",
        });
        setFilePreviews({
          profilePicture: p.profilePicture || "",
          panCardFile: p.kyc?.panCardFile || "",
          audioIntro: p.audioIntro || "",
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch partner details");
        setLoading(false);
      });
  }, [id]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleKycInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, kyc: { ...prev.kyc, [name]: value } }));
  };

  const handleBankInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, [name]: value } }));
  };

  const handleLanguagesInput = (e) => {
    setForm((prev) => ({ ...prev, spokenLanguages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }));
  };

  const handleHobbiesInput = (e) => {
    setForm((prev) => ({ ...prev, hobbies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }));
  };

  const handleFile = (e, field, nested) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilePreviews((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
    if (nested) {
      setForm((prev) => ({ ...prev, [nested]: { ...prev[nested], [field]: file } }));
    } else {
      setForm((prev) => ({ ...prev, [field]: file }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("bio", form.bio);
      formData.append("hobby", form.hobby);
      formData.append("spokenLanguage", JSON.stringify(form.spokenLanguage));
      // Hobbies
      formData.append("hobbies", JSON.stringify(form.hobbies));
      // KYC
      formData.append("kyc[panNumber]", form.kyc.panNumber);
      formData.append("kyc[status]", form.kyc.status);
      if (form.kyc.panCardFile instanceof File) {
        formData.append("kyc[panCardFile]", form.kyc.panCardFile);
      }
      // Profile Picture
      if (form.profilePicture instanceof File) {
        formData.append("profilePicture", form.profilePicture);
      }
      // Audio
      if (form.audioIntro instanceof File) {
        formData.append("audioIntro", form.audioIntro);
      }
      // Bank Details
      Object.entries(form.bankDetails).forEach(([key, value]) => {
        formData.append(`bankDetails[${key}]`, value);
      });
      // PATCH request
      const res = await fetch(`https://battein-onboard-brown.vercel.app/api/partners/${id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update partner");
      setSuccessMsg("Partner updated successfully!");
      setSaving(false);
    } catch (err) {
      setError(err.message || "Failed to update partner");
      setSaving(false);
    }
  };

  if (loading) return <div>Loading partner details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!form) return <div>No partner found.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Edit Partner Details</h1>
      {successMsg && <div className="mb-4 text-green-600 font-semibold">{successMsg}</div>}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Name */}
        <div>
          <label className="font-semibold">Name:</label>
          <input type="text" name="name" value={form.name} onChange={handleInput} className="block w-full border rounded px-3 py-2 mt-1" />
        </div>
        {/* KYC */}
        <div>
          <label className="font-semibold">PAN Card Number:</label>
          <input type="text" name="panNumber" value={form.kyc.panNumber} onChange={handleKycInput} className="block w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="font-semibold">PAN Card Image:</label>
          {filePreviews.panCardFile && (
            <img src={filePreviews.panCardFile} alt="PAN Card" className="w-40 h-24 object-contain border rounded mb-2" />
          )}
          <input type="file" accept="image/*" onChange={e => handleFile(e, "panCardFile", "kyc")} />
        </div>
        <div>
          <label className="font-semibold">KYC Status:</label>
          <select name="status" value={form.kyc.status} onChange={handleKycInput} className="block w-full border rounded px-3 py-2 mt-1">
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        {/* Profile Picture */}
        <div>
          <label className="font-semibold">Profile Picture:</label>
          {filePreviews.profilePicture && (
            <img src={filePreviews.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border mb-2" />
          )}
          <input type="file" accept="image/*" onChange={e => handleFile(e, "profilePicture")} />
        </div>
        {/* Bank Details */}
        <div>
          <label className="font-semibold">Bank Details:</label>
          {Object.entries(form.bankDetails).map(([key, value]) => (
            <div key={key} className="mb-1">
              <span className="capitalize">{key}:</span>
              <input type="text" name={key} value={value} onChange={handleBankInput} className="ml-2 border rounded px-2 py-1" />
            </div>
          ))}
        </div>
        {/* Status (KYC status above) */}
        {/* Spoken Languages */}
        <div>
          <label className="font-semibold">Spoken Languages (comma separated):</label>
          <input type="text" value={Array.isArray(form.spokenLanguage) ? form.spokenLanguage.join(", ") : form.spokenLanguage || ""} onChange={handleLanguagesInput} className="block w-full border rounded px-3 py-2 mt-1" />
        </div>
        {/* Hobby */}
        <div>
          <label className="font-semibold">Hobbies (comma separated):</label>
          <input type="text" name="hobbies" value={Array.isArray(form.hobbies) ? form.hobbies.join(", ") : form.hobbies || ""} onChange={handleHobbiesInput} className="block w-full border rounded px-3 py-2 mt-1" />
        </div>
        {/* Bio */}
        <div>
          <label className="font-semibold">Bio:</label>
          <textarea name="bio" value={form.bio} onChange={handleInput} className="block w-full border rounded px-3 py-2 mt-1" />
        </div>
        {/* Audio Intro */}
        <div>
          <label className="font-semibold">Audio Intro:</label>
          {filePreviews.audioIntro && (
            <audio controls src={filePreviews.audioIntro} className="block mb-2" />
          )}
          <input type="file" accept="audio/*" onChange={e => handleFile(e, "audioIntro")} />
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
