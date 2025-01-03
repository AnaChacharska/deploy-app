import { useState, useEffect } from "react";

export function useModal(initialState = false) {
    const [isModalOpen, setIsModalOpen] = useState(initialState);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const toggleModal = () => setIsModalOpen((prev) => !prev);

    return { isModalOpen, openModal, closeModal, toggleModal };
}

export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedMode = localStorage.getItem("darkMode") === "true";
        setIsDarkMode(savedMode);
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode((prevMode) => {
            const newMode = !prevMode;
            localStorage.setItem("darkMode", newMode);
            return newMode;
        });
    };

    return { isDarkMode, toggleDarkMode };
}
