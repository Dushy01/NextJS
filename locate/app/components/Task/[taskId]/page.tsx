'use client';
import { firestore } from "@/app/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Task() {
    const params = useParams();
    const taskId = params.taskId;

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
    }, [taskId])

    return (
        <main>

            <div>
                <p>{taskName}</p>
                <p>{taskdescription}</p>
            </div>
        </main>
    )

}