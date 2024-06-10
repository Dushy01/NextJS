import { useEffect, useState } from 'react';
import styles from './edittask.module.css';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/app/firebase';

interface EditTask {
    taskDocumentId: string;
}

export default function EditTask({ taskDocumentId }: EditTask) {
    const [taskHeading, setTaskHeading] = useState<string>('');
    const [taskDescription, setTaskDescription] = useState<string>('');
    const [taskDeadline, setTaskDeadline] = useState('');
    const [assginieDocData, setAssignieDocData] = useState<{ [key: string]: string[] }>({});
    const [taskFileData, setTaskFileData] = useState<{ [key: string]: string }>({});
    const [assignieImages, setAssignieImage] = useState<string[]>([]);
    const [openFile, setOpenFile] = useState(false);
    const [openAssignie, setOpenAssignie] = useState(false);

    useEffect(() => {
        const getUserData = async (userId: string): Promise<string[] | undefined> => {
            const q = query(collection(firestore, 'Users'), where('Uid', "==", userId));
            const docSnapshot = await getDocs(q);
            if (!docSnapshot.empty) {
                const docData = docSnapshot.docs[0].data();
                return [docData['Name'], docData['ImageUrl']];
            }
            return undefined; // Explicitly return undefined if no document is found
        };

        // get the data related to the task using its document id
        const getTaskData = async () => {
            const docRef = doc(firestore, 'Tasks', taskDocumentId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const docData = docSnap.data();
                setTaskHeading(docData.Heading);
                setTaskDescription(docData.Description);
                setTaskDeadline(docData.Deadline);
                const file_data = docData.Files;
                setTaskFileData(file_data);

                const assginies = docData.AssignieesImages.slice(0, 2);
                setAssignieImage(assginies);


                // now setting up the Assignies data
                const assignie_data = docData.Assignies;
                if (typeof assignie_data === 'object' && assignie_data !== null) {
                    const updatedAssignieDocData: { [key: string]: string[] } = {};
                    for (const [key, value] of Object.entries(assignie_data)) {
                        const userData = await getUserData(key);
                        if (userData) {
                            // Add the key and userData to updatedAssignieDocData
                            updatedAssignieDocData[key] = userData;
                        }
                    }
                    setAssignieDocData(updatedAssignieDocData);
                }


            }
        };

        getTaskData();
    }, [taskDocumentId]);

    return (
        <main>
            <div className={styles.headRowData}>
                {/* column for the doc heading */}
                <div className={styles.headData}>
                    <p className={styles.heading}>Task</p>
                    <input className={styles.textHeading} type="text" value={taskHeading} onChange={(e) => setTaskHeading(e.target.value)} />
                </div>
                {/* column for the doc Deadline */}
                <div className={styles.headData}>
                    <p className={styles.heading}>Deadline</p>
                    {/* deadline showing  */}
                    <div className={styles.deadlineBox}>
                        <div className={styles.deadlineData}>
                            <img src='/Calendar.png' /><p className={styles.deadline}>{taskDeadline}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* showing the task description  */}
            <div className={styles.headData}>
                <p className={styles.heading}>Description</p>
                <textarea className={styles.taskDescription} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}></textarea>
            </div>


            <div className={styles.BottomButtonCollection}>
                {/* Attach files */}
                <div className={styles.filesRowData} onClick={() => setOpenFile(true)}>
                    <img src='/Files.png' /><p className={styles.fileRowHeading}>Files</p>
                </div>

                {/* handle assignies  */}
                <div onClick={() => setOpenAssignie(true)} className={styles.assignieImageRowData}>
                    <div className={styles.assignieImageRow}>
                        {assignieImages.map((imageUrl, index) => (
                            <img className={styles.assignieImage} src={imageUrl} alt="Image Url" />
                        ))}
                    </div>
                    <p className={styles.assignieText}>Assignies</p>
                </div>
                <button className={styles.updateTaskButton}>Update Task</button>
            </div>

            {/* opening the file to show the description */}
            {openFile &&
                <div className={styles.fileDialog}>
                    <div className={styles.fileDialogHeader}>
                        <p className={styles.fileDialogHeaderHeading}>Task Files</p>
                        <button className={styles.fileDialogCloseButton} onClick={() => setOpenFile(false)}><img src='/Cross.png' /></button>
                    </div>
                    {/* using the map to show the data */}
                    <div className={styles.fileColumn}>
                        {Object.entries(taskFileData).map(([key, value]) => (
                            <div className={styles.fileRow}>
                                <p className={styles.fileName}>{key}</p>
                                <button className={styles.fileDeleteButton}><img src='/deleteIcon.png' /></button>
                            </div>
                        ))}
                    </div>
                </div>
            }


            {openAssignie &&
                <div className={styles.fileDialog}>
                    <div className={styles.fileDialogHeader}>
                        <p className={styles.fileDialogHeaderHeading}>Task Files</p>
                        <button className={styles.fileDialogCloseButton} onClick={() => setOpenFile(false)}><img src='/Cross.png' /></button>
                    </div>
                    <div className={styles.fileColumn}>
                        {Object.entries(assginieDocData).map(([key, value]) => (
                            <div className={styles.fileRow}>
                                <div className={styles.assignieData}>
                                    
                                    <img className={styles.assignieImage} src={value[1]} />
                                    <p className={styles.assignieName}>{value[0]}</p>
                                </div>
                                <button className={styles.fileDeleteButton}><img src='/deleteIcon.png' /></button>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </main>
    );
}
