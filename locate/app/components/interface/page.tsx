'use client'
import { useGlobalProjectIdContext } from "@/app/context/projectId"
import { useGlobalUidContext } from "@/app/context/uid"
import './page.css';
import styles from './interface.module.css'
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import TaskStatus from "./functionComponents/TaskStatus/TaskStatus";
import CreateTask from "./functionComponents/CreateTask/CreateTask";
import Members from "./functionComponents/Members/Members";
import Requests from "./functionComponents/Requests/page";
// import inviteViaEmail from "../../../../External/invite";
import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';
// import mailgun from 'mailgun-js';
import axios from 'axios';
import Image from "next/image";

export default function Interface() {



    const [inviteEmailUser, setInviteEmailUser] = useState<string>('');
    const { projectId, projectName } = useGlobalProjectIdContext();
    const { uid, imageUrl } = useGlobalUidContext();
    const [currentComponent, setCurrentComponenet] = useState<string>('Task status');
    const [openProfile, setOpenProfile] = useState<boolean>(false);
    const [showShare, setshowShare] = useState<boolean>(false);
    const [successfulInvite, setSuccessfulInviteUser] = useState<boolean>(false);
    const changeShare = () => {
        setshowShare(!showShare);
        // setSuccessfulInviteUser(!successfulInvite);
    }

    const OpenProfile = () => {
        setOpenProfile(true);

    }

    // const inviteViaEmail = (url : string) => {
    //     const DOMAIN = "sandbox99b2efb40c86476f9147da497070a2ff.mailgun.org";
    //     const mg = mailgun({ apiKey: "ad8a488ee07e8f4a25b869a8d7727990-f68a26c9-2e0f8986", domain: DOMAIN });

    //     const data = {
    //         from: "Mailgun Sandbox <postmaster@sandbox99b2efb40c86476f9147da497070a2ff.mailgun.org>",
    //         to: "agreharshit610@gmail.com",
    //         subject: "Hello",
    //         text: `You have been invited to join a project. Click on the link below to accept the invitation:\n\n${url}`
    //     };

    // }

    const [clickedButton, setClickedButton] = useState<string>('');

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

        <main className={`${styles.MainContainer} ${openProfile ? styles.blurBack : ''}`} style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>


            <div className={styles.sidebarColumn}>
                <div className={styles.profileDescription}>
                    <img src={imageUrl} alt="Profile image" className={styles.profileImage} onClick={OpenProfile} />
                    <p className={styles.projectName}>{projectName}</p>
                </div>

                <div className={styles.functionButtons}>
                    <button
                        className={`${styles.functionButton} ${clickedButton === 'Create task' ? styles.clickedButton : ''}`}
                        onClick={() => handleButtonClick('Create task')}
                    >
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

                    <button
                        className={`${styles.functionButton} ${clickedButton === 'Requests' ? styles.clickedButton : ''}`}
                        onClick={() => handleButtonClick('Requests')}
                    >
                        Requests
                    </button>
                </div>
            </div>

            <div className={styles.mainBody}>
                <div className={styles.headerBar}>
                    <button className={styles.ShareButton}
                        onClick={changeShare}
                    >Share
                        <FontAwesomeIcon icon={faShare} style={{ color: '#63E6BE' }} />
                    </button>
                </div>
                <div style={{ padding: 10 }}>
                    {/* here the component should be rendered  */}
                    {currentComponent === 'Create task' && <CreateTask />}
                    {currentComponent === 'Task status' && <TaskStatus />}
                    {currentComponent === 'Members' && <Members />}
                    {currentComponent === 'Requests' && <Requests />}
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



            {openProfile &&
                <div className={styles.showProfile} >
                    <div className={styles.profileDescriptionHeader}>
                        <div className={styles.profile}>
                            <img src={imageUrl} alt="profle image" className={styles.profileImage} />
                            <p className={styles.projectName} style={{ color: 'white' }}>{projectName}</p>
                        </div>
                        <button className={styles.cancelButtons} onClick={() => setOpenProfile(false)}>Close</button>
                    </div>
                </div>
            }

            {successfulInvite &&
                <div className={`${successfulInvite} ? ${styles.successfullyInvited} : ' '`}>
                    <img src="/invite.png" alt="Successful invite icon" />
                    <p>Successfully invited</p>
                </div>
            }



        </main>
    )
}

