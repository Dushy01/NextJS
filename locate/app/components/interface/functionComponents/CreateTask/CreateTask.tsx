// Importing a Material-UI button component
'use client'
import { Typography, TextField } from '@mui/material'
import styles from './createask.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { firestore, storage } from '@/app/firebase';
import { collection, addDoc, updateDoc, getDoc, doc, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { useGlobalUidContext } from '@/app/context/uid';
import Assignies from './assignies';
import useBeforeUnload from '@/app/inactive';
import Image from 'next/image';

export default function CreateTask() {

    // define the useBeforeUnload hook to change the status 
    useBeforeUnload(async () => {
        // listen for changes
        const q = query(collection(firestore, 'Users'), where('Uid', "==", uid));
        const documents = await getDocs(q);
        if (!documents.empty) {
            const userDoc = documents.docs[0];
            const userDocId = userDoc.id;
            const docRef = doc(firestore, 'Users', userDocId);
            await updateDoc(docRef, { 'Status': false });
        }
    });

    const { projectName, projectId } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();


    const [attachedFiles, setAttachedFiles] = useState<boolean>(false);


    const [showAssignOption, SetShowAssigniesOption] = useState<boolean>(false);

    const [heading, setHeading] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');

    const [assignies, setAssignies] = useState<string[]>([]);

    const [fileObject, setFileObject] = useState(null);
    const [fileObjectView, setFileObjectForView] = useState<any>({});

    const [openAttachmentView, setOpenAttachmentView] = useState(false);



    const askForFile = () => {
        // Get the file input element
        const fileInput: any = document.getElementById('attachments');
        // Set up an event listener for the change event on the file input
        fileInput.addEventListener('change', handleFileUpload);
        // Trigger a click event on the file input element
        fileInput.click();

    }

    // function to upload the files for the cloud storage and get the fileObject which has name + URL 
    const uploadFiles = async () => {
        const fileInput: any = document.getElementById('attachments');
        const files = fileInput.files;

        // store the name with the download URL 
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


        } catch (error) {
            console.error('Error uploading files:', error);
        }
    }



    const handleFileUpload = async () => {
        // Get the file input element
        const fileInput = document.getElementById('attachments') as HTMLInputElement;
        fileInput.removeEventListener('change', handleFileUpload);
        const files = fileInput.files;
        if (!files || files.length === 0) {
            console.error('No files selected for upload');
            return;
        }
        setAttachedFiles(true);

        // Create an object to store files
        const filesObject: any = {};

        try {
            // Convert FileList to array of File objects
            const fileList = Array.from(files) as File[];

            // Iterate through each file
            for (const file of fileList) {
                const fileName = file.name;
                // Store the file in the filesObject with the file name as key
                filesObject[fileName] = file;
            }
            // Update the fileObject state with the uploaded files
            setFileObjectForView(filesObject);
        } catch (error) {
            console.error('Error uploading files:', error);
        }
    };

    const createTaskFunction = async () => {

        console.log('file objects are', fileObject);
        console.log('assignies are', assignies);

        const created_at = getCurrentDate();

        // code to create the task 
        const task = {
            'Heading': heading,
            'Description': description,
            'CreatedBy': uid,
            'Deadline': deadline,
            'CreatedAt': created_at,  // current date in dd/mm/yy format
            'Assignies': assignies,
            'Project': projectId,
            'Files': fileObject  // associated files 
        };

        console.log('Task we are adding is', task);
        // Reference to the Firestore collection where you want to add the document
        const collectionRef = collection(firestore, 'Tasks');

        // Add a document with an automatically generated ID
        const docRef = await addDoc(collectionRef, task);
        console.log('Document added with ID: ', docRef.id);
        const new_task_id = docRef.id;
        try {
            // add the task id in the project tasksids list 
            const q = query(collection(firestore, 'Projects'), where('projectName', "==", projectName))
            const documents = await getDocs(q);
            if (!documents.empty) {
                const project_document = documents.docs[0];
                const documentId = project_document.id;

                const docRef = doc(firestore, 'Projects', documentId)
                await updateDoc(docRef, {
                    TasksIds: arrayUnion(new_task_id) // Using arrayUnion to ensure unique IDs
                });
            }
        }
        catch (error) {
            console.log('Not been able to update the TasksIds list of the project', error);
        }

    }

    // update the list
    const updateListInDocument = async (collectionName: string, documentId: string, listKey: string, newData: any) => {
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


    const selectDeadline = () => {
        const deadlineInput = document.getElementById('deadline') as HTMLInputElement;
        if (deadlineInput) {
            // Trigger a click event on the input field
            deadlineInput.click();
        }
    };


    const handleDeadlineChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        setDeadline(target.value);
    };

    const handleDeleteFile = (fileName: string) => {
        // Create a copy of the fileObjectForView state
        const updatedFileObject = { ...fileObjectView };
        // Remove the file with the specified file name
        delete updatedFileObject[fileName];
        // Update the fileObjectForView state with the updated fileObject
        setFileObjectForView(updatedFileObject);
    };

    return (
        <main className={styles.mainBody}>


            <div className={styles.topBar}>

                <input type="text" className={styles.TaskHeading} placeholder='Type heading...' onChange={(e) => setHeading(e.target.value)} />

                <button className={styles.deadline} onClick={selectDeadline}>

                    <img src="/Deadline.png" alt="Calendar icon" />
                    Select deadline

                    <input type="date" id='deadline' style={{ display: 'none' }} onChange={() => handleDeadlineChange} placeholder='Select Deadline' />
                </button>
            </div>

            <div className={styles.midBar}>
                <textarea className={styles.TaskDescription} onChange={(e) => (setDescription(e.target.value))} placeholder='Type description...' style={{ padding: 10, fontFamily: 'ReadexPro' }} />
            </div>




            <div className={styles.bottomBar}>
                <div className={styles.attachmentBar}>
                    {/* onChange={handleFileSelection} */}
                    <input type="file" id='attachments' multiple style={{ display: 'none' }} />

                    <button className={styles.attachmentButton} style={{ height: 50, marginTop: 5 }}
                        // define the function call for asking for the file input
                        onClick={askForFile}>
                        <img src="/Attach.png" alt="Attachement icon" />
                        Attach Files
                    </button>

                    <div>
                        {/* onClick={showAttachementFiles} */}
                        {attachedFiles && <button onClick={() => setOpenAttachmentView(true)} className={styles.attachments} >Attachments</button>}
                    </div>
                </div>

                {
                    openAttachmentView &&
                    // show the attachment for the view of the task 

                    <div className={styles.attachementViewPopup}>
                        <div className={styles.attachmentHeder}>
                            <h3>Files to upload</h3>
                            <button className={styles.closeButton} onClick={() => setOpenAttachmentView(false)}>Close</button>
                        </div>
                        <div className={styles.files}>
                            {Object.keys(fileObjectView).map((fileName, index) => (
                                <div key={index} className={styles.fileData}>
                                    <span>{fileName}</span>
                                    <button className={styles.deleteFileButton} onClick={() => handleDeleteFile(fileName)}><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.fileHandlingButtons}>
                            <button className={styles.fileHandlingButton}>Add</button>
                            <button className={styles.fileHandlingButton}>Upload</button>
                        </div>
                    </div>
                }

                {/* button to add assignies */}
                <div >

                    <button onClick={() => SetShowAssigniesOption(true)} className={styles.assignButton}>
                        <img src="/Peoples.png" alt="Peoples icon" />
                        {assignies.length} Assign</button>
                </div>
            </div>


            {
                showAssignOption &&
                // call a component to show up
                <Assignies setShowAssignOption={SetShowAssigniesOption} showAssignOption={showAssignOption} setAssignies={setAssignies} assignies={assignies} />
            }

            <button onClick={createTaskFunction} style={{ width: 915, border: 'none', borderRadius: 5, marginTop: 10, height: 50, fontSize: 20, fontFamily: 'ReadexPro', backgroundColor: 'black', color: 'whitesmoke' }}>Create</button>
        </main>
    )
}