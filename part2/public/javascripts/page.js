var posts = [];
var search = null;

/*
 * Hides the main part of the page to show the Ask a Question section
 */
function showAsk(){
    var main = document.getElementById("main");
    var ask = document.getElementById("ask");
    main.style.display = "none";
    ask.style.display = "block";
}

/*
 * Hides the Ask a Question section of the page to show the main part,
 * clearing the question input fields.
 */
function showMain(){
    var main = document.getElementById("main");
    var ask = document.getElementById("ask");
    ask.style.display = "none";
    main.style.display = "block";

    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-tags').value = '';
}

/*
 * Creates a new question/post & send it to the server, before triggering an update for the main part of the page.
 */
function createPost(){

    search = null;

    let post = {
        title: document.getElementById('post-title').value,
        content: document.getElementById('post-content').value,
        tags: document.getElementById('post-tags').value.split(" "),
        upvotes: 0
    };

    // Create AJAX Request
    var xmlhttp = new XMLHttpRequest();

    // Define function to run on response
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Update the page on success
            loadPosts();
            showMain();
        }
    };

    // Open connection to server & send the post data using a POST request
    // We will cover POST requests in more detail in week 8
    xmlhttp.open("POST", "/addpost", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(JSON.stringify(post));

}

/*
 * Updates the search term then reloads the posts shown
 */
function searchPosts(){

    search = document.getElementById('post-search').value.toUpperCase();
    updatePosts();

}


/*
 * Reloads the posts shown on the page
 * Iterates over the array of post objects, rendering HTML for each and appending it to the page
 * If a search term is being used
 */
function updatePosts() {

    // Reset the page
    document.getElementById('post-list').innerHTML = '';

    // Iterate over each post in the array by index
    for(let i=0; i<posts.length; i++){

        let post = posts[i];

        // Check if a search term used.
        if(search !== null){
            // If so, skip this question/post if title or content doesn't match
            if (post.title.toUpperCase().indexOf(search) < 0 &&
                post.content.toUpperCase().indexOf(search) < 0 ) {
                continue;
            }
        }

        // Generate a set of spans for each of the tags
        let tagSpans = '';
        for(let tag of post.tags){
            tagSpans = tagSpans + `<span class="tag">${tag}</span>`;
        }

        // Generate the post/question element and populate its inner HTML
        let postDiv = document.createElement("DIV");
        postDiv.classList.add("post");

        postDiv.innerHTML = `
            <div class="votes">
                <button onclick="upvote(${i})">+</button>
                <p><span class="count">${post.upvotes}</span><br />votes</p>
                <button onclick="downvote(${i})">-</button>
            </div>
            <div class="content">
                <h3><a href="#">${post.title}</a></h3>
                <i>By ${post.author}</i>
                <p>${post.content}</p>
                ${tagSpans}<span class="date">${new Date(post.timestamp).toLocaleString()}</span>
            </div>
        `;

        // Append the question/post to the page
        document.getElementById("post-list").appendChild(postDiv);

    }


}

/*
 * Loads posts from the server
 * - Send an AJAX GET request to the server
 * - JSON Array of posts sent in response
 * - Update the
 */
function loadPosts() {

    // Create AJAX Request
    var xmlhttp = new XMLHttpRequest();

    // Define function to run on response
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Parse the JSON and update the posts array
            posts = JSON.parse(this.responseText);
            // Call the updatePosts function to update the page
            updatePosts();
        }
    };

    // Open connection to server
    xmlhttp.open("GET", "/posts", true);

    // Send request
    xmlhttp.send();

}


/*
 * Increase the votes for a given post, then update the page
 */
function upvote(index) {
    posts[index].upvotes ++;
    updatePosts();
}

/*
 * Decrease the votes for a given post, then update the page
 */
function downvote(index) {
    posts[index].upvotes --;
    updatePosts();
}

// Added login handler to page.js
function login(){

    // Attach event listener to login form
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        // Get form values
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

         // Send login request to server
        const res = await fetch('api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        // Redirect based on role
        if (res.ok) {
          if (data.role === 'owner') {
            window.location.href = '/owner-dashboard.html';
          } else if (data.role === 'walker') {
            window.location.href = '/walker-dashboard.html';
          }
        } else {
          alert(data.error);
        }
      });

}

// Logout function
function logout() {
    fetch('/api/users/logout', {
      method: 'POST'
    })
    .then((res) => res.json())
    .then((data) => {
      console.log(data.message);
      window.location.href = '/'; // Redirect to login/home page
    })
    .catch((err) => {
      console.error('Logout failed:', err);
    });
  }

async function loadDogsWithPhotos() {
    try {
      const res = await fetch('/api/users/all-dogs');
      const dogs = await res.json();

      const tbody = document.getElementById('dogsBody');
      tbody.innerHTML = '';

      for (const dog of dogs) {
        // Fetch a random dog photo from dogs.ceo API
        const imgRes = await fetch('https://dog.ceo/api/breeds/image/random');
        const imgData = await imgRes.json();

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${dog.dog_id}</td>
          <td>${dog.name}</td>
          <td>${dog.size}</td>
          <td>${dog.owner_id}</td>
          <td><img src="${imgData.message}" alt="Dog Photo" style="width: 100px; height: auto;" /></td>
        `;
        tbody.appendChild(row);
      }
    } catch (err) {
      console.error('Error loading dog data:', err);
    }
  }
// Run login handler on page load
document.addEventListener('DOMContentLoaded', login);
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dogsBody')) {
      loadDogsWithPhotos();
    }
  });




