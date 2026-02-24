import { useState, useEffect, useMemo, useRef } from 'react';
import { FaPlus, FaTrash, FaEdit, FaGlobe, FaUpload, FaLink, FaSearch, FaTimes } from 'react-icons/fa';
import { useApi, baseUrl } from 'coffeebreak';
import { useNotification, useMedia } from 'coffeebreak/contexts';

function Modal({ isOpen, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);
  return (
    <dialog ref={ref} className="modal rounded-md" onClose={onClose} onCancel={(e) => e.preventDefault()}>
      <div className="modal-box max-w-2xl">
        <div className="mb-6"><h3 className="font-bold text-lg">{title}</h3></div>
        <button className="btn absolute right-2 top-2" onClick={onClose} aria-label="Close">✕</button>
        <div className="mt-4">{children}</div>
      </div>
      <button className="modal-backdrop" onClick={onClose} aria-label="Close modal" />
    </dialog>
  );
}

const API_ENDPOINTS = {
  LEVELS: `${baseUrl}/sponsors-promotion-plugin/sponsors/levels`,
  SPONSORS: `${baseUrl}/sponsors-promotion-plugin/sponsors`
};

// Custom hook for sponsor form handling
const useSponsorForm = (initialLevelId = 0) => {
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    description: '',
    level_id: initialLevelId
  });
  const [logoInputType, setLogoInputType] = useState('url');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoMediaRef = useRef(null);
  const { showNotification } = useNotification();
  const { getMediaUrl } = useMedia();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSponsorForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Update logo preview when logo_url changes
    if (name === 'logo_url') {
      setLogoPreview(value);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification("File size should be less than 5MB", "error");
        return;
      }

      if (!file.type.startsWith('image/')) {
        showNotification("Please upload an image file", "error");
        return;
      }

      setLogoFile(file);
      logoMediaRef.current = file;
      setLogoPreview(URL.createObjectURL(file));
      setSponsorForm(prev => ({
        ...prev,
        logo_url: '' // Clear URL when file is selected
      }));
    }
  };

  const resetLogoState = () => {
    logoMediaRef.current = null;
    setLogoInputType('url');
    setSponsorForm(prev => ({
      ...prev,
      logo_url: ''
    }));
  };

  const resetForm = (newLevelId = initialLevelId) => {
    setSponsorForm({
      name: '',
      logo_url: '',
      website_url: '',
      description: '',
      level_id: newLevelId
    });
    logoMediaRef.current = null;
    setLogoFile(null);
    setLogoPreview(null);
    setLogoInputType('url');
  };

  const setFormData = (data) => {
    setSponsorForm({
      name: data.name,
      logo_url: data.logo_url && !data.logo_url.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? data.logo_url : '',
      website_url: data.website_url || '',
      description: data.description || '',
      level_id: data.level_id
    });
    if (data.logo_url) {
      // If it's a UUID (media), use getMediaUrl
      if (data.logo_url.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        setLogoPreview(getMediaUrl(data.logo_url));
        setLogoInputType('file'); // Set to file input type when it's a UUID
      } else {
        setLogoPreview(data.logo_url);
        setLogoInputType('url'); // Set to URL input type when it's a regular URL
      }
    }
  };

  return {
    sponsorForm,
    logoInputType,
    logoFile,
    logoPreview,
    logoMediaRef,
    handleInputChange,
    handleLogoFileChange,
    resetLogoState,
    resetForm,
    setFormData,
    setLogoInputType
  };
};

