// component  for the task status 
'use client'
import Image from 'next/image';
import styles from './taskstatus.module.css';
import React, { Dispatch, useEffect, useState } from 'react';
import { collection, onSnapshot, where, query, getDocs } from 'firebase/firestore';
import { firestore, storage } from '@/app/firebase'; // Import your Firestore instance
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { getDownloadURL, ref } from 'firebase/storage';
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
        AssignieesImages: string[];
        CreatorImage: string;
        Status: string;
    }
}

interface TaskStatusProps {
    setOpenTask: React.Dispatch<React.SetStateAction<boolean>>;
    setTaskHeading: React.Dispatch<React.SetStateAction<string>>;
    setTaskDocumentId: React.Dispatch<React.SetStateAction<string>>;
}

export default function TaskStatus({ setOpenTask, setTaskHeading, setTaskDocumentId }: TaskStatusProps) {
    // Define state to store the documents
    const [documents, setDocuments] = useState<documentStructure[]>([]);
    const { projectId } = useGlobalProjectIdContext();
    const [showFileDialog, setShowFileDialog] = useState(false);
    const [filesToShow, setFilesToShow] = useState<any>({});

    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        // Reference to the Firestore collection you want to listen to
        const collectionRef = collection(firestore, 'Tasks');

        // Use onSnapshot to listen for real-time updates
        const unsubscribe = onSnapshot(
            query(collectionRef, where('Project', '==', projectId)),
            async (querySnapshot) => {
                const updatedDocuments: any = [];
                querySnapshot.forEach(async (doc) => {
                    console.log('The doc is', doc.data());
                    // Convert the document to JSON and add it to the updatedDocuments array
                    updatedDocuments.push({
                        id: doc.id,
                        data: doc.data()
                    });
                });



                // Update the documents state with the updatedDocuments array
                setDocuments(updatedDocuments);
            }
        );

        // function to add the image url
        const createdByImage = async (uid: string) => {
            const q = query(collection(firestore, 'Users'), where('Uid', "==", uid))
            const documents = await getDocs(q);
            if (!documents.empty) {
                console.log(`Image url for the uid: ${uid} is ${documents.docs[0].data().ImageUrl}`);
                return documents.docs[0].data().ImageUrl;
            }
            return ''; // Return a default value if image URL is not found
        }

        function getCurrentDate() {
            const currentDate = new Date();
            const day = String(currentDate.getDate()).padStart(2, '0');
            const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
            const year = currentDate.getFullYear();

            return `${day}/${month}/${year}`;
        }




        // Return a cleanup function to unsubscribe from the listener when the component unmounts
        return () => {
            unsubscribe();
            setCurrentDate(getCurrentDate());
        }
    }, [projectId]); // Add projectId to the dependency array

    const openFilesDialogs = (files: { [key: string]: string; }) => {
        setShowFileDialog(true);

        setFilesToShow(files);
    }

    const downloadFile = async (fileUrl: string) => {
        console.log(fileUrl);
        try {
            const anchor = document.createElement('a');
            anchor.href = fileUrl;
            anchor.target = '_blank'; // Open in a new tab
            
            anchor.click();

        } catch (error) {
            console.error("Error downloading file:", error);
        }
    }

    const setTaskValues = (taskHeading: string, documentId: string) => {
        setOpenTask(true);
        setTaskHeading(taskHeading);
        setTaskDocumentId(documentId);
    }


    // Now you can use the documents state to render your UI
    return (
        <main>
            <div className={styles.TaskCollection}>
                {/* Render UI using the documents state */}
                {documents.map((document) => (
                    <div key={document.id} className={styles.Task}>
                        {/* top bar of the task div */}
                        <div className={styles.taskTopbar}>
                            <img className={styles.creatorImage} src={document.data.CreatorImage} />
                            <div className={styles.taskTextDescription}>
                                <h3>{document.data.Heading}</h3>
                                <p>{document.data.Description}</p>
                            </div>
                            <button
                                onClick={() => setTaskValues(document.data.Heading, document.id)}
                                className={styles.taskStatus}>{document.data.Status}</button>
                        </div>
                        <div className={styles.bottomBar}>

                            <div className={styles.AssigneeDescription}>
                                <p>Assigniees</p>
                                {/* image would be shown here in this  */}
                                <div className={styles.taskAssigneesImages}>
                                    {document.data.AssignieesImages.map((image, index) => (
                                        <img className={styles.assigneeImage} key={index} src={image} alt={`Assignee ${index + 1}`} />
                                    ))}
                                </div>
                            </div>
                            <div className={styles.sideDescriptionTask}>
                                <div>
                                    <button className={styles.attachmentButton} onClick={() => openFilesDialogs(document.data.Files)}>
                                        <img src="/Attach.png" alt='attachment image' />
                                    </button>
                                </div>
                                <div className={styles.deadline}>
                                    <h4>Deadline</h4>
                                    <p className={new Date(currentDate) > new Date(document.data.Deadline) ? styles.invalidDate : styles.validDate}
                                    >{document.data.Deadline}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {showFileDialog &&
                <div className={styles.filesDialog}>
                    {/* showing files map with the download button with their names  */}
                    {Object.keys(filesToShow).length > 0 ?
                        <div>
                            <div className={styles.filesColumn}>
                                {Object.keys(filesToShow).map((fileName, index) => (
                                    <div key={index} className={styles.fileRow}>
                                        <p className={styles.fileName}>{fileName}</p>
                                        <button className={styles.downloadFileButton} onClick={() => downloadFile(filesToShow[fileName])}><img src="/download.png" /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowFileDialog(false)} className={styles.closeFileDialog}>Close</button>
                        </div>
                        :
                        <div>
                            <p>No files to show!</p>
                        </div>
                    }
                </div>
            }

        </main>
    );
}