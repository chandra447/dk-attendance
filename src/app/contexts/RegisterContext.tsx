'use client';

import { createContext, useContext, ReactNode } from 'react';

interface RegisterContextType {
    registerId: string;
}

const RegisterContext = createContext<RegisterContextType | undefined>(undefined);

export function RegisterProvider({ children, registerId }: { children: ReactNode; registerId: string }) {
    return (
        <RegisterContext.Provider value={{ registerId }}>
            {children}
        </RegisterContext.Provider>
    );
}

export function useRegister() {
    const context = useContext(RegisterContext);
    if (context === undefined) {
        throw new Error('useRegister must be used within a RegisterProvider');
    }
    return context;
} 