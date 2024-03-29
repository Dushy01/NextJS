'use client'

import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { useState } from "react";

interface ProjectIdContext {
    projectId: string;
    projectName: string | null;

    // function also
    setProjectId: Dispatch<SetStateAction<string>>
    setProjectName: Dispatch<SetStateAction<string | null>>
}

const ProjectContext = createContext<ProjectIdContext>({
    projectId: '',
    projectName: '',

    setProjectId: (): string => '',
    setProjectName: (): string => ''
})

export const GlobalProjectContext = ({children}) => {
    const [projectId, setProjectId] = useState<string>('');
    const [projectName, setProjectName] = useState<string | null>('');


    return (
        <ProjectContext.Provider value={{projectId,projectName, setProjectId, setProjectName}}>
            {children}
        </ProjectContext.Provider>
    )
}

export const useGlobalProjectIdContext = () => useContext(ProjectContext);