

#high level: 
I need to build a web app lication to create, mange and handle resousce booking for our lab for the solutions architechts.
Users should be able to book time ad get resouses assigned with connection information to connect to the lab.
Lab resourses is sutch as : ssh connections, web apps(urls), VPN access, RDP access.


#Techstack:
- NextJS
- Shadcn components
- auth.js for auth (email + password)
- primsa db with postgress backend
- full stack ui + api
- modern design languange
- darkmode / lightmode support
- Docker (needs docker file and docker compose so it can run in docker on a raspberry pi 5)


#Admin functionality:
Admin needs to be able to create lab resources. a lab resource can by example be a SSH connection that is holding : host ip, username, password..
Admin should be able to create other resources sutch as, web app (url). RDP session, VPN credentials

the resouces will be added to "Lab Type" that is a resource that the user can book time with.


#User functionality:
User should be able to look at the lab calaneder to find free slots and book them.
if a user have booked a time, they should not be able to book in a back to back session but needs to ba 3 day cool down for the user.
Aslo back to back sessions in general is never allowd it should allways be a 2hrs gap between so the admin can do maintinance and cleanup of labs.


#UI:
Ui needs to be modern, user frendly and simple. design is important.

