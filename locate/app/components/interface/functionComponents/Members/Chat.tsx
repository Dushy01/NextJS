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
        Date: string;
    }
}

import { useState, useEffect, useRef } from "react";
import styles from './chat.module.css';
import { useGlobalUidContext } from "@/app/context/uid";
import { useGlobalProjectIdContext } from "@/app/context/projectId";
import { firestore } from "@/app/firebase";
import { collection, addDoc, onSnapshot, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import Image from "next/image";


export default function Chat({ setOpenMessage, messageUid }: MemberFunctionProps) {
    const { } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [messageText, setMessaeText] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<messageDoc[]>([]);
    const [otherPersonImageUrl, setOtherPersonImageUrl] = useState('');
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState<boolean>(false);


    const messageBoxRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        const messageBox = messageBoxRef.current;
        if (messageBox) {
            messageBox.scrollTop = messageBox.scrollHeight;
        }
    };

    
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
            messages.sort((a, b) => new Date(b.docData.Date).getTime() - new Date(a.docData.Date).getTime());
            setChatMessages(messages);
            scrollToBottom();
        });

        const getOtherPersonImageUrl = async () => {
            const q = query(collection(firestore, 'Users'), where('Uid', "==", messageUid));
            const usersDocs = await getDocs(q);
            if (!usersDocs.empty) {
                const userImage = usersDocs.docs[0].data().ImageUrl;
                setOtherPersonImageUrl(userImage);

            }
        }

        // marking the chat message and listening for the downward of the scroll chat behaviour
        const messageBox = messageBoxRef.current;
        if (!messageBox) return;

        const handleScroll = () => {
            const messages = Array.from(chatMessages.map((message) => document.getElementById(message.messageDocId)!));
            messages.forEach((message) => {
                const rect = (message as HTMLElement).getBoundingClientRect();
                if (rect.top >= 0 && rect.bottom <= window.innerHeight * 1.5) {
                    // Message is at least 50% visible
                    const messageId = (message as HTMLElement).dataset.messageId;
                    console.log('listening for the scroll event with the messageId', messageId);
                    if (messageId) {
                        const messageData = chatMessages.find((msg) => msg.messageDocId === messageId);
                        if (messageData && !messageData.docData.Status && messageData.docData.From !== uid) {
                            markMessageAsSeen(messageId);
                        }
                    }
                }
            });
        };


        // Attach scroll event listener to the message box
        messageBox.addEventListener('scroll', handleScroll);

        



        // Clean up the listener when component unmounts
        return () => {
            unsubscribe();
            getOtherPersonImageUrl();
            messageBox.removeEventListener('scroll', handleScroll);
          
        };
    }, [chatMessages]); // Empty dependency array to run only once when component mounts

    const markMessageAsSeen = async (messageId: string) => {
        console.log('changing the message seen for the message doc id is', messageId);
        const docRef = doc(firestore, 'Chats', messageId);
        await updateDoc(docRef, {Status: true});
    };

    function getCurrentDate() {
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so we add 1
        const year = String(currentDate.getFullYear()).slice(2); // Get last two digits of the year

        return `${day}/${month}/${year}`;
    }

    const sendMessage = async () => {
        if (messageText.trim() !== "") {
            const currentTime = new Date();
            const hours = String(currentTime.getHours()).padStart(2, '0');
            const minutes = String(currentTime.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            const currentDate = getCurrentDate() // function to get current date

            // Add the message
            const messageData = {
                'From': uid,
                'To': messageUid,
                'MessageText': messageText.trim(),
                'Timestamp': formattedTime,
                'Status': false,
                'Date': currentDate
            };

            const collectionRef = collection(firestore, 'Chats');
            await addDoc(collectionRef, messageData);
            setMessaeText('');
            
        }
    };


    return (
        <main className={styles.body}>
            <div className={styles.messageBox} ref={messageBoxRef} id="messageBox">
                {/* apply messages here  */}
                {chatMessages.map((message, index) => (
                   
                    <div key={message.messageDocId} className={`${message.docData.From === uid ? styles.myMessage : styles.otherMessage}`} id={message.messageDocId}>
                        
                        <p>{message.docData.MessageText}</p>
                        <div className={`${message.docData.From === uid ? styles.myChatMessageData : styles.chatMessageData}`}>
                            <p>{message.docData.Timestamp}</p>

                            {message.docData.Status && message.docData.From == uid ? <img className={styles.otherPersonImage} src={otherPersonImageUrl} alt="Other person image" /> : ''}
                        </div>
                    </div>
                ))}
            </div>
            {/* message input box  */}
            <div className={styles.messageinputBox}>
                <input type="text" className={styles.chatMessageInput} value={messageText} placeholder="Type message..." onChange={(e) => setMessaeText(e.target.value)} />
                <button className={styles.sendChatButton} onClick={sendMessage}><img src="/Send.png" alt="send button icon" /></button>
            </div>
        </main>
    )
}