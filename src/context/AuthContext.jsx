import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                if (sessionData.token) {
                    setUser({ uid: sessionData.uid, name: sessionData.name });
                    setRole(sessionData.role);
                }
            } catch (e) {
                localStorage.removeItem('admin_session');
            }
        }
        setLoading(false);
    }, []);

    const login = (sessionData) => {
        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        setUser({ uid: sessionData.uid, name: sessionData.name });
        setRole(sessionData.role);
    };

    const logout = () => {
        localStorage.removeItem('admin_session');
        setUser(null);
        setRole(null);
    };

    const value = {
        user,
        role,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
