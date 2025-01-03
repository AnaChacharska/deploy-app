import React, { createContext, useState } from "react";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children, initialLeavesData = [] }) => {
    const [leaves, setLeaves] = useState(initialLeavesData);

    return (
        <GlobalContext.Provider value={{ leaves, setLeaves }}>
            {children}
        </GlobalContext.Provider>
    );
};
