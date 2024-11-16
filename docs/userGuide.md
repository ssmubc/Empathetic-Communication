# User Guide

**Please ensure the application is deployed, instructions in the deployment guide here:**

- [Deployment Guide](./deploymentGuide.md)

Once you have deployed the solution, the following user guide will help you navigate the functions available.

| Index                               | Description                            |
| ----------------------------------- | -------------------------------------- |
| [Administrator View](#admin-view)   | How the Admnistrator views the project |
| [Instructor View](#instructor-view) | How the Instructor views the project   |
| [Student View](#student-view)       | How the Student views the project      |

## Administrator View

To sign up as an administrator, you need to sign up regularly first as a student:
![image](./images/create-account.png)

You then get a confirmation email to verify your email. Once you have a student account, to become an adminstrator, you need to change your user group with Cognito through the AWS Console:
![image](./images/user-pool.png)

After clicking the user pool of the project, you need to find your email:
![image](./images/users.png)

After clicking your email, you can add the 'admin' user group:
![image](./images/add-user-group.png)
![image](./images/select-admin.png)
![image](./images/admin-added.png)

Once the 'admin' user group is added, delete the 'student' user group:
![image](./images/delete-student.png)
![image](./images/only-admin.png)

Upon logging in as an administrator, they see the following home page:
![image](./images/admin-home-page.png)

Clicking the "ADD INSTRUCTOR" button opens a pop-up where the administrator can enter the email address of a user with an account to add them as an administrator:
![image](./images/admin-add-instructor.png)

The administrator can also click an instructor in the list which takes them to a page consisting of that instructor's details which includes their name, email, and active courses:
![image](./images/admin-instructor-details.png)

In the "Courses" tab, the administrator can view a list of the simulation groups available in this project:
![image](./images/admin-courses.png)

Clicking on a simulation group leads to a page where the administrator can view all the instructors in that group while being able to change the status of the group:
![image](./images/admin-active.png)

In the "Create Course" tab, the administrator can create a course by specifying the name, department, and code of the course. The administrator can also assign instructors to the course here while changing the "System Prompt" that the Large Language Model (LLM) uses as intructions when generating responses:
![image](./images/admin-create-course-button.png)
![image](./images/admin-create-course.png)

## Instructor View

Upon logging in as an instructor, they see the following home page:
![image](./images/instructor-home-page.png)

The instructor can click on the "Student View" to see the project how a student would. For more information on how a student views the project, click [here](#student-view). After clicking on a simulation group, the instructor can see the analytics of that course with several insights:
![image](./images/instructor-analytics.png)

Clicking the "Edit Patients" tab leads to a page where the instructor can see a list of patients within the course. Here a new patient can be created or existing patients can be edited or deleted:
![image](./images/instructor-edit-concept.png)

The instructor can set for each patient whether or not they want the LLM to evaluate the student.
![image](./images/instructor-edit-LLM-completion.png)

By clicking the "CREATE NEW PATIENT" button a pop up will open where the instructor can create a new patient.
![image](./images/instructor-create-concept-button.png)

The patient's name, age and gender can be specified here along with a patient prompt to influence how they will act.
![image](./images/instructor-create-concept1.png)

The instructor can then upload LLM, Patient and Answer Key files to this patient from their device. `PDF`, `DOCX`, `PPTX`, `TXT`, `XLSX`, `XPS`, `MOBI`, and `CBZ` file types are supported. The "SAVE PATIENT" button here saves the patient:
![image](./images/instructor-create-concept2.png)
![image](./images/instructor-create-concept3.png)

By clicking the "EDIT" button a pop up will open where the instructor can edit the patient.
![image](./images/instructor-change-concept-button.png)

The patient's name, age and gender can be edited here along with its patient prompt to influence how they will act. The instructor can also edit the LLM, Patient and Answer Key files for the patient.
![image](./images/instructor-change-concept.png)
![image](./images/instructor-change-patient1.png)
![image](./images/instructor-change-patient2.png)
![image](./images/instructor-change-patient3.png)

Clicking the "Prompt Settings" tab leads to a page where the instructor can change the prompt applied to the LLM for this specific course. Upon applying a new prompt, the instructor can also scroll to previous prompts the course used:
![image](./images/instructor-prompt-settings.png)
![image](./images/instructor-prompt-settings1.png)

Clicking the "View Students" tab leads to a page where the instructor can view all the students in this simulation group. The "Access Code" of the group is a special code that allows students to join the group. The instructor will have to send this code to them. The instructor can also generate a new group code on this page:
![image](./images/instructor-view-students.png)

The instructor can then click on a student which takes them to that student's chat logs for every module in the simulation group. Each tab represents a different module. Different conversations with the LLM are rendered as different drop downs:
![image](./images/instructor-view-student-logs.png)

By clicking the session drop down we can view the chat history between that student and the LLM.
![image](./images/instructor-view-student-chat-history.png)

The instructor can also set the completion status for a student on this page but toggling the switch for the patients.
![image](./images/instructor-view-student-completion.png)

## Student View

Upon logging in as an student, they see the following home page:
![image](./images/student-home-page.png)

We are going to be looking at the CPSC 210 course as an example. Upon selecting CPSC 210, the student is shown a list of concepts at the top: Basics, Abstraction, Construction, and Design. Within each concept, there are several modules. For example, the Basics concept has the Program Structure, Methods And Calls, Classes, and Data Flow modules:
![image](./images/student-modules.png)

If we click the "Review" button beside the Program Structure module, we are taken to a page where an LLM asks us a question and creates a new conversation:
![image](./images/student-new-conversation.png)

The student can then answer the questions the LLM asks in a conversation manner. Upon answering multiple questions correctly, the LLM determines when the student has achieved competency over the module:
![image](./images/student-conversation-1.png)
![image](./images/student-conversation-2.png)

Upon going back to the list of modules in this course, the student can see their learning journey as the module they achieved competency for is complete. The concept that module belonged to has also slightly changed in color by going from an inital red color to orange:
![image](./images/student-complete-module.png)

After completing more modules, the concept those modules belongs to gradually changes color to show the student's learning journey:
![image](./images/student-complete-module-1.png)
![image](./images/student-complete-module-2.png)
![image](./images/student-complete-module-3.png)
