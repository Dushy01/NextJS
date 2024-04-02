'use client';
// get the uid from the context and check for the Projects array and if their exist one or not 
import { useGlobalUidContext } from "@/app/context/uid"
import { useGlobalProjectIdContext } from "@/app/context/projectId";
import { collection, getDocs, getFirestore, where, addDoc, doc, query, arrayUnion, updateDoc, } from "firebase/firestore";
import { useEffect, useState } from "react";
import styles from './landing.module.css';
import { firestore } from "@/app/firebase";
import { useRouter } from "next/navigation";


export default function landing() {

    interface RequestsMap {
        [key: string]: boolean;
    }
    

    const router = useRouter();

    const [showNewProject, setShowCreateNewProject] = useState<boolean>(false);
    const { uid, imageUrl, userName } = useGlobalUidContext();
    const { projectId, projectName, setProjectId, setProjectName } = useGlobalProjectIdContext();
    console.log('uid value is', uid);
    console.log('image url is', imageUrl);
    const [projects, setProjects] = useState([]);
    const [userPreference, SetUserPreference] = useState('Create')
    const [projectNameCreate, setProjectNameCreate] = useState<string>('');
    const [requestsMap, setRequestsMap] = useState<RequestsMap>({});
    const [showRequest, setShowRequest] = useState<boolean>(false);


    useEffect(() => {
        async function getProjects() {
            try {

                // Construct a reference to the collection
                const collectionRef = collection(firestore, 'Users');

                // Fetch all documents in the collection
                const querySnapshot = await getDocs(collectionRef);

                // Iterate through each document
                querySnapshot.forEach((doc) => {
                    // Get the data of the document
                    const documentData = doc.data();

                    // Check if the 'Uid' field in the document matches the provided UID
                    if (documentData.Uid === uid) {
                        // Return the document data
                        if (documentData.Projects.length > 0) {
                            setProjects(documentData.Projects);
                        }
                    }
                });


            } catch (error) {
                console.error('Error fetching document:', error);

            }
        }

        getProjects();


    }, [uid]);

    // show the requests 
    const showOldRequests = async () => {
        setShowRequest(true);
        // get the requests map with the project name and boolean value 
        // addingg the project name with false value in the map of the user document
        const q = query(collection(firestore, 'Users'), where('Uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const documentId = querySnapshot.docs[0].id;
            const documentData = querySnapshot.docs[0].data();

            // Check if Requests map exists in the document data
            const requestsMap = documentData.Requests || {};
            console.log(requestsMap);
            setRequestsMap(requestsMap);

        }
        else {
            console.log('user does not exist for updating his requests hash map');
        }
    }

    const addProjectNameInMap = async () => {
        try {
            // addingg the project name with false value in the map of the user document
            const q = query(collection(firestore, 'Users'), where('Uid', '==', uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const documentId = querySnapshot.docs[0].id;
                const documentData = querySnapshot.docs[0].data();

                // Check if Requests map exists in the document data
                const requestsMap = documentData.Requests || {};

                // Check if the project name already exists in the requests map
                if (!(projectNameCreate in requestsMap)) {
                    // Add the project name to the requests map with a false value
                    requestsMap[projectNameCreate] = false;

                    // Update the user document with the modified requests map
                    await updateDoc(doc(firestore, 'Users', documentId), { Requests: requestsMap });

                    console.log('Project name added to the requests map successfully.');
                } else {
                    console.log('Project name already exists in the requests map.');
                }

            }
            else {
                console.log('user does not exist for updating his requests hash map');
            }
        }
        catch (error) {
            console.log(error);
        }
    }


    const joinProject = async () => {

        // add thje user uid in the requests list of the project by using the name 
        try {
            const q = query(collection(firestore, 'Projects'), where('projectName', '==', projectName));
            const querySnapshot = await getDocs(q);
            // Check if any documents were found
            if (!querySnapshot.empty) {
                // Extract the document ID from the first document found
                const documentId = querySnapshot.docs[0].id;
                const documentData = querySnapshot.docs[0].data();

                // Get the current requests array
                let requests = documentData.requests || [];

                // Check if the UID already exists in the requests array
                if (!requests.includes(uid)) {
                    // Push the new UID into the requests array
                    requests.push(uid);
                    console.log('UID added to requests successfully.');
                } else {
                    console.log('UID already exists in the requests array.');
                }

                // add the project name with the false value in the user Requests map if not already exist
                await addProjectNameInMap();


                // Update the Firestore document with the modified data
                await updateDoc(doc(firestore, 'Projects', documentId), {
                    requests: requests
                });
            } else {
                console.log('no project with this name exist');
                // show a dialog to the user about that no project with that name exist
            }
        }
        catch (error) {
            console.log('we have faced an error', error);
        }
    }

    // creating new project
    const createProject = async () => {
        if (projectNameCreate.length != 0) {
            const documentData = {
                'projectName': projectNameCreate,
                'createdBy': uid
            }



            // add the 
            const collectionRef = collection(firestore, 'Projects');
            // Add the document to the collection
            const docRef = await addDoc(collectionRef, documentData);
            const document_id = docRef.id;
            console.log('created document id', document_id);


            // setting up the global context id 
            setProjectId(document_id);
            // setting the project name for the global context
            setProjectName(projectName);

            // update the user profile to to add the project name in the user document
            const userRef = collection(firestore, 'Users');
            const querySnapshot = query(userRef, where('Uid', '==', uid));
            const userDocs = await getDocs(querySnapshot);
            if (!userDocs.empty) {
                const userDocument = userDocs.docs[0];
                const doc_refre = doc(firestore, 'Users', userDocs.docs[0].id);
                userDocument.data().Projects
                const updatedProjects = arrayUnion(projectNameCreate);
                await updateDoc(doc_refre, { Projects: updatedProjects });
            }

            // after creating the project navigate the interface pgae 
            router.push(`/components/interface`);

        }
    }

    const getDocumentId = async (projectName: string) => {
        const collection_ref = collection(firestore, 'Projects');
        const querySnapshot = query(collection_ref, where('projectName', '==', projectName));

        const userDocs = await getDocs(querySnapshot);
        const userDocumentId = userDocs.docs[0].id;
        return userDocumentId;
    }

    const navigateProject = async (projectName: string) => {

        setProjectName(projectName);
        // get the project id from the project name and then set up the context value and then navigate to it 
        // defining the project id for the name 
        const projectDocumentId = await getDocumentId(projectName);
        setProjectId(projectDocumentId);
        // navigating the landing pagr
        router.push(`/components/interface`);
    }

    return (

        <main className={styles.body}>
            <div className={styles.profileImageDescription}>
                <img src={imageUrl} alt="Profile image" className={styles.profileImage} />
                {/* <p>{userName}</p> */}
            </div>

            {projects && projects.length > 0 ?
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'left', alignItems: 'flex-start' }}>
                    {/* projects exist then allow user to select one and navigate using dynamic routing  */}
                    <h3 className={styles.projectsStatus}>Select project</h3>
                    {/* building map button for the project */}


                    <div className="container" style={{ marginLeft: -10 }}>
                        <div className="row">
                            {projects.map((element, index) => (
                                <div className="col-md-4 mb-3" key={index}>
                                    <button className="btn btn-dark btn-lg btn-block"
                                        style={{ fontSize: 16 }}
                                        onClick={() => navigateProject(element)}
                                    >{element}</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setShowCreateNewProject(true)} style={{ width: 200 }} className={styles.projectButton}>Create new project</button>
                </div>
                :
                <div>
                    <h3 className={styles.projectsStatus}>Oops! No project exist yet!</h3>
                    <div className="d-flex flex-row justify-center align-center" style={{ gap: 10 }}>
                        <button className={`${styles.userPreferenceButton} ${userPreference === 'Create' ? styles.preferred : ''}`} onClick={() => SetUserPreference('Create')}>Create one</button>
                        <button className={`${styles.userPreferenceButton} ${userPreference === 'Join' ? styles.preferred : ''}`} onClick={() => SetUserPreference('Join')}>Join one</button>
                    </div>

                    {/* this section should be changeable according to the user pref */}
                    {
                        userPreference === 'Create' ?
                            <div style={{ marginTop: 25 }}>
                                <div className={styles.createProject}>
                                    <p>Project name</p>
                                    <input type="text" className={styles.projectName} placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />
                                </div>
                                <button onClick={createProject} className={styles.createButton}>Create</button>
                            </div> :
                            // then show join
                            <div style={{ marginTop: 25 }}>
                                <div className={styles.createProject}>
                                    <p>Project name</p>
                                    <input type="text" className={styles.projectName} placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />
                                </div>
                                <div className="d-flex flex-row" style={{ gap: 10 }}>
                                    <button onClick={joinProject} className={styles.createButton}>Join</button>
                                    <button onClick={showOldRequests} className={styles.requestButton}>Old Requests</button>
                                </div>
                            </div>
                    }
                </div>}


            {/* show the user it's requests data */}
            {showRequest &&
                <div className={styles.showRequestsDialog}>
                    <div className={styles.showRequestHeader}>
                        <p>Project requests</p>
                        <button className={styles.cancelButton} onClick={() => setShowRequest(false)}>Close</button>
                    </div>
                    <div className={styles.requestsData}>
                        {/* show the map data */}
                        {Object.entries(requestsMap).map(([projectName, value]) => (
                            <div key={projectName} style={{display: 'flex', flexDirection: 'row', gap: 150}}>
                                <p style={{fontFamily: 'ReadexPro', fontSize: 18}}>{projectName} </p>
                                <p style={{color: value ? 'green' : 'grey', fontSize: 16}}>{value ? 'Accepted' : 'Waiting'}</p> 
                            </div>
                        ))}
                    </div>
                </div>
            }



            {/* for creating new project */}
            {showNewProject &&
                <div className={styles.NewProjectPopup}>
                    <div className={styles.createProject}>
                        <p>Project name</p>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                            <input type="text" placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />

                            <div style={{ display: 'flex', gap: 10, flexDirection: 'row' }}>
                                <button className={styles.projectButton} onClick={() => setShowCreateNewProject(false)}>cancel</button>
                                <button onClick={createProject} className={styles.projectButton}>Create</button>
                            </div>
                        </div>

                    </div>
                </div>
            }
        </main>
    )
}