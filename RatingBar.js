/**
 * Represents a rating bar
 *
 */
class RatingBar {
  /**
   * Create a rating bar
   * @param {HTMLElement} root - The element to attach the rating bar to
   */
  constructor(root, settings) {
    settings = {
      apiRoot: "http://www.dislike-everywhere.test/",
      ...settings,
    };

    // settings
    this.root = root;
    this.apiRoot = settings.apiRoot;

    // get the root
    this.root.append(this.getElement());

    // get the elements from the root
    this.likeCount = this.root.querySelector("[data-like-count]");
    this.dislikeCount = this.root.querySelector("[data-dislike-count]");
    this.progress = this.root.querySelector("[data-progress]");
    this.likeButton = this.root.querySelector("[data-like]");
    this.dislikeButton = this.root.querySelector("[data-dislike]");

    // bind the events
    this.likeButton.addEventListener("click", () => this.like());
    this.dislikeButton.addEventListener("click", () => this.dislike());

    // load the rating
    this.load();
  }

  /**
   * fetch the rating from the server and update the UI
   */
  async load() {
    // get the rating
    let rating = await this.getRating();
    this.likes = rating.likes;
    this.dislikes = rating.dislikes;

    console.log(rating);

    // update the UI
    this.update(rating);
  }

  /**
   * Update the UI with the current rating
   */
  update(updateCache = false) {
    // update the UI
    this.likeCount.textContent = this.likes;
    this.dislikeCount.textContent = this.dislikes;
    this.total = this.likes + this.dislikes;

    // set the default values
    let value = 1;
    let max = 2;
    if (this.total > 0) {
      // calculate the value
      value = Math.floor(this.likes / this.total);
      max = this.total;
    }

    // update the progress bar
    this.progress.value = value;
    this.progress.max = max;

    // update the cache
    if (updateCache)
      this.setCache({ likes: this.likes, dislikes: this.dislikes });
  }

  /**
   * Make a request to the server
   * @param {string} endpoint - The endpoint to hit
   * @param {string} method - The HTTP method to use
   * @param {object} body - The body of the request
   * @returns {Promise} - The response in JSON
   */
  async request(endpoint, method, body) {
    let url = this.apiRoot + endpoint;

    // add body to the url
    if (body) {
      url += "?" + new URLSearchParams(body);
    }

    // make the request
    let response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // return the response as JSON
    return response.json();
  }

  /**
   * Like the current page
   * @returns {Promise} - The response in JSON
   */
  async like() {
    // make the request
    let response = await this.request("rate", "GET", {
      url: window.location.href,
      rating: 1,
    });

    // bail if failed
    if (response.error) return;

    // when rating is successful
    if (response.status === "success") this.likes += 1;

    // when rating is updated
    if (response.status === "updated") {
      this.likes += 1;
      this.dislikes -= 1;
    }

    // update the UI
    this.update(true);
  }

  /**
   * Dislike the current page
   * @returns {Promise} - The response in JSON
   */
  async dislike() {
    // make the request
    let response = await this.request("rate", "GET", {
      url: window.location.href,
      rating: 0,
    });

    // when rating is successful
    if (response.status === "success") this.dislikes += 1;

    // when rating is updated
    if (response.status === "updated") {
      this.dislikes += 1;
      this.likes -= 1;
    }

    // update the UI
    this.update(true);
  }

  /**
   * Get a clean URL for the current page
   * @returns {string} - The current URL
   */
  getURL() {
    let url = window.location.href;

    // get url parts
    const urlParts = new URL(url);

    const path = urlParts.pathname;
    const host = urlParts.hostname;

    // get only the parts we need
    url = host + path;

    // remove trailing slash
    url = url.replace(/\/$/, "");

    // remove www
    url = url.replace("www.", "");

    return url;
  }

  /**
   * get the current cached value
   */
  getCached() {
    const url = this.getURL();
    const ratings = this.getAllCache();
    if (!ratings[url]) return false;

    // check if the cache is expired
    if (ratings[url].expires < Date.now()) return false;

    // return the cached value
    return {
      ...ratings[url],
      cached: true,
      url,
    };
  }

  getAllCache() {
    let rating = localStorage.getItem("ratings") || false;
    if (rating === false) return {};

    // parse the rating
    rating = JSON.parse(rating) || {};

    // return the rating
    return rating;
  }

