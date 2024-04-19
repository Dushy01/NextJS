


import { useState, useEffect, SetStateAction } from "react"
import { useGlobalProjectIdContext } from "@/app/context/projectId"
import { useGlobalUidContext } from "@/app/context/uid"
import { firestore } from "@/app/firebase"
import { where, doc, getDoc, collection, query, onSnapshot } from "firebase/firestore"
import styles from './members.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';

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

export default function Members({setOpenMessage, setMessageUid} : MemberFunctionProps) {
    const { projectId } = useGlobalProjectIdContext();
    const { } = useGlobalUidContext();
    const [users, setUsers] = useState<userData[]>([]);

    useEffect(() => {
        const getUsersData = () => {
            // getting the members ids first
            const docRef = doc(firestore, 'Projects', projectId);
            getDoc(docRef).then((document) => {
                if (document.exists()) {
                    const memberIds = document.data().members || [];
                    const userDataList: userData[] = [];
                    memberIds.forEach((ids: string) => {
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

    return (
        <main>
            <div>
                {/* loading the user data */}
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
                                        } className={styles.userChatButton}><img src="/Message.png"/> Message</button>
                                </div>
                            ))}
                        </div> :
                        <div>
                            <p>No Member exist yet!</p>
                        </div>
                }
            </div>
        </main>
    );
}
