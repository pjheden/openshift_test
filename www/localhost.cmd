set /p port= [string]
start "" http://localhost:%port% && python -m http.server %port% 
