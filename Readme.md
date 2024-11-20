A backend service for a video streaming application that handles user authentication, video uploads, streaming, and other related functionalities.

Features
User authentication and authorization
Video upload and storage
Video streaming
Management of user data and videos
Technologies Used
Node.js: Backend runtime
Express: Web framework
MongoDB: Database
Multer: File uploads
JWT: Authentication
Cloudinary: Video storage and management
Folder Structure
/controllers - Contains logic for handling API requests
/routes      - Defines API routes
/models      - MongoDB models
/utils       - Helper functions
API Endpoints
User Controllers
1. generateAccessAndRefreshTokens: Creates and returns access and refresh tokens for a user.
2. registerUser: Handles user registration, including uploading avatar and cover images.
3. loginUser: Authenticates a user with email/username and password and generates tokens.
4. logOutUser: Logs out the user by clearing refresh tokens and cookies.
5. refreshAccessToken: Refreshes the access token using a valid refresh token.
6. changeCurrentPassword: Updates the user's password after validating the old password.
7. getCurrentUser: Fetches the currently authenticated user's details.
8. updateAccountDetails: Updates the user's full name and email.
9. updateUserAvatar: Updates the user's avatar image by uploading it to Cloudinary.
10. updateUserCoverImage: Updates the user's cover image by uploading it to Cloudinary.
11. getUserChannelProfile: Fetches detailed user profile information for a channel.

Video Controllers
1. getAllVideos: Retrieves all videos based on query, sorting, and pagination criteria.
2. publishAVideo: Uploads a video and thumbnail to Cloudinary and creates a video record.
3. getVideoById: Fetches a specific video by its ID.
4. updateVideo: Updates video details like title, description, and thumbnail.
5. deleteVideo: Deletes a video and its associated files from Cloudinary.
6. togglePublishStatus: Toggles the published status of a video.

Tweet Controllers
1. createTweet: Creates a tweet with content and links it to the logged-in user.
2. getUserTweets: Fetches all tweets by a specific user based on their user ID.
3. updateTweet: Updates the content of a tweet if the user is its owner.
4. deleteTweet: Deletes a tweet if the user is its owner.

Subscription Controllers
1. toggleSubscription: Allows a user to subscribe or unsubscribe from a channel by toggling the subscription status.
2. getUserChannelSubscribers: Fetches the list of users who have subscribed to a specific channel.
3. getSubscribedChannels: Returns a list of channels to which a user has subscribed.

Playlist Controllers
1. createPlaylist: Creates a new playlist with a name, description, and the logged-in user as the owner.
2. getUserPlaylists: Fetches the playlists created by a specific user, including associated videos and creators.
3. getPlaylistById: Retrieves a playlist by its ID along with its videos and creator details.
4. addVideoToPlaylist: Adds a video to a user's playlist if it doesn't already exist in the playlist. 
5. removeVideoFromPlaylist: Removes a video from a user's playlist. 
6. deletePlaylist: Deletes a playlist created by the logged-in user. 
7. updatePlaylist: Updates the name and description of an existing playlist.

Like Controllers
1. toggleVideoLike: Toggles the like status of a video for the logged-in user. 
2. toggleCommentLike: Toggles the like status of a comment for the logged-in user. 
3. toggleTweetLike: Toggles the like status of a tweet for the logged-in user. 
4. getLikedVideos: Retrieves all videos liked by the logged-in user, including video details and the owner's information.

Healthcheck controllers
1. healthcheck: Returns a simple "OK" status as a JSON response to check if the server is running.

Dashboard Controllers
1. getChannelStats: Retrieves the statistics of a user's channel, including the total number of videos, views, subscribers, and likes. It aggregates data from multiple collections like Video, Subscription, and Like to provide a comprehensive summary. 
2. getChannelVideos: Fetches all videos uploaded by the channel (user), returning details like the video file, thumbnail, title, duration, views, and publication status.

Comment Controllers
1. getVideoComments: Fetches all comments for a given video, supporting pagination and including user details (username, full name, avatar) for each comment. 
2. addComment: Adds a new comment to a video. Requires content for the comment and associates it with the authenticated user. 
3. updateComment: Updates an existing comment if the authenticated user is the original owner. Requires new content and the comment's ID. 
4. deleteComment: Deletes a comment if it exists and the authenticated user is the owner of the comment.

Setup Instructions
Clone the repository:
git clone https://github.com/Anshul2122/videoStream_backend.git
Navigate to the project directory:
cd videoStream_backend
Install dependencies:
npm install
Add a .env file with the following:
makefile .env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
Start the server:
npm start