
import styles from './edittask.module.css';


interface EditTask {
    taskDocumentId: string;
}

export default function EditTask({taskDocumentId}: EditTask) {
    return (
        <main>
            <p>{taskDocumentId}</p>
        </main>
    )
}