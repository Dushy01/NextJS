'use client'
interface taskDetailsProps {
    taskDocumentId: string;
}

interface assignedList {
    ImageUrl: string;
    Uid: string;
    Status: string;
}



import { useGlobalUidContext } from '@/app/context/uid';
import styles from './taskdetails.module.css'
import { firestore } from "@/app/firebase";
import { collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useState, useEffect } from "react";
export default function TaskDetails({ taskDocumentId }: taskDetailsProps) {
    // const [assigneMap, setAssigneMap] = useState({});
    const [assigneeList, setAssigneeList] = useState<assignedList[]>([]);

    const [taskDescription, setTaskDescription] = useState('');
    const [creator, setCreator] = useState(false);
    const [creatorIamge, setCreatorImage] = useState('');
    // creating a array to hold the user object which would include the ImageUrl, Uid, and status level of the user 

    const { uid } = useGlobalUidContext();


    const getImageUrl = async (userUid: string) => {
        const q = query(collection(firestore, 'Users'), where('Uid', "==", userUid))
        const documents = await getDocs(q);
        if (!documents.empty) {
            const userImage = documents.docs[0].data().ImageUrl || '';
            console.log(userImage);
            return userImage;
        }
    }

    const getCreatorImage = async (userUid: string) => {
        const q = query(collection(firestore, 'Users'), where('Uid', "==", userUid))
        const documents = await getDocs(q);
        if (!documents.empty) {
            const userImage = documents.docs[0].data().ImageUrl || '';
            console.log(userImage);
            setCreatorImage(userImage)
        }
    }

    useEffect(() => {
        const getAssigneMap = async () => {
            const docRef = doc(firestore, 'Tasks', taskDocumentId);
            const document = await getDoc(docRef);
            if (document.exists()) {
                const documentAssigneMap = document.data().Assignies || {};
                const documentDescription = document.data().Description || '';
                const createdBy = document.data().CreatedBy;
                getCreatorImage(createdBy);
                setTaskDescription(documentDescription);
                if (createdBy === uid) {
                    setCreator(true);
                }
                //const newDocumentAssigneMap: { [key: string]: any } = {};
                // Iterate over key-value pairs, apply a function, and update assigneMap

                const assignedList = await Promise.all(
                    Object.entries(documentAssigneMap).map(async ([key, value]) => {
                        // Apply your function to the key here
                        const transformedKey = await getImageUrl(key) as string;
                        return {
                            'ImageUrl': transformedKey,
                            'Uid': key,
                            'Status': value as string
                        }
                        // console.log(`converting key: ${key} for it's url, ${transformedKey}`);
                        // // Return the transformed key-value pair
                        // newDocumentAssigneMap[transformedKey] = value;
                    })
                );

                console.log(assignedList);

                // Update the assigneMap state with the updatedAssignMap
                setAssigneeList(assignedList);
            }
        }

        getAssigneMap();
    }, [taskDocumentId, uid]);

    const updateFinishStatus = async () => {
        const docRef = doc(firestore, 'Tasks', taskDocumentId);
        await updateDoc(docRef, {Status: true});
    }


    return (
        <main className={styles.mainBody}>
            <div className={styles.creatorData}>
                <img className={styles.creatorImgae} src={creatorIamge} alt="Creator profile Image" />
                <p className={styles.taskDescription}>{taskDescription}</p>
            </div>
            <div className={styles.assigneeMap}>
                {/* here we would show user the map for getting the data  */}
                {/* {Object.entries(assigneMap).map(([imageUrl, buttonText]) => (
                    <div className={styles.assigneeMapRow}>
                        <img src={imageUrl} alt="User image" className={styles.assigneeImage} />
                        <button
                        
                         className={styles.assigneeButton}>
                            {buttonText as string}
                        </button>
                    </div>
                ))} */}

                {assigneeList.map(({ ImageUrl, Status, Uid }) => (
                    <div className={styles.assigneeMapRow} key={Uid}>
                        <img src={ImageUrl} alt="User image" className={styles.assigneeImage} />
                        <button className={styles.assigneeButton} disabled={Uid !== uid}>
                            {Status}
                        </button>
                    </div>
                ))}
            </div>
            {creator &&
                <div className={styles.taskButtons}>
                    <button className={styles.editButton}>Edit</button>
                    <button onClick={updateFinishStatus} className={styles.finishButton}>Finish</button>
                </div>
            }
        </main>
    )
}