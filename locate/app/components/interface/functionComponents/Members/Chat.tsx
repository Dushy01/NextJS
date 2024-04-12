'use client'
interface MemberFunctionProps {
    setOpenMessage: React.Dispatch<React.SetStateAction<boolean>>;
    openMessage: boolean;
    messageUid: string;
}

interface messageDoc {
    messageDocId: string;
    docData: {
        From: string;
        To: string;
        MessageText: string;
        Timestamp: string;
        Status: boolean;
    }
}

import { useState, useEffect } from "react";
import styles from './chat.module.css';
import { useGlobalUidContext } from "@/app/context/uid";
import { useGlobalProjectIdContext } from "@/app/context/projectId";
import { firestore } from "@/app/firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";



export default function Chat({ setOpenMessage, messageUid }: MemberFunctionProps) {
    const { } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [messageText, setMessaeText] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<messageDoc[]>([]);

    useEffect(() => {
        // Set up listener for real-time updates to chat messages
        const unsubscribe = onSnapshot(collection(firestore, 'Chats'), (snapshot) => {
            const messages: messageDoc[] = [];
            snapshot.forEach((doc: any) => {
                messages.push({
                    messageDocId: doc.id,
                    docData: doc.data() as messageDoc['docData']
                });
            });
            setChatMessages(messages);
        });

        // Clean up the listener when component unmounts
        return () => {
            unsubscribe();
        };
    }, []); // Empty dependency array to run only once when component mounts

    const sendMessage = async () => {
        if (messageText.trim() !== "") {
            const currentTime = new Date();
            const hours = String(currentTime.getHours()).padStart(2, '0');
            const minutes = String(currentTime.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            // Add the message
            const messageData = {
                'From': uid,
                'To': messageUid,
                'MessageText': messageText.trim(),
                'Timestamp': formattedTime,
                'Status': false
            };

            const collectionRef = collection(firestore, 'Chats');
            await addDoc(collectionRef, messageData);
            setMessaeText('');
        }
    };


    return (
        <main className={styles.body}>
            <div className={styles.messageBox}>
                {/* apply messages here  */}
                {chatMessages.map((message) => (
                    <div key={message.messageDocId}>
                        <p>{message.docData.MessageText}</p>
                        <p>{message.docData.Timestamp}</p>
                    </div>
                ))}
            </div>
            <div className={styles.messageinputBox}>
                <input type="text" value={messageText} onChange={(e) => setMessaeText(e.target.value)} />
                <button onClick={sendMessage}>Send</button>
            </div>
        </main>
    )
}