// Change from default export to named export
export function Sponsors() {
  // State management
  const [sponsors, setSponsors] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState({
    sponsors: false,
    levels: false
  });
  const [error, setError] = useState(null);
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [isAddingSponsor, setIsAddingSponsor] = useState(false);
  const [isEditingSponsor, setIsEditingSponsor] = useState(false);
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const api = useApi();
  const { showNotification } = useNotification();
  const { getMediaUrl, uploadMedia } = useMedia();

  // Use the custom hook for sponsor form handling
  const {
    sponsorForm,
    logoInputType,
    logoFile,
    logoPreview,
    handleInputChange,
    handleLogoFileChange,
    resetLogoState,
    resetForm,
    setFormData,
    setLogoInputType
  } = useSponsorForm(levels.length > 0 ? levels[0].id : 0);

  useEffect(() => {
    fetchLevels();
    fetchSponsors();
  }, []);

  // Fetch levels from API
  const fetchLevels = async () => {
    setIsLoading(prev => ({ ...prev, levels: true }));
    setError(null);

    try {
      const response = await api.get(`${API_ENDPOINTS.LEVELS}/`);

      if (Array.isArray(response.data)) {
        setLevels(response.data);
      } else {
        console.error("Unexpected API response structure for levels:", response.data);
        setLevels([]);
      }
    } catch (err) {
      console.error("Error fetching levels:", err);

      if (err.response) {
        console.error("API Error Details:", {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
      }

      setError("Failed to load sponsor levels");
      showNotification("Failed to load sponsor levels", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, levels: false }));
    }
  };

  // Fetch sponsors from API
  const fetchSponsors = async () => {
    setIsLoading(prev => ({ ...prev, sponsors: true }));
    setError(null);

    try {
      const response = await api.get(`${API_ENDPOINTS.SPONSORS}/`);

      if (Array.isArray(response.data)) {
        setSponsors(response.data);
      } else {
        console.error("Unexpected API response structure for sponsors:", response.data);
        setSponsors([]);
      }
    } catch (err) {
      console.error("Error fetching sponsors:", err);

      if (err.response) {
        console.error("API Error Details:", {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
      }

      setError("Failed to load sponsors");
      showNotification("Failed to load sponsors", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, sponsors: false }));
    }
  };

  // Add new level
  const handleAddLevel = async () => {
    if (!newLevelName.trim()) {
      showNotification("Level name cannot be empty", "error");
      return;
    }

    setIsLoading(prev => ({ ...prev, levels: true }));
    try {
      const response = await api.post(`${API_ENDPOINTS.LEVELS}/`, {
        name: newLevelName
      });

      setLevels(prevLevels => [...prevLevels, response.data]);
      showNotification(`Level "${newLevelName}" created successfully`, "success");
      setNewLevelName('');
      setIsAddingLevel(false);
    } catch (err) {
      console.error("Error creating level:", err);
      showNotification("Failed to create sponsor level", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, levels: false }));
    }
  };

  // Handle edit level
  const handleEditLevel = async () => {
    if (!editingLevel?.name.trim()) {
      showNotification("Level name cannot be empty", "error");
      return;
    }

    setIsLoading(prev => ({ ...prev, levels: true }));
    try {
      const response = await api.put(
        `${API_ENDPOINTS.LEVELS}/${editingLevel.id}`,
        { name: editingLevel.name }
      );

      setLevels(prevLevels =>
        prevLevels.map(level =>
          level.id === editingLevel.id ? response.data : level
        )
      );
      showNotification(`Level "${editingLevel.name}" updated successfully`, "success");
      setIsEditingLevel(false);
      setEditingLevel(null);
    } catch (err) {
      console.error("Error updating level:", err);
      showNotification("Failed to update sponsor level", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, levels: false }));
    }
  };

  // Edit sponsor - populate form with existing sponsor data
  const handleEditSponsor = (sponsor) => {
    setFormData(sponsor);
    setSelectedSponsor(sponsor);
    setIsEditingSponsor(true);
  };

  // Start editing level
  const startEditingLevel = (level) => {
    setEditingLevel(level);
    setIsEditingLevel(true);
  };

  // Filter sponsors based on search query
  const filteredSponsorsByLevel = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return levels.map(level => ({
      ...level,
      sponsors: sponsors
        .filter(sponsor => sponsor.level_id === level.id)
        .filter(sponsor =>
          !query ||
          sponsor.name.toLowerCase().includes(query) ||
          sponsor.description?.toLowerCase().includes(query) ||
          sponsor.website_url?.toLowerCase().includes(query)
        )
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort sponsors by name
    }));
  }, [sponsors, levels, searchQuery]);

  // Helper function to get the correct logo URL
  const getLogoUrl = (url) => {
    if (!url) return '';
    // If it's already a full URL, return as is
    if (url.startsWith('http')) return url;
    // If it's a UUID (media), use getMediaUrl
    if (url.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return getMediaUrl(url);
    }
    // Otherwise, assume it's a relative path and prepend baseUrl
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Modify handleAddSponsor to handle file upload
  const handleAddSponsor = async () => {
    if (!sponsorForm.name.trim()) {
      showNotification("Sponsor name cannot be empty", "error");
      return;
    }

    if (!sponsorForm.level_id) {
      showNotification("Please select a sponsor level", "error");
      return;
    }

    setIsLoading(prev => ({ ...prev, sponsors: true }));
    try {
      const response = await api.post(`${API_ENDPOINTS.SPONSORS}/`, {
        ...sponsorForm,
        logo_url: logoInputType === 'file' ? '' : sponsorForm.logo_url
      });

      if (logoInputType === 'file' && logoFile && response.data.logo_url) {
        await uploadMedia(response.data.logo_url, logoFile);
      }

      const updatedSponsor = {
        ...response.data,
        logo_url: getLogoUrl(response.data.logo_url)
      };

      setSponsors(prevSponsors => [...prevSponsors, updatedSponsor]);
      showNotification(`Sponsor "${sponsorForm.name}" created successfully`, "success");
      resetForm();
      setIsAddingSponsor(false);
    } catch (err) {
      console.error("Error creating sponsor:", err);
      showNotification("Failed to create sponsor", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, sponsors: false }));
    }
  };

  // Update existing sponsor
  const handleUpdateSponsor = async () => {
    if (!sponsorForm.name.trim()) {
      showNotification("Sponsor name cannot be empty", "error");
      return;
    }

    setIsLoading(prev => ({ ...prev, sponsors: true }));
    try {
      const response = await api.put(
        `${API_ENDPOINTS.SPONSORS}/${selectedSponsor.id}`,
        {
          ...sponsorForm,
          logo_url: logoInputType === 'file' ? '' : sponsorForm.logo_url
        }
      );

      if (logoInputType === 'file' && logoFile && response.data.logo_url) {
        await uploadMedia(response.data.logo_url, logoFile);
      }

      const updatedSponsor = {
        ...response.data,
        logo_url: getLogoUrl(response.data.logo_url)
      };

      setSponsors(prevSponsors =>
        prevSponsors.map(sponsor =>
          sponsor.id === selectedSponsor.id ? updatedSponsor : sponsor
        )
      );

      showNotification(`Sponsor "${sponsorForm.name}" updated successfully`, "success");
      resetForm();
      setIsEditingSponsor(false);
      setSelectedSponsor(null);
    } catch (err) {
      console.error("Error updating sponsor:", err);
      showNotification("Failed to update sponsor", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, sponsors: false }));
    }
  };

  // Delete sponsor
  const handleDeleteSponsor = async (sponsorId) => {
    if (!window.confirm("Are you sure you want to delete this sponsor?")) {
      return;
    }

    setIsLoading(prev => ({ ...prev, sponsors: true }));
    try {
      await api.delete(`${API_ENDPOINTS.SPONSORS}/${sponsorId}`);
      setSponsors(prevSponsors => prevSponsors.filter(sponsor => sponsor.id !== sponsorId));
      showNotification("Sponsor deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting sponsor:", err);
      showNotification("Failed to delete sponsor", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, sponsors: false }));
    }
  };

  // Delete level
  const handleDeleteLevel = async (levelId) => {
    if (!window.confirm("Are you sure you want to delete this level? This action cannot be undone.")) {
      return;
    }

    setIsLoading(prev => ({ ...prev, levels: true }));
    try {
      await api.delete(`${API_ENDPOINTS.LEVELS}/${levelId}`);
      setLevels(prevLevels => prevLevels.filter(level => level.id !== levelId));
      showNotification("Level deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting level:", err);
      showNotification("Failed to delete level", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, levels: false }));
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold my-8">Sponsors Management</h1>

      {/* Level Section */}
      <div className="mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Sponsor Levels</h2>
          <button
            className="btn btn-primary rounded-xl w-full sm:w-auto"
            onClick={() => {
              setEditingLevel(null);
              setIsAddingLevel(true);
            }}
          >
            <FaPlus className="mr-2" /> Add Level
          </button>
        </div>

        {isLoading.levels ? (
          <div className="flex justify-center my-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {levels.length === 0 ? (
              <div className="text-center py-8 bg-base-200 rounded-lg">
                <p className="text-lg text-gray-500">No sponsor levels found</p>
                <p className="text-sm text-gray-400">Create your first sponsor level to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Level Name</th>
                      <th>Sponsors Count</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level) => {
                      const sponsorCount = sponsors.filter(s => s.level_id === level.id).length;
                      return (
                        <tr key={level.id}>
                          <td className="font-medium">{level.name}</td>
                          <td>{sponsorCount}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => startEditingLevel(level)}
                                title="Edit level"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-error btn-sm"
                                onClick={() => handleDeleteLevel(level.id)}
                                disabled={sponsorCount > 0}
                                title={sponsorCount > 0 ? "Cannot delete levels with sponsors" : "Delete level"}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sponsors Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Sponsors</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <input
                type="text"
                placeholder="Search sponsors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-8 pr-8"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Add Sponsor Button */}
            <button
              className="btn btn-primary rounded-xl w-full sm:w-auto"
              onClick={() => {
                if (levels.length === 0) {
                  showNotification("Please create at least one level first", "warning");
                  return;
                }
                setSelectedSponsor(null);
                setIsAddingSponsor(true);
              }}
            >
              <FaPlus className="mr-2" /> Add Sponsor
            </button>
          </div>
        </div>

        {isLoading.sponsors ? (
          <div className="flex justify-center my-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {sponsors.length === 0 ? (
              <div className="text-center py-8 bg-base-200 rounded-lg">
                <p className="text-lg text-gray-500">No sponsors found</p>
                <p className="text-sm text-gray-400">Add your first sponsor to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSponsorsByLevel.map(level => (
                  <div key={level.id} className="bg-base-200 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-primary">{level.name}</h3>

                    {level.sponsors.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">
                        {searchQuery
                          ? "No sponsors match your search"
                          : "No sponsors in this level"
                        }
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {level.sponsors.map(sponsor => (
                          <div
                            key={sponsor.id}
                            className="bg-base-100 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                          >
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold group-hover:text-primary transition-colors duration-300">{sponsor.name}</h4>
                                <div className="flex gap-1 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    className="btn btn-sm btn-ghost hover:bg-base-300 transition-colors duration-300"
                                    onClick={() => handleEditSponsor(sponsor)}
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-ghost text-error hover:bg-error/10 transition-colors duration-300"
                                    onClick={() => handleDeleteSponsor(sponsor.id)}
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>

                              {sponsor.logo_url && (
                                <div className="h-20 flex items-center justify-center rounded mb-3 transition-transform duration-300 hover:scale-105">
                                  <img
                                    src={getLogoUrl(sponsor.logo_url)}
                                    alt={`${sponsor.name} logo`}
                                    className="max-h-16 max-w-full object-contain"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://placehold.co/200x100?text=Logo+Not+Available";
                                    }}
                                  />
                                </div>
                              )}

                              {sponsor.description && (
                                <p className="text-sm mb-3 text-gray-600 line-clamp-2 transition-colors duration-300 hover:text-gray-800">
                                  {sponsor.description}
                                </p>
                              )}

                              {sponsor.website_url && (
                                <a
                                  href={sponsor.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-primary flex items-center gap-1 transition-colors duration-300 hover:text-primary-focus"
                                >
                                  <FaGlobe className="w-3 h-3" />
                                  Visit Website
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Level Modal */}
      <Modal
        isOpen={isAddingLevel || isEditingLevel}
        onClose={() => {
          setIsAddingLevel(false);
          setIsEditingLevel(false);
          setEditingLevel(null);
          setNewLevelName('');
        }}
        title={isEditingLevel ? "Edit Level" : "Add Level"}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (isEditingLevel) {
            handleEditLevel();
          } else {
            handleAddLevel();
          }
        }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="levelName">
              Level Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="levelName"
              value={isEditingLevel ? editingLevel?.name : newLevelName}
              onChange={(e) => {
                if (isEditingLevel) {
                  setEditingLevel(prev => ({ ...prev, name: e.target.value }));
                } else {
                  setNewLevelName(e.target.value);
                }
              }}
              placeholder="Enter level name"
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setIsAddingLevel(false);
                setIsEditingLevel(false);
                setEditingLevel(null);
                setNewLevelName('');
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isEditingLevel ? !editingLevel?.name.trim() : !newLevelName.trim()}
            >
              {isEditingLevel ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Sponsor Modal */}
      <Modal
        isOpen={isAddingSponsor || isEditingSponsor}
        onClose={() => {
          setIsAddingSponsor(false);
          setIsEditingSponsor(false);
          setSelectedSponsor(null);
          resetForm();
        }}
        title={isEditingSponsor ? "Edit Sponsor" : "Add New Sponsor"}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          if (isEditingSponsor) {
            handleUpdateSponsor();
          } else {
            handleAddSponsor();
          }
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={sponsorForm.name}
                onChange={handleInputChange}
                placeholder="Sponsor name"
                className="input input-bordered w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="level_id">
                Level <span className="text-red-500">*</span>
              </label>
              <select
                name="level_id"
                id="level_id"
                value={sponsorForm.level_id || ''}
                onChange={handleInputChange}
                className="select select-bordered w-full"
                required
              >
                <option value="" disabled>Select a level</option>
                {levels.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="website_url">
                Website URL
              </label>
              <input
                type="url"
                name="website_url"
                id="website_url"
                value={sponsorForm.website_url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="logo">
                Logo
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`btn btn-sm flex-1 ${logoInputType === 'url' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      setLogoInputType('url');
                      resetLogoState();
                    }}
                  >
                    <FaLink className="mr-1" /> URL
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm flex-1 ${logoInputType === 'file' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      setLogoInputType('file');
                      setSponsorForm(prev => ({ ...prev, logo_url: '' }));
                    }}
                  >
                    <FaUpload className="mr-1" /> Upload
                  </button>
                </div>

                {logoInputType === 'url' ? (
                  <input
                    type="url"
                    name="logo_url"
                    id="logo_url"
                    value={sponsorForm.logo_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    className="input input-bordered w-full"
                  />
                ) : (
                  <input
                    type="file"
                    name="logo"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="file-input file-input-bordered w-full"
                  />
                )}

                {(sponsorForm.logo_url || logoPreview) && (
                  <div className="mt-2">
                    <img
                      src={logoPreview || sponsorForm.logo_url}
                      alt="Logo preview"
                      className="h-16 object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/200x100?text=Invalid+Image";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                value={sponsorForm.description}
                onChange={handleInputChange}
                placeholder="Describe the sponsor"
                className="textarea textarea-bordered w-full h-24"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setIsAddingSponsor(false);
                setIsEditingSponsor(false);
                setSelectedSponsor(null);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!sponsorForm.name.trim() || !sponsorForm.level_id}
            >
              {isEditingSponsor ? "Update" : "Save"} Sponsor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Sponsors;
