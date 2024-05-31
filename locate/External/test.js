
// working on the uuid generation and learning how can i create it for the tasl
// const { v4: uuidv4 } = require('uuid');

// const uniqueId = uuidv4();
// console.log(uniqueId);


const axios = require('axios');
const handleFinishTask = async (assignedEmail, projectName, taskId) => {
    try {
        const response = await axios.post('http://localhost:3000/api/finishTask', {
            assigniesIds: assignedEmail,
            projectName: projectName,
            taskId: taskId
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error finishing task:', error);
    }
};

// Usage example
const assignedEmail = 'agreharshit610@gmail.com';
const projectName = 'Project ABC';
const taskId = '12345';

handleFinishTask(assignedEmail, projectName, taskId);
