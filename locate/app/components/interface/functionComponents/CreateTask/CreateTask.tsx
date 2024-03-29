// Importing a Material-UI button component
'use client'
import { Typography, TextField } from '@mui/material'
import styles from './createask.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { firestore, storage } from '@/app/firebase';
import { collection, addDoc, updateDoc, getDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { useGlobalUidContext } from '@/app/context/uid';
export default function CreateTask() {

    // const [selectedFiles, setSelectedFiles] = useState([]);
    const [fileObject, setFileObject] = useState(null);
    const [attachedFiles, setAttachedFiles] = useState<boolean>(false);
    const { projectName, projectId } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [createTask, setCreateTask] = useState<boolean>(false);


    const [heading, setHeading] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');
    const [assignies, setAssignies] = useState<[]>([]); //  data type is missing



    const askForFile = () => {
        // Get the file input element
        const fileInput: any = document.getElementById('attachments');
        // Trigger a click event on the file input element
        fileInput.click();
    }

    useEffect(() => {
        const handleFileUpload = async () => {
            if (createTask) {
                // Get the file input element
                const fileInput: any = document.getElementById('attachments');
                const files = fileInput.files;
                if (files.length === 0) {
                    console.error('No files selected for upload');
                    return;
                }

                const filesObject: any = {};

                try {
                    // Iterate through each file
                    for (const file of files) {
                        const fileName = file.name;
                        const storageRef = ref(storage, fileName);

                        // Upload the file
                        const snapshot = await uploadBytes(storageRef, file);

                        // Get the download URL of the uploaded file
                        const downloadURL = await getDownloadURL(storageRef);

                        // Store the download URL in the filesObject with the file name as key
                        filesObject[fileName] = downloadURL;
                    }

                    // Update the fileObject state with the uploaded files
                    setFileObject(filesObject);
                    setAttachedFiles(true);
                } catch (error) {
                    console.error('Error uploading files:', error);
                }
            }
        };

        handleFileUpload();
    }, [createTask]);



    // // check if folder eixst
    // const checkIfFolderExistsByName = async (storage: any, folderName: string | null) => {
    //     try {
    //         const folderRef = ref(storage, `${folderName}`);

    //         return true;
    //     } catch (error) {
    //         // If an error is thrown, the folder does not exist
    //         return false;
    //     }
    // };

    // // Function to create a folder with a specific name in Firebase Storage
    // const createFolderWithName = async (storage: any, folderName: string | null) => {
    //     try {
    //         const folderRef = ref(storage, `${folderName}`);
    //         // Uploading an empty file to create the folder
    //         await uploadBytes(folderRef, new Blob());
    //     } catch (error) {
    //         console.error('Error creating folder:', error);
    //     }
    // };

    // const uploadFiles = async (files: any) => {

    //     const filesObject: any = {};



    //     // // check for the folder if that exist or not
    //     // const folderExists = await checkIfFolderExistsByName(storage, projectName);
    //     // if (!folderExists) {
    //     //     // Create the folder if it doesn't exist
    //     //     await createFolderWithName(storage, projectName);
    //     // }

    //     try {
    //         // Iterate through each file
    //         for (const file of files) {
    //             const fileName = file.name;
    //             const storageRef = ref(storage, fileName);

    //             // Upload the file
    //             const snapshot = await uploadBytes(storageRef, file);

    //             // Get the download URL of the uploaded file
    //             const downloadURL = await getDownloadURL(storageRef);

    //             // Store the download URL in the filesObject with the file name as key
    //             filesObject[fileName] = downloadURL;
    //         }

    //         return filesObject;
    //     } catch (error) {
    //         console.error('Error uploading files:', error);
    //         return null;
    //     }
    // };

    // // Define an event listener to handle file selection
    // const handleFileSelection = async (event: any) => {
    //     const files = event.target.files;
    //     if (files.length === 0) {
    //         console.error('No files selected for upload');
    //         return;
    //     }



    //     // setSelectedFiles((prevSelectedFiles) => [...prevSelectedFiles, ...fileList]);

    //     setAttachedFiles(true);

    //     if (createTask) {
    //         const uploadedFiles = await uploadFiles(files);
    //         console.log(uploadedFiles);
    //         if (uploadedFiles) {
    //             // Update the fileObject state with the uploaded files
    //             setFileObject(uploadedFiles);
    //             // setAttachedFiles(true);
    //         }
    //     }
    // };



    const createTaskFunction = async () => {
        

        // code to create the task 
        const task = {
            'Heading': heading,
            'Description': description,
            'CreatedBy': uid,
            'Deadline': deadline,
            'CreatedAt': getCurrentDate,  // current date in dd/mm/yy format
            'Assignies': assignies,
            'Project': projectId,
            'Files': fileObject  // associated files 
        };

        // create this doc inside the Tasks colletion
        // Reference to the Firestore collection where you want to add the document
        const collectionRef = collection(firestore, 'Tasks');

        // Add a document with an automatically generated ID
        const docRef = await addDoc(collectionRef, task);
        console.log('Document added with ID: ', docRef.id);
        const new_task_id = docRef.id;
        // add the document id in the task list of the prject id 
        const updateListResult = await updateListInDocument('Projects', projectId, 'TaskIds', new_task_id);
        // update the task list
        if (updateListResult) {setCreateTask(true);}

    }

    // update the list
    const updateListInDocument = async (collectionName: string, documentId: string, listKey: string, newData : any) => {
        try {
            // Reference to the document
            const documentRef = doc(firestore, collectionName, documentId);
    
            // Get the current data of the document
            const documentSnapshot = await getDoc(documentRef);
            if (!documentSnapshot.exists()) {
                throw new Error('Document does not exist');
            }
    
            // Get the current data object
            const currentData = documentSnapshot.data();
    
            // Ensure that the listKey exists in the currentData object
            if (!currentData.hasOwnProperty(listKey) || !Array.isArray(currentData[listKey])) {
                throw new Error(`Key "${listKey}" is not a list in the document`);
            }
    
            // Add the newData to the list
            currentData[listKey].push(newData);
    
            // Update the document with the modified data
            await updateDoc(documentRef, { [listKey]: currentData[listKey] });
    
            console.log('List updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating list in document:', error);
            return false;
        }
    };

    const getCurrentDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0'); // Get the day and pad it with leading zero if necessary
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Get the month (months are zero-based) and pad it with leading zero if necessary
        const yy = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

        return `${dd}/${mm}/${yy}`;
    };

    return (
        <main>
            <div className='d-flex flex-row align-items-baseline justify-content-start'>
                <div className='d-flex flex-column m-10' style={{ marginLeft: 10 }}>
                    <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                        Type Heading
                    </Typography>
                    <input type="text" className={styles.TaskHeading} placeholder='Type heading' />
                </div>
                <div className='d-flex flex-column m-10' style={{ marginLeft: 10 }}>
                    <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                        Deadline
                    </Typography>
                    <input type="date" className={styles.deadline} style={{ height: 50, marginTop: 5, padding: 10 }} placeholder='Deadline' />
                </div>
                {/* attach files and upload them and get the URL from the cloud storage with the types as object  */}
                <div className='d-flex flex-column m-10' style={{ marginLeft: 10 }}>
                    <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                        Attachment
                    </Typography>
                    {/* onChange={handleFileSelection} */}
                    <input type="file" id='attachments' multiple style={{ display: 'none' }} />
                    <button className="btn btn-outline-secondary" style={{ height: 50, marginTop: 5 }}
                        // define the function call for asking for the file input
                        onClick={askForFile}
                    >
                        <FontAwesomeIcon icon={faPaperclip} style={{ width: 25, height: 25, color: 'black' }} />
                    </button>
                    <div>
                        {/* onClick={showAttachementFiles} */}
                        {attachedFiles && <button className={styles.attachments} >Attachments</button>}
                    </div>
                </div>
            </div>

            {/* showing the attached files
            {
                showAttachedFiles && 
                <div>
                    
                    
                </div>
            } */}

            <div className={styles.mainBody}>
                <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                    Type Description
                </Typography>
                <textarea className={styles.TaskDescription} placeholder='Type description' style={{ padding: 10, fontFamily: 'ReadexPro' }} />
            </div>
            <button onClick={createTaskFunction} style={{ width: 1000, border: 'none', borderRadius: 5, marginLeft: 10, height: 50, fontSize: 20, fontFamily: 'ReadexPro', backgroundColor: 'black', color: 'whitesmoke' }}>Create</button>
        </main>
    )
}