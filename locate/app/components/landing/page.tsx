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

    const router = useRouter();
    
    const [showNewProject, setShowCreateNewProject] = useState<boolean>(false);
    const { uid, imageUrl, userName } = useGlobalUidContext();
    const { projectId, projectName, setProjectId, setProjectName } = useGlobalProjectIdContext();
    console.log('uid value is', uid);
    console.log('image url is', imageUrl);
    const [projects, setProjects] = useState([]);

    const [projectNameCreate, setProjectNameCreate] = useState<string>('');
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
            const querySnapshot = query(userRef, where('Uid',  '==', uid));
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

    const navigateProject = async (projectName : string) => {

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
            <p>{userName}</p>
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
                    <h3 className={styles.projectsStatus}>Oops! No prject exist yet!</h3>
                    <h4 style={{ fontSize: 22 }}>Create one</h4>
                    <div className={styles.createProject}>
                        <p>Project name</p>
                        <input type="text" placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />
                    </div>
                    <button onClick={createProject} className={styles.createButton}>Create</button>
                </div>}

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