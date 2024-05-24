


import { useState, useEffect, SetStateAction } from "react"
import { useGlobalProjectIdContext } from "@/app/context/projectId"
import { useGlobalUidContext } from "@/app/context/uid"
import { firestore } from "@/app/firebase"
import { where, doc, getDoc, collection, query, onSnapshot, getDocs } from "firebase/firestore"
import styles from './members.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';


interface TaskDocument {
    DocId: string;
    TaskName: string;
    Deadline: string;
}

interface userData {
    Name: string;
    ImageUrl: string;
    Uid: string;
    Status: boolean;
}

interface MemberFunctionProps {
    setOpenMessage: React.Dispatch<React.SetStateAction<boolean>>;
    setMessageUid: React.Dispatch<React.SetStateAction<string>>;
    openMessage: boolean;
}

export default function Members({ setOpenMessage, setMessageUid }: MemberFunctionProps) {
    const { projectId, projectName } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [users, setUsers] = useState<userData[]>([]);
    const [selectedButton, setSelectedButton] = useState(projectName);
    const [taskDocument, setTaskDocument] = useState<TaskDocument | null>(null);
    const [messageText, setMessageText] = useState<string>('');


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const message = e.target.value;
        setMessageText(message);
        chatTyping(message);
    };


    useEffect(() => {
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
                } else {
                    console.log('Project does not exist');
                }
            });
        };

        getUsersData();
    }, [projectId]); // Listen for changes in projectId


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
                    TaskName: docData['TaskName'],
                    Deadline: docData['Deadline']
                };
                setTaskDocument(fetchedTask); // Store the fetched document in the state
            }
        }
    };

    const closeTaskReference = () => {
        setTaskDocument(null);
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
                <div className={styles.chatBox}>

                </div>
                <div className={styles.chatInput}>
                    {/* create a function on the inout to make the chat up and look for the reference id */}
                    <div className={styles.chatMessageReference}>
                        {
                            taskDocument ?
                                <div className={styles.referenceDiv}>
                                    <div className={styles.referenceRow}>
                                        <div className={styles.referenceData}>
                                            <p>{taskDocument.TaskName}</p>
                                            <p>{taskDocument.DocId}</p>
                                        </div>
                                        <button onClick={closeTaskReference}>Cancel</button>
                                    </div>
                                </div> :
                                <div>

                                </div>
                        }
                        <input className={styles.chatMessageInputBox} onChange={handleInputChange} type="text" placeholder="Type message..." />
                    </div>
                    <button className={styles.sendChatButton}>Send</button>
                </div>
            </div>


            {/* <div>
                


                {
                    users.length > 0 ?
                        <div className={styles.members}>
                            {users.map((user) => (
                                <div key={user.Uid} className={styles.MemberRow}>
                                    <div className={styles.memberData}>
                                        <div className={styles.userStatusRow}>
                                            <img className={styles.userImage} src={user.ImageUrl} alt={user.Name} />
                                            <div className={`${user.Status ? styles.active : styles.inactive}`}></div>
                                        </div>
                                        <p className={styles.userName}>{user.Name}</p>
                                    </div>
                                    <button onClick={
                                        () => AddMessageTab(user.Uid)
                                    } className={styles.userChatButton}><img src="/Message.png" /> Message</button>
                                </div>
                            ))}
                        </div> :
                        <div>
                            <p>No Member exist yet!</p>
                            
                        </div>
                }

            </div> */}


        </main>
    );
}
