import React, { useEffect, useState } from "react";

// import StepByStep from "./StepByStep/StepByStep";
import "./styles.css";

function App() {
  const [imageUrl, setImageUrl] = useState("");
  const [postCaption, setPostCaption] = useState("");
  const [isSharingPost, setIsSharingPost] = useState(false);
  const [isSharingPostFacebook, setIsSharingPostFacebook] = useState(false);
  const [facebookUserAccessToken, setFacebookUserAccessToken] = useState("");

  /* --------------------------------------------------------
   *                      FACEBOOK LOGIN
   * --------------------------------------------------------
   */

  // Check if the user is authenticated with Facebook
  useEffect(() => {
    window.FB.getLoginStatus((response) => {
      setFacebookUserAccessToken(response.authResponse?.accessToken);
    });
  }, []);

  const logInToFB = () => {
    window.FB.login(
      (response) => {
        setFacebookUserAccessToken(response.authResponse?.accessToken);
      },
      {
        // Scopes that allow us to publish content to Instagram and Facebook
        scope: "pages_manage_metadata,instagram_basic,pages_show_list,pages_manage_posts,pages_read_engagement,user_photos,user_posts,publish_video,business_management",
      }
    );
  };

  const logOutOfFB = () => {
    window.FB.logout(() => {
      setFacebookUserAccessToken(undefined);
    });
  };

  /* --------------------------------------------------------
   *             INSTAGRAM AND FACEBOOK GRAPH APIs
   * --------------------------------------------------------
   */

  const getFacebookPages = () => {
    return new Promise((resolve) => {
      window.FB.api(
        "me/accounts",
        { access_token: facebookUserAccessToken },
        (response) => {
          resolve(response.data);
        }
      );
    });
  };

  const getInstagramAccountId = (facebookPageId) => {
    return new Promise((resolve) => {
      window.FB.api(
        facebookPageId,
        {
          access_token: facebookUserAccessToken,
          fields: "instagram_business_account",
        },
        (response) => {
          resolve(response.instagram_business_account.id);
        }
      );
    });
  };

  const createMediaObjectContainer = (instagramAccountId) => {
    return new Promise((resolve) => {
      window.FB.api(
        `${instagramAccountId}/media`,
        "POST",
        {
          access_token: facebookUserAccessToken,
          image_url: imageUrl,
          caption: postCaption,
        },
        (response) => {
          resolve(response.id);
        }
      );
    });
  };

  const publishMediaObjectContainer = (
    instagramAccountId,
    mediaObjectContainerId
  ) => {
    return new Promise((resolve) => {
      window.FB.api(
        `${instagramAccountId}/media_publish`,
        "POST",
        {
          access_token: facebookUserAccessToken,
          creation_id: mediaObjectContainerId,
        },
        (response) => {
          resolve(response.id);
        }
      );
    });
  };

  const shareInstagramPost = async () => {
    setIsSharingPost(true);
    const facebookPages = await getFacebookPages();
    const instagramAccountId = await getInstagramAccountId(facebookPages[0].id);
    const mediaObjectContainerId = await createMediaObjectContainer(
      instagramAccountId
    );

    await publishMediaObjectContainer(
      instagramAccountId,
      mediaObjectContainerId
    );

    setIsSharingPost(false);

    // Reset the form state
    setImageUrl("");
    setPostCaption("");
  };

  // Facebook 
  const shareFacebookPost = async () => {
    setIsSharingPostFacebook(true);
    const facebookPages = await getFacebookPages();
    const facebookPageToPublish = facebookPages[0].id;
    const facebookPageToken = await getFacebookPageToken(facebookPageToPublish);

    await postToFacebook(
      facebookPageToPublish,
      facebookPageToken
    );
    setIsSharingPostFacebook(false);

    // Reset the form state
    setImageUrl("");
    setPostCaption("");
  };

  const getFacebookPageToken = (facebokPageId) =>{
    return new Promise((resolve) => {
      window.FB.api(
        facebokPageId,
        "GET",
        {
          fields: 'access_token',
          access_token: facebookUserAccessToken
        },
        (response) => {
          resolve(response.access_token);
        }
      );      
    });
  }

  const postToFacebook = (facebookPageId, facebookPageToken) => {

    return new Promise((resolve) => {
      window.FB.api(
        `${facebookPageId}/photos`,
        "POST",
        {
          access_token: facebookPageToken,
          url: imageUrl,
          message: postCaption,
        },
        (response) => {
          resolve(response.id);
        }
      );      
    });
  };

  //Get daily Post Limit
  const checkPostLimit = async () => {
    const facebookPages = await getFacebookPages();
    const instagramAccountId = await getInstagramAccountId(facebookPages[0].id);
    return new Promise((resolve) => {
      window.FB.api(
        `${instagramAccountId}/content_publishing_limit`,
        "GET",
        (response) => {
          resolve(response.quota_usage);
        }
      );
    });
  };


  return (
    <>
      <main id="app-main">
        <section className="app-section">
          <h3>1. Log in with Facebook</h3>
          {facebookUserAccessToken ? (
            <button onClick={logOutOfFB} className="btn action-btn">
              Log out of Facebook
            </button>
          ) : (
            <button onClick={logInToFB} className="btn action-btn">
              Login with Facebook
            </button>
          )}
        </section>
        {facebookUserAccessToken ? (
          <section className="app-section">
            <h3>2. Send a post to Instagram</h3>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter a JPEG image url..."
            />
            <textarea
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder="Write a caption..."
              rows="10"
            />
            <button
              onClick={shareInstagramPost}
              className="btn action-btn"
              disabled={isSharingPost || !imageUrl}
            >
              {isSharingPost ? "Sharing to Instagram..." : "Share to Instagram"}
            </button>
            <button
              onClick={shareFacebookPost}
              className="btn action-btn"
              disabled={isSharingPostFacebook || !imageUrl}
            >
              {isSharingPostFacebook ? "Sharing to Facebook..." : "Share to Facebook"}
            </button>
          </section>
        ) : null}
      </main>
      {/* <StepByStep facebookUserAccessToken={facebookUserAccessToken} /> */}
    </>
  );
}

export default App;
