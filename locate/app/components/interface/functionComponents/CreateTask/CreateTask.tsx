// Importing a Material-UI button component
'use client'
import { Typography, TextField } from '@mui/material'
import styles from './createask.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { firestore, storage } from '@/app/firebase';
import { collection, addDoc, updateDoc, getDoc, doc, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { useGlobalUidContext } from '@/app/context/uid';
import Assignies from './assignies';
import useBeforeUnload from '@/app/inactive';


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
            await updateDoc(docRef, {'Status': false});
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


    const askForFile = () => {
        // Get the file input element
        const fileInput: any = document.getElementById('attachments');
        // Set up an event listener for the change event on the file input
        fileInput.addEventListener('change', handleFileUpload);
        // Trigger a click event on the file input element
        fileInput.click();

    }


    const handleFileUpload = async () => {

        // Get the file input element
        const fileInput: any = document.getElementById('attachments');
        fileInput.removeEventListener('change', handleFileUpload);
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

    return (
        <main>
            <div className='d-flex flex-row align-items-baseline justify-content-start'>
                <div className='d-flex flex-column m-10' style={{ marginLeft: 10 }}>
                    <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                        Type Heading
                    </Typography>
                    <input type="text" className={styles.TaskHeading} placeholder='Type heading' onChange={(e) => setHeading(e.target.value)} />
                </div>
                <div className='d-flex flex-column m-10' style={{ marginLeft: 10 }}>
                    <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                        Deadline
                    </Typography>
                    <input type="date" className={styles.deadline} style={{ height: 50, marginTop: 5, padding: 10 }} placeholder='Deadline' onChange={(e) => setDeadline(e.target.value)} />
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
                        onClick={askForFile}>
                        <FontAwesomeIcon icon={faPaperclip} style={{ width: 25, height: 25, color: 'black' }} />
                    </button>
                    <div>
                        {/* onClick={showAttachementFiles} */}
                        {attachedFiles && <button className={styles.attachments} >Attachments</button>}
                    </div>
                </div>

                {/* button to add assignies */}
                <div className='d-flex flex-column m-10' style={{ marginLeft: 10 }}>
                    <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                        Assignies
                    </Typography>
                    <button onClick={() => SetShowAssigniesOption(true)} className={styles.assignButton}>{assignies.length} Assign</button>
                </div>
            </div>

            {
                showAssignOption &&
                // call a component to show up
                <Assignies setShowAssignOption={SetShowAssigniesOption} showAssignOption={showAssignOption} setAssignies={setAssignies} assignies={assignies} />
            }



            <div className={styles.mainBody}>
                <Typography fontFamily={'ReadexPro'} fontSize={20} color={'black'} fontWeight={'bold'}>
                    Type Description
                </Typography>
                <textarea className={styles.TaskDescription} onChange={(e) => (setDescription(e.target.value))} placeholder='Type description' style={{ padding: 10, fontFamily: 'ReadexPro' }} />
            </div>
            <button onClick={createTaskFunction} style={{ width: 1000, border: 'none', borderRadius: 5, marginLeft: 10, height: 50, fontSize: 20, fontFamily: 'ReadexPro', backgroundColor: 'black', color: 'whitesmoke' }}>Create</button>
        </main>
    )
}