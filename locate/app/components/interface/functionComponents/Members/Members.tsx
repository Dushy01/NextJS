


import { useState, useEffect, SetStateAction, useRef } from "react"
import { useGlobalProjectIdContext } from "@/app/context/projectId"
import { useGlobalUidContext } from "@/app/context/uid"
import { firestore } from "@/app/firebase"
import { where, doc, getDoc, collection, query, onSnapshot, getDocs, orderBy, addDoc } from "firebase/firestore"
import styles from './members.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faL, faMessage } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from "next/navigation" 
// group chat message 
interface messageDoc {
    messageDoc: string;
    docData: {
        From: string;
        Message: string;
        TimeStamp: string;
        ViewedBy: string[];
        Date: string;
    }
}



// reference document
interface TaskDocument {
    DocId: string;
    TaskName: string;
    Deadline: string;
}


// users data
interface userData {
    Name: string;
    ImageUrl: string;
    Uid: string;
    Status: boolean;
}

interface MemberFunctionProps {
    setOpenMessage: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentComponenet: React.Dispatch<React.SetStateAction<string>>;
    setTaskId: React.Dispatch<React.SetStateAction<string>>;
    setMessageUid: React.Dispatch<React.SetStateAction<string>>;
    openMessage: boolean;
}

export default function Members({ setOpenMessage, setTaskId, setCurrentComponenet, setMessageUid }: MemberFunctionProps) {
    const { projectId, projectName } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [users, setUsers] = useState<userData[]>([]);
    const [selectedButton, setSelectedButton] = useState(projectName);
    const [taskDocument, setTaskDocument] = useState<TaskDocument | null>(null);
    const [messageText, setMessageText] = useState<string>('');

    const [chatMessages, setChatMessages] = useState<messageDoc[]>([]);

    const router = useRouter();



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const message = e.target.value;
        setMessageText(message);
        chatTyping(message);
    };


    useEffect(() => {
        // getting users chat messages 
        const q = query(
            collection(firestore, 'GroupChat'),
            orderBy('Date', 'asc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const messages: messageDoc[] = [];
            snapshot.forEach((doc: any) => {
                // here to include the viewed by update check conditon if the uid does not exist in the ViewedBy list then add it inside 
                messages.push({
                    messageDoc: doc.id,
                    docData: doc.data() as messageDoc['docData']
                });
            });
            setChatMessages(messages);

            // store the message in the dict and then in the useState hook
            const isReference: {[key: string]: boolean} = {};
            for (const message of messages) {
                const result =  checkMessageForReference(message.docData.Message);
                if (result) {
                    checkMessageText(message.messageDoc, message.docData.Message);
                    isReference[message.messageDoc] = true;
                }
            }

            // set the boolean state
            setIsReferenceMessage(isReference);

            // Fetch viewedBy images for each message
            // const limitedMessages = messages.slice(0, 3);
            for (const message of messages) {
                await fetchViewedByImages(message.messageDoc, message.docData.ViewedBy);
            }
        });





        // user data for the members showing
        const getUsersData = () => {
            // getting the members ids first
            const docRef = doc(firestore, 'Projects', projectId);
            getDoc(docRef).then((document) => {
                if (document.exists()) {
                    const memberIds = document.data().members || [];
                    const filteredMemberIds = memberIds.filter((memberId: any) => memberId !== uid);
                    const userDataList: userData[] = [];
                    filteredMemberIds.forEach((ids: string) => {
                        const memberQuery = query(collection(firestore, 'Users'), where('Uid', "==", ids))
                        onSnapshot(memberQuery, (querySnapshot) => {
                            querySnapshot.forEach((doc) => {
                                const userDoc = doc.data();
                                const userData: userData = {
                                    'Name': userDoc.Name,
                                    'ImageUrl': userDoc.ImageUrl,
                                    'Uid': userDoc.Uid,
                                    'Status': userDoc.Status
                                };
                                // Update user data list
                                setUsers((prevUsers) => {
                                    const index = prevUsers.findIndex((user) => user.Uid === userData.Uid);
                                    if (index !== -1) {
                                        const updatedUsers = [...prevUsers];
                                        updatedUsers[index] = userData;
                                        return updatedUsers;
                                    } else {
                                        return [...prevUsers, userData];
                                    }
                                });
                            });
                        });
                    });
                    console.log(users);
                } else {
                    console.log('Project does not exist');
                }
            });
        };


        // clean up the listner after unmounting the component
        return () => {
            unsubscribe();
            getUsersData();
        }


    }, [projectId]); // Listen for changes in projectId

    const messageBoxRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef<boolean>(true);

    useEffect(() => {
        const messageBox = messageBoxRef.current;
        if (messageBox) {
            if (isAtBottomRef.current) {
                messageBox.scrollTop = messageBox.scrollHeight;
            }
        }
    }, [chatMessages]);

    const handleScroll = () => {
        const messageBox = messageBoxRef.current;
        if (messageBox) {
            const isAtBottom = messageBox.scrollHeight - messageBox.scrollTop === messageBox.clientHeight;
            isAtBottomRef.current = isAtBottom;
        }
    };

    function getCurrentDate() {
        const currentDate = new Date();
        return currentDate.toISOString(); // returns the date in ISO 8601 format
    }

    // function for formatting the document 
    const formatDate = (dateString: string) => {
        const options: any = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // grouping the messages with the date 
    const groupMessagesByDate = (messages: messageDoc[]) => {
        const groupedMessages: { [key: string]: messageDoc[] } = {};

        messages.forEach(message => {
            const date = formatDate(message.docData.Date);
            if (!groupedMessages[date]) {
                groupedMessages[date] = [];
            }
            groupedMessages[date].push(message);
        });

        return groupedMessages;
    };

    const groupedMessages = groupMessagesByDate(chatMessages);

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
                'Message': messageText.trim(),
                'TimeStamp': formattedTime,
                'ViewedBy': [],
                'Date': currentDate
            };

            const collectionRef = collection(firestore, 'GroupChat');
            await addDoc(collectionRef, messageData);
            setMessageText('');
        }
        
    };


    const AddMessageTab = (Uid: string) => {
        setOpenMessage(true);
        // setting up the new call up
        setMessageUid(Uid);
    }


    const chatTyping = async (message: string) => {
        const regex = /@\w+-\w+-\w+-\w+-\w+/g;
        const matches = message.match(regex);
        console.log(matches);
        if (matches) {
            const id = matches[0].slice(1); // Extract the first matched ID without the @
            console.log(id);
            const docRef = query(collection(firestore, 'Tasks'), where('TaskID', "==", id));
            const querySnapshot = await getDocs(docRef);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const docData = doc.data();
                console.log(docData);
                const fetchedTask: TaskDocument = {
                    DocId: doc.id,
                    TaskName: docData['Heading'],
                    Deadline: docData['Deadline']
                };
                setTaskDocument(fetchedTask); // Store the fetched document in the state
            }
        }
    };

    const closeTaskReference = () => {
        setTaskDocument(null);
    }

    const [storeMessageForReference, setStoreMessageForReference] = useState<{ [key: string]: string[] }>({});
    // a useState hook based dict to store the boolean value with the message doc id and the nature of being a reference either true or false 
    const [isReferenceMessage, setIsReferenceMessage] = useState<{ [key: string]: boolean }>({}); // docId: boolean result 

    // to check if the message is a reference message 
    // const checkMessageText = (messageDocId: string, chatMessage: string) => {
    //     const regex = /@\w+-\w+-\w+-\w+-\w+/g;
    //     const matches = chatMessage.match(regex);
    //     if (matches) {

    //         console.log('True');
    //         // store the data message in the dict and dict structure would be this 

    //         return true;
    //     }

    //     return false;
    // }

    const fetchTaskDetails = async (taskId: string) => {
        const docRef = query(collection(firestore, 'Tasks'), where('TaskID', "==", taskId));
        const querySnapshot = await getDocs(docRef);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const docData = doc.data();
            return [docData['Heading'], taskId]; // Return the heading and the task ID
        }
        return [];
    };

    const checkMessageForReference = (chatMessage: string) => {
        const regex = /\b\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\b/g; // Updated regex to match UUIDs
        const matches = chatMessage.match(regex);
        if (matches) {
            return true;
        }
        return false;
    }

    const checkMessageText = async (messageDocId: string, chatMessage: string) => {
        const regex = /\b\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\b/g; // Updated regex to match UUIDs
        const matches = chatMessage.match(regex);
        if (matches) {
            console.log('True');

            // Extract the task ID from the matches array
            const taskId = matches[0]; // No need to remove '@' character

            // Fetch task details
            const taskDetails = await fetchTaskDetails(taskId);

            if (taskDetails.length > 0) {
                setStoreMessageForReference((prev) => ({
                    ...prev,
                    [messageDocId]: taskDetails
                }));
            }
        }
    };

    const [senderImages, setSenderImages] = useState<{ [key: string]: string }>({});
    const [senderNames, setSenderNames] = useState<{ [key: string]: string }>({});
    // to store the doc id for the messages with the url
    const [viewedByImages, setViewedByImages] = useState<{ [key: string]: string[] }>({});


    const fetchViewedByImages = async (docId: string, viewedBy: string[]) => {
        const imageUrls: string[] = await Promise.all(viewedBy.map(async (userId) => {
            const docRef = query(collection(firestore, 'Users'), where('Uid', "==", userId));
            const docSnapshot = await getDocs(docRef);
            if (!docSnapshot.empty) {
                const docData = docSnapshot.docs[0].data();
                return docData['ImageUrl'];
            }
            return '';
        }));

        setViewedByImages((prev) => ({ ...prev, [docId]: imageUrls }));
    }



    const getSenderImage = async (senderId: string) => {
        if (senderImages[senderId]) {
            return senderImages[senderId];
        }
        const docRef = query(collection(firestore, 'Users'), where('Uid', "==", senderId));
        const docSnapshot = await getDocs(docRef);
        if (!docSnapshot.empty) {
            const docData = docSnapshot.docs[0].data();
            const imageUrl = docData['ImageUrl'];
            setSenderImages((prev) => ({ ...prev, [senderId]: imageUrl }));
            return imageUrl;
        }
        return '';
    }

    const getSenderName = async (senderId: string) => {
        if (senderNames[senderId]) {
            return senderNames[senderId];
        }
        const docRef = query(collection(firestore, 'Users'), where('Uid', "==", senderId));
        const docSnapshot = await getDocs(docRef);
        if (!docSnapshot.empty) {
            const docData = docSnapshot.docs[0].data();
            const name = docData['Name'];
            setSenderNames((prev) => ({ ...prev, [senderId]: name }));
            return name;
        }
        return '';
    }

    useEffect(() => {
        const fetchData = async () => {
            const senderIds = chatMessages.map(msg => msg.docData.From);
            for (const senderId of senderIds) {
                await getSenderImage(senderId);
                await getSenderName(senderId);
            }

            // get the chat message and get the doc id and get the viewedby and add them in the supposed list of the dict 


        };

        fetchData();
    }, [chatMessages]);


    const [OpenViewedBy, setOpenViewedBy] = useState(false);
    // Create a new useState for the for the dict view personImageUrl: name from his doc
    const [viewedBy, setViewedBy] = useState<{ [key: string]: string }>({});
    // function to open the message viewed div for the peoples
    const openViewedBy = async (viewedByUrls: string[]) => {
        setOpenViewedBy(true);
        const viewedByUrlDict: { [key: string]: string } = {};
        for (const viewedByUrl of viewedByUrls) {
            const docRef = query(collection(firestore, 'Users'), where('ImageUrl', "==", viewedByUrl));
            const docSnaphsot = await getDocs(docRef);
            if (!docSnaphsot.empty) {
                const docData = docSnaphsot.docs[0].data();
                viewedByUrlDict[viewedByUrl] = docData['Name']
            }
        }

        setViewedBy(viewedByUrlDict);
    }

    const closeViewedBy = () => {
        setViewedBy({});
        setOpenViewedBy(false);
    }

    // function to navigate to the next Page
    const navigateToTask = (docData: string[]) => {
        const taskId = docData[1];
        setTaskId(taskId);
        setCurrentComponenet('Task'); // set the current component blank
        
        
        // router.push(`/components/Task/${taskId}`);   
    }




    return (
        <main className={styles.ChatInterface}>

            {/* dividing the two section from this part */}
            <div className={styles.LeftContainer}>
                <button className={`${styles.chatButton} ${selectedButton == projectName ? styles.activeChat : styles.inactiveChats}`}>{projectName}</button>

                {/* member data would be here to show in the chat */}
                {
                    users.length > 0 ?
                        <div className={styles.members}>

                            {users.map((user) => (

                                <div key={user.Uid} className={styles.MemberRow}>

                                    <div className={styles.memberData} onClick={() => AddMessageTab(user.Uid)}>

                                        <div className={styles.userStatusRow}>
                                            <img className={styles.userImage} src={user.ImageUrl} alt={user.Name} />
                                            <div className={`${user.Status ? styles.active : styles.inactive}`}></div>
                                        </div>

                                        <p className={styles.userName}>{user.Name}</p>

                                    </div>

                                </div>

                            ))}

                        </div> :
                        <div>

                        </div>
                }

            </div>

            <div className={styles.RightContainer}>
                {/* task document to include styles for the reference task based input box */}
                <div id="messageBox" ref={messageBoxRef} onScroll={handleScroll} className={` ${taskDocument ? styles.chatReferenceCreated : styles.chatBox}`}>

                    {Object.keys(groupedMessages).map(date => (

                        <div key={date}>

                            <div className={styles.dateHeader}>{date}</div>

                            {groupedMessages[date].map((message) => (

                                <div style={{ marginTop: 10 }} key={message.messageDoc} className={`${message.docData.From === uid ? styles.myMessage : styles.otherMessage} ${ isReferenceMessage[message.messageDoc] ? styles.referenceMessage : styles.normalMessage}`} id={message.messageDoc}>
                                    { isReferenceMessage[message.messageDoc] ?
                                        /* styling and data for the reference message */
                                        <div>

                                            {message.docData.From != uid ?
                                                // styles for the text which are not sent by me 
                                                <div className={styles.referenceMessageOther} onClick={() => navigateToTask(storeMessageForReference[message.messageDoc])}>
                                                    {/* data to hold for the reference */}
                                                    <div className={styles.referenceMessageHeader}>
                                                        {storeMessageForReference[message.messageDoc] && (
                                                            <div className={styles.taskDetails}>
                                                                {storeMessageForReference[message.messageDoc].map((detail, index) => (
                                                                    <p style={{fontWeight: '400'}} key={index}>{detail}</p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* message data */}
                                                    {/* here would hold the message and viewed by and the sent time */}
                                                    <div className={styles.referenceMessageBottom}>
                                                        <div className={styles.normalMessageHeader}>
                                                            {senderImages[message.docData.From] && <img className={styles.noramlMessageHeaderImage} src={senderImages[message.docData.From]} alt="Sender profile picture" />}
                                                            <p className={styles.senderName}>{senderNames[message.docData.From]}</p>
                                                        </div>
                                                        <p>{message.docData.Message}</p>
                                                        <div className={styles.normalMessageBottom}>
                                                            <div className={styles.viewedByImagesCollection}>
                                                                {/* list to show the message is viewed by the person as image */}
                                                                {viewedByImages[message.messageDoc] && (
                                                                    <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                        {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                            <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className={styles.messageTimestamp}>{message.docData.TimeStamp}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                :
                                                // styles for the text which is sent by me
                                                <div className={styles.referenceMessageMy} >
                                                    <div className={styles.referenceMessageHeader}>
                                                        {storeMessageForReference[message.messageDoc] && (
                                                            <div className={styles.taskDetails}>
                                                                {storeMessageForReference[message.messageDoc].map((detail, index) => (
                                                                    <p style={{fontWeight: '400', color: 'black'}} key={index}>{detail}</p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={styles.referenceMessageBottom}>
                                                        <p className={styles.myReferenceMessage}>{message.docData.Message}</p>
                                                        <div className={styles.normalMyMessageBottom}>
                                                            <p className={styles.messageTimestampMyReference}>{message.docData.TimeStamp}</p>
                                                            <div className={styles.viewedByImagesCollection}>
                                                                {/* list to show the message is viewed by the person as image */}
                                                                {viewedByImages[message.messageDoc] && (
                                                                    <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                        {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                            <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            }

                                        </div>
                                        :
                                        /* styling and data for the normal message  */
                                        <div>
                                            {message.docData.From != uid ?
                                                // message send by someone else in thre group
                                                <div>
                                                    <div className={styles.normalMessageHeader}>
                                                        {senderImages[message.docData.From] && <img className={styles.noramlMessageHeaderImage} src={senderImages[message.docData.From]} alt="Sender profile picture" />}
                                                        <p className={styles.senderName}>{senderNames[message.docData.From]}</p>
                                                    </div>
                                                    <p>{message.docData.Message}</p>
                                                    <div className={styles.normalMessageBottom}>
                                                        <div className={styles.viewedByImagesCollection}>
                                                            {/* list to show the message is viewed by the person as image */}
                                                            {viewedByImages[message.messageDoc] && (
                                                                <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                    {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                        <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className={styles.messageTimestamp}>{message.docData.TimeStamp}</p>
                                                    </div>
                                                </div>
                                                :
                                                // message sent by me should be 
                                                <div>
                                                    <p>{message.docData.Message}</p>
                                                    <div className={styles.normalMyMessageBottom}>
                                                        <p className={styles.messageTimestamp}>{message.docData.TimeStamp}</p>
                                                        <div className={styles.viewedByImagesCollection}>
                                                            {/* list to show the message is viewed by the person as image */}
                                                            {viewedByImages[message.messageDoc] && (
                                                                <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                    {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                        <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>

                            ))}

                        </div>

                    ))}


                </div>


                <div className={`${taskDocument ? styles.chatInputReference : styles.chatInput}`}>

                    {/* create a function on the inout to make the chat up and look for the reference id */}
                    <div className={styles.chatMessageReference}>

                        {
                            taskDocument ?
                                <div className={styles.referenceDiv}>



                                    <div className={styles.referenceData}>

                                        <p className={styles.referenceTaskName}>{taskDocument.TaskName}</p>
                                        <p className={styles.referenceTaskId}>{taskDocument.DocId}</p>

                                    </div>

                                    <button className={styles.cancelReferenceButton} onClick={closeTaskReference}><img src="/Cross.png" alt="Close icon" /></button>


                                </div>
                                :
                                <div>

                                </div>
                        }

                        <input className={styles.chatMessageInputBox} onChange={handleInputChange} type="text" placeholder="Type message..." />

                    </div>

                    <button onClick={sendMessage} className={styles.sendChatButton}>Send</button>
                </div>


            </div>


            {OpenViewedBy &&
                <div className={styles.viewedByDiv}>
                    {/* show up the viewed by dict for the users  */}
                    <div className={styles.viewedByDivHeader}><p>Viewed By</p><button className={styles.viewedByCloseButton} onClick={closeViewedBy}><img src="/Cross.png" alt="close button icon" /></button></div>
                    <div className={styles.viewedByColumn}>
                        {Object.entries(viewedBy).map(([url, name]) => (
                            <div key={url} className={styles.viewedByItem}>
                                <img src={url} alt={name} className={styles.viewedByItemImage} />
                                <p className={styles.viewedByItemName}>{name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            }


        </main>
    );
}
