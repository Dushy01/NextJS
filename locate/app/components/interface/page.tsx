'use client'
import { useGlobalProjectIdContext } from "@/app/context/projectId"
import { useGlobalUidContext } from "@/app/context/uid"

import styles from './interface.module.css'
import { useState, useEffect } from "react";
import Image from "next/image"
import TaskList from './TaskList';
import TaskStatus from "./functionComponents/TaskStatus/TaskStatus";
import CreateTask from "./functionComponents/CreateTask/CreateTask";
import Members from "./functionComponents/Members/Members";
import Requests from "./functionComponents/Requests/page";
import Chat from "./functionComponents/Members/Chat"
import TaskDetails from "./functionComponents/TaskStatus/TaskDetails";
import { useRouter } from "next/navigation";
// import inviteViaEmail from "../../../../External/invite";
import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';
// import mailgun from 'mailgun-js';
import axios from 'axios';

import { collection, where, query, getDocs, updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/app/firebase";

export default function Interface() {



    const router = useRouter();

    const [inviteEmailUser, setInviteEmailUser] = useState<string>('');
    const { projectId, projectName } = useGlobalProjectIdContext();
    const { uid, imageUrl, setIsProjectMember, isProjectMember } = useGlobalUidContext();
    const [currentComponent, setCurrentComponenet] = useState<string>('Create task');
    const [openProfile, setOpenProfile] = useState<boolean>(false);
    const [showShare, setshowShare] = useState<boolean>(false);
    const [successfulInvite, setSuccessfulInviteUser] = useState<boolean>(false);



    const [openMessage, setOpenMessage] = useState<boolean>(false);
    const [messageUid, setMessageUid] = useState('');
    const [messageImageUrl, setMessagUserImageUrl] = useState<string>('');
    const [messageName, setMessageUserName] = useState<string>('');
    const [messageUserStatus, setMessageUserStatus] = useState<boolean>(false);
    const [showDeleteButton, setShowDeleteButton] = useState<boolean>(false); // to hide and show the delete button for the message header
    const changeDeleteButtonShow = () => {
        setShowDeleteButton(!showDeleteButton)
    }
    // to hold the function that i am going to call for the deletion of the chat
    const [deleteFunction, setDeleteFunction] = useState<(() => void) | undefined>(undefined);

    // for the task status 
    const [openTask, setOpenTask] = useState(false);
    const [taskHeading, setTaskHeading] = useState('');
    const [taskDocumentId, setTaskDocumentId] = useState('');
    const RemoveTask = () => {
        setTaskHeading('');
        setOpenTask(false);
        setTaskDocumentId('')
    }

    const RemoveMessage = () => {
        setOpenMessage(false);
        setMessageUid('');
        setMessagUserImageUrl('');
        setMessageUserName('');
    }


    // state hook to show the task list component
    const [showTaskList, setShowTaskList] = useState<boolean>(false);


    // use the useEffect to cross check if the user is a member or creator of the project
    useEffect(() => {
        const checkForMember = async () => {
            const q = query(collection(firestore, 'Projects'), where('projectName', "==", projectName));
            const documents = await getDocs(q);
            if (!documents.empty) {
                const createdBy = documents.docs[0].data().createdBy;
                console.log('created by', createdBy);
                console.log('uid is', uid);
                if (createdBy != uid) {
                    setIsProjectMember(true);
                    console.log('is project member value ', isProjectMember);
                }
            }
        }

        checkForMember();

        // Function to fetch user data and listen for user status
        const fetchUserDataAndListenStatus = async () => {
            if (messageUid !== '') {
                // Query to get user data
                const userDataQuery = query(collection(firestore, 'Users'), where('Uid', '==', messageUid));

                // Subscribe to real-time updates for user status
                const statusUnsubscribe = onSnapshot(userDataQuery, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'modified') {
                            const userData = change.doc.data();
                            setMessageUserStatus(userData.Status);
                        }
                        // if not modified then get the back value of the status which already exist
                        else {
                            const userData = change.doc.data();
                            setMessageUserStatus(userData.Status);
                        }
                    });
                });

                // Get user data
                const userDataDocs = await getDocs(userDataQuery);
                if (!userDataDocs.empty) {
                    const userDocData = userDataDocs.docs[0].data();
                    setMessageUserName(userDocData.Name);
                    setMessagUserImageUrl(userDocData.ImageUrl);
                }

                // Return an object with unsubscribe functions for cleanup
                return {
                    statusUnsubscribe
                };
            }
        };

        fetchUserDataAndListenStatus();


    }, [messageUid]);

    const changeShare = () => {
        setshowShare(!showShare);
        // setSuccessfulInviteUser(!successfulInvite);
    }

    const OpenProfile = () => {
        setOpenProfile(true);
    }

    // remove the memberId 
    function removeFromArray(array: [], element: string | null) {
        return array.filter(item => item !== element);
    }

    const leaveProject = async () => {
        console.log('leave project is called');
        // first step
        try {
            // Query the user document
            const q = query(collection(firestore, 'Users'), where('Uid', '==', uid));
            const documents = await getDocs(q);

            if (!documents.empty) {
                const userDoc = documents.docs[0];
                const userDocId = userDoc.id;
                const userDocData = userDoc.data();

                // Update the Member variable value with an empty string
                await updateDoc(doc(firestore, 'Users', userDocId), { Member: '' });

                console.log('Member variable updated successfully.');
            } else {
                console.log('No user document found for the provided UID.');
            }
        } catch (error) {
            console.error('Error updating the Member variable:', error);
        }


        // second step
        try {
            const docRef = doc(firestore, 'Projects', projectId);
            const document = await getDoc(docRef);

            if (document.exists()) {
                const documentId = document.id;
                const documentData = document.data();
                const documentMembers = documentData.members || [];

                if (documentMembers.includes(uid)) {
                    const removedMember = removeFromArray(documentMembers, uid);
                    await updateDoc(docRef, { members: removedMember });
                    console.log('Members list has been updated');
                } else {
                    console.log('UID is not included in the member list');
                }
            } else {
                console.log('Document does not exist');
            }
        } catch (error) {
            console.log('Error removing UID from the member list of the project:', error);
        }


        // reroute back to the same page
        router.push('/components/landing');

    };





    const [clickedButton, setClickedButton] = useState<string>('Create task');

    // Function to handle button click
    const handleButtonClick = (buttonName: string) => {
        setCurrentComponenet(buttonName);
        // Update the state to track the clicked button
        setClickedButton(buttonName);
    };


    // Step 1: Define State
    const [accessLevel, setAccessLevel] = useState<string>('Viewer');

    // Step 2: Implement handleChange Function
    const handleChange = (event: any) => {
        setAccessLevel(event.target.value);
    };

    // function to invite the gamil user
    const Invite = async () => {

        // let's see how to run a nodemailer service to send the mail
        // for the unique URL formation
        const unique_url = `http://localhost:3000/components/invitation?projectId=${encodeURIComponent(projectId)}&gmail=${encodeURIComponent(inviteEmailUser)}&accessLevel=${encodeURIComponent(accessLevel)}`;
        // inviteViaEmail(unique_url);

        const response = await axios.post('http://localhost:5000/sendInvite', {
            'inviteTo': inviteEmailUser,
            'UniqueUrl': unique_url
        });

        console.log(response);

        if (response.status === 200) {
            // invite sent successfully
            setshowShare(!showShare);
            setSuccessfulInviteUser(true);
            // After 2 seconds, reset successfulInviteUser to false
            setTimeout(() => {
                setSuccessfulInviteUser(false);
            }, 2000); // 2000 milliseconds = 2 seconds
        }


    };



    return (

        <main className={`${styles.MainContainer}`} >


            <div className={styles.sidebarColumn}>
                <div className={styles.profileDescription}>
                    <img src={imageUrl} alt="Profile image" className={styles.profileImage} />
                    {/* <p className={styles.projectName}>{projectName}</p> */}
                </div>

                <div className={styles.functionButtons}>

                    <button
                        className={`${styles.functionButton} ${clickedButton === 'Create task' ? styles.clickedButton : ''}`}
                        onClick={() => handleButtonClick('Create task')}>
                        Create task
                    </button>

                    <button
                        className={`${styles.functionButton} ${clickedButton === 'Task status' ? styles.clickedButton : ''}`}
                        onClick={() => handleButtonClick('Task status')}
                    >
                        Task status
                    </button>
                    <button
                        className={`${styles.functionButton} ${clickedButton === 'Members' ? styles.clickedButton : ''}`}
                        onClick={() => handleButtonClick('Members')}
                    >
                        Members
                    </button>

                    {
                        isProjectMember ? '' :
                            <button
                                className={`${styles.functionButton} ${clickedButton === 'Requests' ? styles.clickedButton : ''}`}
                                onClick={() => handleButtonClick('Requests')}
                            >
                                Requests
                            </button>
                    }


                    <button
                        className={`${isProjectMember ? styles.SettingButtonExtra : styles.SettingButton}`}
                        onClick={OpenProfile}
                    >
                        <img src="/Settings.png" alt="Setting icon" />
                        Settings

                    </button>
                </div>
            </div>

            <div className={styles.mainBody}>

                {/* conditional rendering of the headerbox  */}

                {
                    openMessage ? (
                        <div className={styles.messageHeader}>
                            { /* show the profile header for the user */}
                            <div className={styles.messageHeaderStatus}>
                                <button className={styles.backButton} onClick={RemoveMessage}><img src="/Back.png" alt="Back image" /></button>
                                <div className={styles.messageHeaderData}>
                                    <div className={styles.messageUserStatus}>
                                        <img className={styles.messageImage} src={messageImageUrl} alt="message user image" />

                                        <div className={`${messageUserStatus ? styles.activeMessageUser : styles.inactiveMessageUser}`}></div>
                                    </div>
                                    <p className={styles.messageUserName}>{messageName}</p>
                                </div>
                                {/* delete button to delete the selected chat with a click of a button */}
                                {
                                    showDeleteButton ?
                                        <button className={styles.deleteButton} onClick={deleteFunction}><img src="/Delete.png" alt="Delete image" /></button>
                                        :
                                        <div></div>
                                }
                            </div>


                        </div>) : openTask ? (
                            <div className={styles.messageHeaderStatus}>
                                <button className={styles.backButton} onClick={RemoveTask}><img src="/Back.png" alt="Back image" /></button>
                                <div className={styles.messageHeaderData}>
                                    {/* here we would pass down the heading of the task to show  */}
                                    <p className={styles.taskHeadingText}>{taskHeading}</p>
                                </div>
                            </div>) :
                        <div className={styles.headerBar}>
                            <button className={styles.ShareButton}
                                onClick={changeShare}
                            >Share
                                <img src="/Share.png" alt="share icon" />
                            </button>
                        </div>

                }


                <div style={{ padding: 10 }}>
                    {
                        openMessage ? (
                            <div>
                                {/* showing the chat message box  */}
                                <Chat setOpenMessage={setOpenMessage} openMessage={false} messageUid={messageUid} changeDeleteButtonShow={changeDeleteButtonShow} onDelete={setDeleteFunction} />
                            </div>) :
                            openTask ? (
                                // component to show the task details 
                                <div>
                                    <TaskDetails taskDocumentId={taskDocumentId} />
                                </div>
                            )
                                :
                                <div>
                                    {/* here the component should be rendered  */}
                                    {currentComponent === 'Create task' && <CreateTask />}
                                    {currentComponent === 'Task status' && <TaskStatus setOpenTask={setOpenTask} setTaskHeading={setTaskHeading} setTaskDocumentId={setTaskDocumentId} />}
                                    {currentComponent === 'Members' && <Members setOpenMessage={setOpenMessage} openMessage={false} setMessageUid={setMessageUid} />}
                                    {/* this should be load conditionally */}

                                    {currentComponent === 'Requests' && <Requests />}
                                </div>
                    }
                </div>
            </div>

            {showShare &&
                <div className={styles.shareProject}>
                    <p className={styles.inviteHeading}>Share your project</p>

                    <FormControl fullWidth >
                        <InputLabel id="demo-simple-select-label"
                            className={styles.selectLevel}
                        >Access level</InputLabel>
                        <Select

                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={accessLevel}
                            label="Access level"
                            onChange={handleChange}

                        >
                            <MenuItem value={'Viewer'} className={styles.selectAccessLevel}>Viewer</MenuItem>
                            <MenuItem value={'Member'} className={styles.selectAccessLevel}>Member</MenuItem>

                        </Select>
                    </FormControl>

                    <div className={styles.InviteEmailSection}>
                        <input className={styles.InviteEmail} type="email" placeholder="Type email" onChange={(e) => setInviteEmailUser(e.target.value)} />
                        <button className={styles.InviteEmailButton} onClick={Invite}>Invite</button>
                    </div>
                </div>}


            {/* user profile for the setting page  */}
            {openProfile &&
                <div className={styles.showProfile} >
                    <div className={styles.profileDescriptionHeader}>

                        <div className={styles.profile}>
                            <img src={imageUrl} alt="profle image" className={styles.profileImage} />
                            <p className={styles.projectName} style={{ color: 'black' }}>{projectName}</p>
                        </div>


                        <button className={styles.cancelButtons} onClick={() => setOpenProfile(false)}><img src="/Cross.png"/></button>
                    </div>

                    {/* content for the profile component */}
                    <div className={styles.userFunctions}>
                        <div className={styles.userFunctionDetails}>
                            <div className={styles.userFunctionsNames}>
                                <p style={{ marginTop: 10, color: 'black' }} className={styles.userFunctionName}>Tasks</p>
                                <p style={{ marginTop: 10, color: 'black' }} className={styles.userFunctionName}>Projects</p>
                            </div>
                            <div className={styles.userFunctionsButtons}>
                                <button className={styles.showList} onClick={() => setShowTaskList(true)}>Open</button> {/* to show the task list as a component */}
                                <button className={styles.showList}>Open</button>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => leaveProject()} className={styles.leaveProject}>Leave Project</button>
                </div>
            }

            {/* show the Task list profile */}
            {showTaskList &&  <TaskList setShowTaskList={setShowTaskList}/>}

            {successfulInvite &&
                <div className={`${successfulInvite} ? ${styles.successfullyInvited} : ' '`}>
                    <img src="/invite.png" alt="Successful invite icon" />
                    <p>Successfully invited</p>
                </div>
            }





        </main>
    )
}

