'use client';
import { firestore } from "@/app/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from './task.module.css';


export default function Task() {
    const params = useParams();
    const taskId = params.taskId;
    const router = useRouter();
    const [taskName, setTaskName] = useState('');
    const [taskdescription, setTaskDescription] = useState('');

    useEffect(() => {
        const getTaskData = async () => {
            const q = query(collection(firestore, 'Tasks'), where('TaskID', "==", taskId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0].data();
                setTaskName(doc['Heading']);
                setTaskDescription(doc['Description']);
            }
        }

        return () => {
            getTaskData();
        }
    }, [taskId]);

    const back = () => {
        router.push('/components/interface')
    }

    return (
        <main>
            <div className={styles.header}>
                <button onClick={back} className={styles.backButton}><img src="/Back.png"/></button>
            </div>
            <div className={styles.taskTextDescription}>
                <div className={styles.taskTextDescription}>
                    <p style={{fontSize: 20, fontWeight: '600'}}>Task name</p>
                <p>{taskName}</p>
                </div>
               
                <div className={styles.taskTextDescription}>
                    <p style={{fontSize: 20, fontWeight: '600'}}>Task description</p>
                <p>{taskdescription}</p>
                </div>
                
            </div>
        </main>
    )

}