  /**
   * Set the current cached value
   * @param {object} rating - The rating to cache
   */
  setCache(rating) {
    let url = this.getURL();

    // get cache
    let ratings = this.getAllCache();

    // set the expires
    ratings[url] = {
      ...rating,
      expires: Date.now() + 1000 * 60 * 60,
    };

    // set the rating
    localStorage.setItem("ratings", JSON.stringify(ratings));
  }

  /**
   * Get the rating for the current page
   * @returns {Promise} - The response in JSON
   */
  async getRating() {
    // get the cached value
    let cached = this.getCached();
    if (cached) return cached;

    // make the request
    let response = await this.request("rating", "GET", {
      url: window.location.href,
    });

    this.setCache(response);

    // return the response
    return response;
  }

  /**
   * Create the HTML for the rating bar
   * @returns {HTMLElement} - The rating bar element
   */
  getElement() {
    // create an element
    let root = document.createElement("div");

    // set the inner HTML
    root.innerHTML = `
      <article class="rating-bar">
      
        <style>
          button {
            background-color: transparent;
            border: none;
            font: inherit;
            cursor: pointer;
            color: currentColor;
          }

          svg {
            fill: currentColor;
            height: 1em;
            width: 1em;
          }

          .rating-bar {
            width:100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            gap:.5rem;
          }

          .rating-bar > section {
            display: flex;
            justify-content: space-between;
            background-color:#23262d;
            border-radius: 100px;
            color:white;
            width: 100%;
          }

          .rating-bar >  section > button {
            flex:1;
            text-align: left;
            display:flex;
            gap:1rem;
            padding:1rem;
            align-items:center;
          }
          .rating-bar >  section > button:last-child {
            text-align: right;
            border-left: 1px solid rgba(255,255,255,0.5);
          }

          .rating-bar > progress {
            width: 100%;
            border:0px;
            border-radius: 100px;
            overflow: hidden;
            height: 5px;
            background-color:red;
          }

          .rating-bar > progress::-webkit-progress-bar,
          .rating-bar > progress::-webkit-progress-value,
          .rating-bar > progress::-moz-progress-bar {
            background-color: green;
          }

        </style>
        <section>

          <button data-like>
            <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z"/></svg></span>
            <span data-like-count></span>
          </button>

          <button data-dislike>
            <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M313.4 479.1c26-5.2 42.9-30.5 37.7-56.5l-2.3-11.4c-5.3-26.7-15.1-52.1-28.8-75.2H464c26.5 0 48-21.5 48-48c0-18.5-10.5-34.6-25.9-42.6C497 236.6 504 223.1 504 208c0-23.4-16.8-42.9-38.9-47.1c4.4-7.3 6.9-15.8 6.9-24.9c0-21.3-13.9-39.4-33.1-45.6c.7-3.3 1.1-6.8 1.1-10.4c0-26.5-21.5-48-48-48H294.5c-19 0-37.5 5.6-53.3 16.1L202.7 73.8C176 91.6 160 121.6 160 153.7V192v48 24.9c0 29.2 13.3 56.7 36 75l7.4 5.9c26.5 21.2 44.6 51 51.2 84.2l2.3 11.4c5.2 26 30.5 42.9 56.5 37.7zM32 384H96c17.7 0 32-14.3 32-32V128c0-17.7-14.3-32-32-32H32C14.3 96 0 110.3 0 128V352c0 17.7 14.3 32 32 32z"/></svg></span>
            <span data-dislike-count></span>
          </button>

        </section>  

        <progress data-progress value="0" max="100"></progress>
      </article>
      `;

    // return the element as HTMLElement
    return root.children[0];
  }
}

// Create a class for the element
export default class RatingBarElement extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });

    // bind the RatingBar to the shadow root
    new RatingBar(shadow);
  }
}

// Define the new element
customElements.define("rating-bar", RatingBarElement);

let ratingBar = document.createElement("rating-bar");
ratingBar.style.position = "fixed";
ratingBar.style.bottom = "0";
ratingBar.style.left = "0";
// ratingBar.style.width = "100%";
ratingBar.style.zIndex = "9999";
ratingBar.style.padding = "10px";

// prepend the rating bar to the body
document.body.prepend(ratingBar);
