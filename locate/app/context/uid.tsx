'use client'

import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { useState } from "react";


interface UidContextProps  {
    uid: string | null,
    email: string | null,
    imageUrl: string,
    userName: string | null,
    setUid: Dispatch<SetStateAction<string | null>>
    setEmail: Dispatch<SetStateAction<string | null>>
    setImageUrl: Dispatch<SetStateAction<string>>
    setUserName: Dispatch<SetStateAction<string | null>>
}

// default values
const UidContext = createContext<UidContextProps>({
    uid: '' ,
    email: '',
    imageUrl: '',
    userName: '',
    setImageUrl: (): string => '',
    setEmail: (): string => '',
    setUid: (): string => '',
    setUserName: (): string => '',
})

export const GlobalUidContext = ({ children }) => {
    const [uid, setUid] = useState<string | null>('');
    const [userName, setUserName] = useState<string | null>('');
    const [email, setEmail] = useState<string | null>('');
    const [imageUrl, setImageUrl] = useState<string>('');

    return (
        <UidContext.Provider value={{uid, email, imageUrl, userName, setUserName, setImageUrl, setEmail, setUid  }}>
            {children}
        </UidContext.Provider>
    )
}

export const useGlobalUidContext = () => useContext(UidContext);