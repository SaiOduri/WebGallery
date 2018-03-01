# WebGallery

## How it works!

Have you ever used Instagram before? This is very similar. Using JavaScript I made a web gallery where you can share photos with friends. You can signup/signin, add photos to your gallery, checkout other user gallerys and even comment on pictures.

The landing screen:
<img src="landing screen.png" alt="test" width = "100%">

After Posting an Image:
<img src="image post.png" alt="test" width = "100%">

Viewing Other Gallerys:
<img src="View Users.png" alt="test" width = "100%">

Comment Section (Logged in as Justin):
<img src="Comment Section.png" alt="test" width = "100%">

## Authentication

Authentication is set up so users can only delete comments or pictures if they own them or simply delete a comment if it's on their picture. This uses express session combined with cookies in order to start a session for each signed in user.


## Database Storage

Users, comments and pictures are stored on an nedb database. All important information is stored on the backend and passwords are even encrypted with a salted hash! The website is fully functional on the front end and works perfectly with the db.
