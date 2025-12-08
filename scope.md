High level scope:

web application that allows users to book lab time from avabileslots then getted grated acess to the lab resources


detailes scope:

- nextjs web app running in a docker container
- requires full guide for setup in readme.md
- needs to be able to run local in docker container (docker file, docker compose needed)
- web app should use auth.js for auth (email and password login)
- webapp should use shadcn components
- web app needs modern design and support light mode and darkmode


main functionality:
user should be able to login and view a list / calender view of when lab respurce is avaibile for use.
it should not be able to dubble book time.
its should ba max allowd to book for 8 hrs at time. after a booking the user wil have a 3 days cooldown before they are allow to book a time slot again.
it should allways be a 2 hrs non booking before and after a session. (allowing admin time to clean up lab)
when user booking is confirmed and session is starting the user should get connection infomation in the UI
each booking sessions gets a password that the users needs to save / copy out when booking is made, this pw / code is need to access the booking again.

to dos:
make the  full app with ui, apis +++ to work

tech stack
- docker
- nextjs
- auth.js
- shadcnu
- primsadb with postgress

ask questions if needed then plan