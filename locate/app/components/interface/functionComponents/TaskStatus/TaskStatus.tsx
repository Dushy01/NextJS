// component  for the task status 
'use client'


import { useEffect, useState } from 'react';
import { collection, onSnapshot, where, query } from 'firebase/firestore';
import { firestore } from '@/app/firebase'; // Import your Firestore instance
import { useGlobalProjectIdContext } from '@/app/context/projectId';
interface documentStructure {
    id: string,
    data: {
        // define the structure of the data
        Assignies: string[];
        CreatedAt: string;
        CreatedBy: string;
        Deadline: string;
        Description: string;
        Files: { [key: string]: string };
        Heading: string;
        Project: string;
    }
}

export default function TaskStatus() {
    // Define state to store the documents
    const [documents, setDocuments] = useState<documentStructure[]>([]);
    const { projectId } = useGlobalProjectIdContext();

    useEffect(() => {
        // Reference to the Firestore collection you want to listen to
        const collectionRef = collection(firestore, 'Tasks');
    
        // Use onSnapshot to listen for real-time updates
        const unsubscribe = onSnapshot(
            query(collectionRef, where('Project', '==', projectId)),
            (querySnapshot) => {
                const updatedDocuments: any = [];
                querySnapshot.forEach((doc) => {
                    console.log('The doc is', doc.data());
                    // Convert the document to JSON and add it to the updatedDocuments array
                    updatedDocuments.push({
                        id: doc.id,
                    
                        data: doc.data()
                    });
                    console.log('updated document list', updatedDocuments);
                });
    
                // Update the documents state with the updatedDocuments array
                setDocuments(updatedDocuments);
            }
        );
    
        // Return a cleanup function to unsubscribe from the listener when the component unmounts
        return () => unsubscribe();
    }, [projectId]); // Add projectId to the dependency array
    

    // Now you can use the documents state to render your UI
    return (
        <main>
            <div>
                {/* Render UI using the documents state */}
                {documents.map((document) => (
                    <div key={document.id}>
                       <p>{document.data.Heading}</p>
                       
                      
                       
                    </div>
                ))}
            </div>
        </main>
    );
}

