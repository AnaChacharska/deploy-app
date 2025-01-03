import { useState, useMemo, useEffect, useContext } from "react";
import { useModal, useDarkMode } from "../hooks/useModal"; // Custom hooks for managing modal and dark mode
import Card from "../components/Card"; // Reusable Card component to display data
import styles from "./Home.module.css"; // CSS module for styling
import axios from "axios";
import { GlobalContext } from "../contexts/GlobalContext";

export default function Home({ leavesData }) {
    const {leaves, setLeaves} = useContext(GlobalContext);
    const [error, setError] = useState("");

    // State to manage UI-specific details like search, pagination, and modal
    const [uiState, setUiState] = useState({
        searchQuery: "",
        currentPage: 1,
        modalState: {
            isEditing: false,
            successMessage: "",
            deleteRecord: null,
            isDeleteModalOpen: false,
        },
    });
    // In-memory cache for API responses
    const cache = {};

    // Fetch data from Xano on component mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const page = parseInt(urlParams.get('page'), 10) || 1;
        setUiState((prevState) => ({
            ...prevState,
            currentPage: page,
        }));

        if (leaves.length === 0 && leavesData.length > 0) {
            setLeaves(leavesData);
        } else if (leaves.length === 0) {
            const fetchAllLeaves = async () => {
                let allLeaves = [];
                let page = 1;
                const offset = 0;
                const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                const fetchPage = async (page, retries = 5, delayMs = 1000) => {
                    if (cache[page]) {
                        return cache[page];
                    }
                    try {
                        const response = await axios.get(
                            "https://x8ki-letl-twmt.n7.xano.io/api:WVrFdUAc/cassandra_leaves",
                            {
                                params: {
                                    page_number: page,
                                    offset: offset,
                                },
                            }
                        );

                        const items = response.data.items;
                        cache[page] = items;
                        return items;
                    } catch (error) {
                        if (error.response && error.response.status === 429 && retries > 0) {
                            console.warn(`Rate limit exceeded. Retrying in ${delayMs}ms...`);
                            await delay(delayMs);
                            return await fetchPage(page, retries - 1, delayMs * 2); // Exponential backoff
                        } else {
                            setError("Error fetching data");
                            console.error("Error fetching data from Xano:", error);
                            return [];
                        }
                    }
                };

                try {
                    while (true) {
                        const items = await fetchPage(page);
                        if (items.length === 0) break;
                        allLeaves = [...allLeaves, ...items];
                        setLeaves(allLeaves);
                        await delay(1000);
                        page++;
                    }
                } catch (error) {
                    setError(error.message);
                }
            };
            fetchAllLeaves();
        }
    }, [leavesData, leaves, setLeaves]);

    // State to manage the form fields for adding or editing records
    const [formState, setFormState] = useState({
        id: "",
        created_at: "",
        content: "",
        domain_name: "",
        http_status: "",
        language: "",
        last_sourced_from_wallabag: "",
        mimetype: "",
        preview_picture: null,
        published_by: "",
        tags: [],
        title: "",
        updated_at: "",
        url: "",
        user_email: "",
        user_id: "",
        user_name: "",
        wallabag_created_at: "",
        wallabag_is_archived: false,
        wallabag_updated_at: "",
    });

    // Custom hook to manage dark mode functionality
    const {isDarkMode, toggleDarkMode} = useDarkMode();

    // Custom hook to manage the modal state for adding/editing records
    const {isModalOpen, openModal, closeModal} = useModal();

    // Custom hook to manage the modal state for delete confirmation
    const {isModalOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal} = useModal();

    // Pagination settings
    const itemsPerPage = 16;

    // Memoized value to filter the leaves data based on the search query
    const filteredData = useMemo(() => {
        return (leaves || []).filter((item) =>
            item.title.toLowerCase().includes(uiState.searchQuery.toLowerCase())
        );
    }, [leaves, uiState.searchQuery]);

    // Calculate the total number of pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Slice the data to show only the records for the current page
    const startIndex = (uiState.currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Handles updating the search query and resets pagination
    const handleSearch = (query) => {
        setUiState((prevState) => ({
            ...prevState,
            searchQuery: query,
            currentPage: 1, // Reset to the first page on new search
        }));
        sessionStorage.setItem('currentPage', 1);
    };

    const handlePageChange = (newPage) => {
        setUiState((prevState) => ({
            ...prevState,
            currentPage: newPage,
        }));
        sessionStorage.setItem('currentPage', newPage);
    };

    const handleGoUp = () => {
        window.scrollTo({top: 0, behavior: "smooth"});
    };

    // Handles changes in form input fields
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    // Adds a new record to the list
    const handleAddRecord = async () => {
        if (!formState.title || !formState.domain_name) {
            alert("Please fill out all fields.");
            return;
        }

        const newRecord = {
            title: formState.title,
            domain_name: formState.domain_name,
            content: formState.content,
            http_status: formState.http_status,
            language: formState.language,
            last_sourced_from_wallabag: formState.last_sourced_from_wallabag,
            mimetype: formState.mimetype,
            preview_picture: formState.preview_picture,
            published_by: formState.published_by,
            tags: formState.tags,
            updated_at: formState.updated_at,
            url: formState.url,
            user_email: formState.user_email,
            user_id: formState.user_id,
            user_name: formState.user_name,
            wallabag_created_at: formState.wallabag_created_at,
            wallabag_is_archived: formState.wallabag_is_archived,
            wallabag_updated_at: formState.wallabag_updated_at,
        };

        try {
            const response = await axios.post("https://x8ki-letl-twmt.n7.xano.io/api:WVrFdUAc/cassandra_leaves", newRecord);
            if (response.status === 200) {
                const addedRecord = response.data;
                setLeaves((prevLeaves) => [addedRecord, ...prevLeaves]); // Add the new record to the top of the list
                setFormState({
                    content: "",
                    domain_name: "",
                    http_status: "",
                    language: "",
                    last_sourced_from_wallabag: "",
                    mimetype: "",
                    preview_picture: "",
                    published_by: "",
                    tags: [],
                    title: "",
                    updated_at: "",
                    url: "",
                    user_email: "",
                    user_id: "",
                    user_name: "",
                    wallabag_created_at: "",
                    wallabag_is_archived: "",
                    wallabag_updated_at: "",
                }); // Reset the form state
                closeModal(); // Close the modal
                setUiState((prevState) => ({
                    ...prevState,
                    modalState: { ...prevState.modalState, successMessage: "Record added successfully!" },
                }));

                // Clear the success message after 3 seconds
                setTimeout(() => {
                    setUiState((prevState) => ({
                        ...prevState,
                        modalState: { ...prevState.modalState, successMessage: "" },
                    }));
                }, 3000);
            } else {
                console.error("Failed to add record to Xano");
            }
        } catch (error) {
            console.error("Error adding record to Xano:", error);
        }
    };
    const editRecordInXano = async (recordId, updatedData) => {
        try {
            const url = `https://x8ki-letl-twmt.n7.xano.io/api:WVrFdUAc/cassandra_leaves/${recordId}`;
            console.log(`Updating record at URL: ${url}`);
            console.log(`Record ID: ${recordId}`);
            console.log(`Updated Data:`, updatedData);
            const response = await axios.patch(url, updatedData);
            if (response.status === 200) {
                console.log('Record updated successfully in Xano');
            } else {
                console.error('Failed to update record in Xano');
            }
        } catch (error) {
            console.error('Error updating record in Xano:', error);
        }
    };

// Prepares the form state for editing an existing record
    const handleEdit = (record) => {
        setFormState(record); // Set the form state with the record's data
        setUiState((prevState) => ({
            ...prevState,
            modalState: {
                ...prevState.modalState,
                isEditing: true,
            },
        }));
        openModal(); // Open the modal
    };

// Updates the existing record in the list
    const handleUpdateRecord = async () => {
        try {
            // Update the record in Xano first
            await editRecordInXano(formState.id, formState);

            // If successful, update the local state
            const updatedLeaves = leaves.map((item) =>
                item.id === formState.id ? formState : item
            );
            setLeaves(updatedLeaves);

            // Reset the form state
            setFormState({
                id: "",
                created_at: "",
                content: "",
                domain_name: "",
                http_status: "",
                language: "",
                last_sourced_from_wallabag: "",
                mimetype: "",
                preview_picture: null,
                published_by: "",
                tags: [],
                title: "",
                updated_at: "",
                url: "",
                user_email: "",
                user_id: "",
                user_name: "",
                wallabag_created_at: "",
                wallabag_is_archived: false,
                wallabag_updated_at: "",
            });

            // Close the modal and show success message
            closeModal();
            setUiState((prevState) => ({
                ...prevState,
                modalState: {
                    ...prevState.modalState,
                    isEditing: false,
                    successMessage: "Record updated successfully!",
                },
            }));

            // Clear the success message after 3 seconds
            setTimeout(() => {
                setUiState((prevState) => ({
                    ...prevState,
                    modalState: { ...prevState.modalState, successMessage: "" },
                }));
            }, 3000);
        } catch (error) {
            console.error("Error updating record in Xano:", error);
            alert("Failed to update record. Please try again.");
        }
    };

        // Opens the delete confirmation modal
        const handleDelete = (id) => {
            setUiState((prevState) => ({
                ...prevState,
                modalState: {...prevState.modalState, deleteRecord: id},
            }));
            openDeleteModal(); // Open the delete confirmation modal
        };

    const deleteRecordFromXano = async (recordId) => {
        try {
            const url = `https://x8ki-letl-twmt.n7.xano.io/api:WVrFdUAc/cassandra_leaves/${recordId}`;
            const response = await axios.delete(url);
            if (response.status === 200) {
                console.log('Record deleted successfully from Xano');
            } else {
                console.error('Failed to delete record from Xano');
            }
        } catch (error) {
            console.error('Error deleting record from Xano:', error);
        }
    };

    const confirmDelete = async () => {
        const recordId = uiState.modalState.deleteRecord;
        await deleteRecordFromXano(recordId); // Delete the record from Xano
        const updatedLeaves = leaves.filter((item) => item.id !== recordId);
        setLeaves(updatedLeaves); // Remove the record from the list
        closeDeleteModal(); // Close the delete confirmation modal
        alert("Record deleted successfully.");
    };

        return (
            <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
                <h1 className={styles.title}>Cassandra Leaves Dashboard</h1>

                {/* Display success message */}
                {uiState.modalState.successMessage && (
                    <div className={styles.successMessage}>{uiState.modalState.successMessage}</div>
                )}

                {/* Toggle for dark mode */}
                <div className={styles.toggleContainer}>
                    <label className={styles.toggleSwitch}>
                        <input
                            type="checkbox"
                            checked={isDarkMode}
                            onChange={toggleDarkMode}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                {/* Search bar and Add Record button */}
                <div className={styles.searchAddContainer}>
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={uiState.searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className={styles.searchBar}
                    />
                    <button className={styles.addButton} onClick={openModal}>
                        Add Record
                    </button>
                </div>

                {/* Modal for adding or editing a record */}
                {isModalOpen && (
                    <div className={`${styles.modal} ${styles.scrollableModal}`}>
                        <div className={styles.modalContent}>
                            <h2>{uiState.modalState.isEditing ? "Edit Record" : "Add New Record"}</h2>
                            {/* Modal Input Fields */}
                            <input
                                type="text"
                                name="content"
                                placeholder="Content"
                                value={formState.content}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="domain_name"
                                placeholder="Domain Name"
                                value={formState.domain_name}
                                onChange={handleInputChange}
                            />
                            <input
                                type="number"
                                name="http_status"
                                placeholder="HTTP Status"
                                value={formState.http_status}
                                onChange={(e) => setFormState({ ...formState, http_status: Number(e.target.value) })}
                            />
                            <input
                                type="text"
                                name="language"
                                placeholder="Language"
                                value={formState.language}
                                onChange={handleInputChange}
                            />
                            <input
                                type="date"
                                name="last_sourced_from_wallabag"
                                placeholder="Last Sourced from Wallabag"
                                value={formState.last_sourced_from_wallabag}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="mimetype"
                                placeholder="MIME Type"
                                value={formState.mimetype}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="preview_picture"
                                placeholder="Preview Picture URL"
                                value={formState.preview_picture || ""}
                                onChange={(e) =>
                                    setFormState({ ...formState, preview_picture: e.target.value || null })
                                }
                            />
                            <input
                                type="text"
                                name="published_by"
                                placeholder="Published By"
                                value={formState.published_by}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="tags"
                                placeholder="Tags (comma-separated)"
                                value={Array.isArray(formState.tags) ? formState.tags.join(", ") : ""}
                                onChange={(e) =>
                                    setFormState({ ...formState, tags: e.target.value.split(",").map(tag => tag.trim()) })
                                }
                            />
                            <input
                                type="text"
                                name="title"
                                placeholder="Title"
                                value={formState.title}
                                onChange={handleInputChange}
                            />
                            <input
                                type="date"
                                name="updated_at"
                                placeholder="Updated At"
                                value={formState.updated_at}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="url"
                                placeholder="URL"
                                value={formState.url}
                                onChange={handleInputChange}
                            />
                            <input
                                type="email"
                                name="user_email"
                                placeholder="User Email"
                                value={formState.user_email}
                                onChange={handleInputChange}
                            />
                            <input
                                type="number"
                                name="user_id"
                                placeholder="User ID"
                                value={formState.user_id}
                                onChange={(e) => setFormState({ ...formState, user_id: Number(e.target.value) })}
                            />
                            <input
                                type="text"
                                name="user_name"
                                placeholder="User Name"
                                value={formState.user_name}
                                onChange={handleInputChange}
                            />
                            <input
                                type="date"
                                name="wallabag_created_at"
                                placeholder="Wallabag Created At"
                                value={formState.wallabag_created_at}
                                onChange={handleInputChange}
                            />
                            <label>
                                Wallabag is Archived:
                                <input
                                    type="checkbox"
                                    name="wallabag_is_archived"
                                    checked={formState.wallabag_is_archived}
                                    onChange={(e) =>
                                        setFormState({ ...formState, wallabag_is_archived: e.target.checked })
                                    }
                                />
                            </label>
                            <input
                                type="date"
                                name="wallabag_updated_at"
                                placeholder="Wallabag Updated At"
                                value={formState.wallabag_updated_at}
                                onChange={handleInputChange}
                            />


                            <div className={styles.modalActions}>
                                {uiState.modalState.isEditing ? (
                                    <button onClick={handleUpdateRecord}>Update</button>
                                ) : (
                                    <button onClick={handleAddRecord}>Add</button>
                                )}
                                <button onClick={closeModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal for delete confirmation */}
                {isDeleteModalOpen && (
                    <div className={`${styles.modal} ${styles.nonScrollableModal}`}>
                        <div className={styles.modalContent}>
                            <h2>Confirm Delete</h2>
                            <p>Are you sure you want to delete this record?</p>
                            <div className={styles.modalActions}>
                                <button onClick={confirmDelete}>Yes, Delete</button>
                                <button onClick={closeDeleteModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display the records using the Card component */}
                <div className={styles.grid}>
                    {paginatedData.map((item) => (
                        <Card
                            key={item.id}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            uiState={uiState}
                        />
                    ))}
                </div>

                {/* Pagination controls */}
                <div className={styles.pagination}>
                    <button
                        onClick={() =>
                            setUiState((prevState) => ({
                                ...prevState,
                                currentPage: Math.max(prevState.currentPage - 1, 1),
                            }))
                        }
                        disabled={uiState.currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>
                    Page {uiState.currentPage} of {totalPages}
                </span>
                    <button
                        onClick={() =>
                            setUiState((prevState) => ({
                                ...prevState,
                                currentPage: Math.min(prevState.currentPage + 1, totalPages),
                            }))
                        }
                        disabled={uiState.currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
                <div className={styles.goUpButton} onClick={handleGoUp}>
                    <img src="/up-chevron_8213555.png" alt="Go to top"/>
                </div>
            </div>
        );
    }

// Static data fetching function to get leaves data
    export async function getStaticProps() {
        try {
            let allLeaves = [];
            let page = 1;
            const offset = 0;

            while (true) {
                const response = await axios.get("https://x8ki-letl-twmt.n7.xano.io/api:WVrFdUAc/cassandra_leaves", {
                    params: {
                        page_number: page,
                        offset: offset,
                    },
                });

                const items = response.data.items;
                if (items.length === 0) break;

                allLeaves = [...allLeaves, ...items];
                page++;
            }

            return {
                props: {
                    leavesData: allLeaves,
                },
            };
        } catch (error) {
            console.error("Error fetching data from Xano:", error);
            return {
                props: {
                    leavesData: [],
                },
            };
        }
    }
