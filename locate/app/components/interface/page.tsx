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
// import inviteEmail from "../../../../External/invite";
import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';





export default function Interface() {

   

    const [inviteEmailUser, setInviteEmailUser] = useState<string>('');
    const { projectId, projectName } = useGlobalProjectIdContext();
    const { uid, imageUrl } = useGlobalUidContext();
    const [currentComponent, setCurrentComponenet] = useState<string>('Task status');
    const [openProfile, setOpenProfile] = useState<boolean>(false);
    const [showShare, setshowShare] = useState<boolean>(false);
    const changeShare = () => {
        setshowShare(!showShare);
    }

    const OpenProfile = () => {
        setOpenProfile(true);
    }

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
        // inviteEmail(inviteEmailUser ,unique_url);
    };



    return (

        <main className={styles.MainContainer}>


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

        </main>
    )
}