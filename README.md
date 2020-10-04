# login-pronote-api
Little Node JS Web Server able to check students and professors ProNote french school platform credentials. It returns a Json object with user infos.

You must set in your environment the STUDENT_LOGIN_URL and PROFESSOR_LOGIN_URL variables and set in them the url to the login page for students and professors.
You must generate an HTTPS certificate and move it to the folder /var/pronote/server.cert and /var/pronote/server.key to be able to use the server (check server.js)
