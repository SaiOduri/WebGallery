(function(){
    "use strict";

    // Initialize Variables used in code

    const today = new Date();
    const days_of_week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

    var current_day = days_of_week[today.getDay()];
    var current_month = months[today.getMonth()];
    var number = today.getDate();
    var currId = 0;
    var currPage = 0;

    // Inserts comments given a comment object

    function insertComments(Comment){
            var date = current_day + ", " + current_month + " " + number;
            var e = document.createElement('div');
            e.id = "Comment" + Comment._id;
            e.className = "message";
            e.innerHTML=`
                <div class="message_user">
                    <img class="message_picture" src="media/user.png" alt="${Comment.author}">
                    <div class="message_username">${Comment.author}</div>
                </div>
                <div class="message_content">${Comment.content}</div>
                <div class="date icon">${date}</div>
            `;
            var username = api.getCurrentUser();
            var current_picture_user = document.getElementById('select_username').value;
            // Only creates the delete button if current user is comment owner or picture owner
            if (username == Comment.author || username == current_picture_user){
                e.innerHTML += `<div class="delete-icon icon"></div>`;
                // Places comment into the HTML
                document.getElementById("messages").prepend(e);

                // Deletes specific comment
                document.getElementsByClassName('delete-icon')[0].addEventListener('click', function(){
                    var element = document.getElementById("Comment" + Comment._id);
                    api.deleteComment(Comment._id, function(err, delted_comment){
                        if(err) console.log(err)
                        else{
                            element.parentNode.removeChild(element);
                            if(document.getElementById("messages").innerHTML == '' && currPage > 0){
                                currPage--;
                                var pagenumber = document.getElementById("pagenumber");
                                pagenumber.innerHTML = `Page ${currPage +1}`;
                                api.setPageNum(currPage);
                            }
                            setCurrPage(currId, currPage);
                        }
                     });
                    })
            }
            else{
                // Places comment into the HTML
                document.getElementById("messages").prepend(e);
            }

    }

    // Sets Comments given a list of comments
    function setComments(msg){
        var e = document.createElement('div');
        document.getElementById("messages").innerHTML = '';
            e.className = "Comment";
            if(msg.length > 10){
                for(var i = 0; i <= 9; i++){
                    insertComments(msg[i]);
                }
            }
            else{
                for(var x = 0; x < msg.length; x++){
                    insertComments(msg[x]);
                }
            }
    }

    // Sets an image given an image object
    function setImage(image){
        var images = document.getElementById("Images");
        var e = document.createElement('div');
            e.innerHTML = ` <img src="api/images/profile/picture/${image._id}/" alt="${image.title}" class = image_size>`;
            e.className = 'image_div'    
            images.replaceChild(e, images.firstElementChild);
        var info = document.getElementById("Information");
        info.innerHTML = `  <div class = "image_info">
                                <h1>Title: ${image.title}</h1>
                                <h1> Author: ${image.author} </h1>
                                </div>`
    }


    // Clears the current image from the html
    function ClearImage(){
        var images = document.getElementById("Images");
        images.innerHTML = `<div class = "default">
                                </div>`
        var info = document.getElementById("Information");
        info.innerHTML = ``
        var images = document.getElementById("box2");
            images.style.display = "none";
        var form = document.getElementById("box");
            form.style.display = "none";
    }

    // Clears the Comments in the HTML
    function ClearComments(){
        var comments = document.getElementById("messages");
        comments.innerHTML = ``;
    }

    // Sets the current pages comments in the html
    function setCurrPage(currentId, currPage){
        if(currentId != ''){
            api.getallComments(currentId, function(err, comment_list){
                if(err) console.log(err)
                else{
                    ClearComments();
                    var cutNum = (currPage * 10);
                    comment_list.reverse();
                    comment_list = comment_list.slice(cutNum, cutNum + 10);
                    comment_list.reverse();
                    setComments(comment_list);
                }
            });
        }
        else{
            ClearComments();
        }
    }

    // Sets the refresh to first image
    function initializeFirstImage(image) {
        setImage(image);
        currId = image._id;
        var images = document.getElementById("box2");
        images.style.display = "block";
    }

    // Inserts usernames in the drop down
    function insertUsername(username){
        var elmt = document.createElement('option');
        elmt.value = username;
        elmt.innerHTML= username;
        document.querySelector("#select_username").prepend(elmt);
    }

    // Sets up the page based off the user
    function setup(username){
        ClearImage();
        ClearComments();
        var image_list = [];
        var select = document.getElementById("select_user_form");
        var signin = document.getElementById('signinbox');
        var signout = document.getElementById("signoutbox");
        var addimage = document.getElementById("add_image_form");
        var comments = document.getElementById("box3");
        var del = document.getElementById("del");
        if(username != api.getCurrentUser()){
            addimage.style.display = "none";
            del.style.display = "none";
        }
        else{
            addimage.style.display = "block";
            del.style.display = "block";
        }
        if(username != '' && username != null){
            api.getAllImageIds(username, function(err, temp){
                if (err) console.log(err)
                // Cannot comment if there is no photo
                if(temp != null){
                    if(temp.length > 0){
                        comments.style.display = "block";
                        currId = temp[0];
                    }
                    else if(temp.length == 0){
                        currId = '';
                        comments.style.display = "none";
                    }
                    for(var i = 0; i < temp.length; i++){
                        api.getImage(temp[i], function(err, img){
                            if (err) console.log(err)
                            else{
                                image_list.push(img);
                                if (image_list.length == 1 && img != null) {
                                    initializeFirstImage(img);
                                }
                            }
                        })
                    }
                }
                else{
                    currId = '';
                }
            // Sets the current page of the comments
            currPage = api.getPageNum();
            setCurrPage(currId, currPage);
            // Sets the page number in the HTML
            var pagenumber = document.getElementById("pagenumber");
            pagenumber.innerHTML = `Page ${currPage +1}`;
            });
            
        }

        else{
            select.style.display = "none";
            addimage.style.display = "none";
            signout.style.display = "none";
            comments.style.display = "none";
        }
    }
    

    window.onload = function() {

        // Sets up the first page with the current user
        var image_list = [];
        var username = api.getCurrentUser();
        setup(username);

        // Only sets if username has a value
        if(username != '' && username != null){
            document.getElementById('signinbox').style.display = "none";
            document.querySelector("#select_username").innerHTML = '';
                api.getUsernames(function(err, usernames){
                    if (err) console.log(err);
                    else{
                        if (usernames.length != 0) usernames.forEach(insertUsername);
                        document.getElementById("select_username").value = username;
                    }
                });
            api.getAllImageIds(username, function(err, temp){
                if (err) console.log(err)
                // Cannot comment if there is no photo
                if(temp != null){
                    if(temp.length > 0){
                        document.getElementById("box3").style.display = "block";
                        currId = temp[0];
                    }
                    else{
                        document.getElementById("box3").style.display = "none";
                    }
                    for(var i = 0; i < temp.length; i++){
                        api.getImage(temp[i], function(err, img){
                            if (err) console.log(err)
                            else{
                                image_list.push(img);
                                if (image_list.length == 1 && img != null) {
                                    initializeFirstImage(img);
                                }
                            }
                        })
                    }
                }
                // Sets the current page of the comments
                currPage = api.getPageNum();
                setCurrPage(currId, currPage);
                // Sets the page number in the HTML
                var pagenumber = document.getElementById("pagenumber");
                pagenumber.innerHTML = `Page ${currPage +1}`;
            });
        }
        

        // Set up changing the gallery
        document.getElementById('select_username').addEventListener('change', function(f){
            var username = document.getElementById('select_username').value;
            setup(username);
            image_list = [];
            api.getAllImageIds(username, function(err, temp){
                if(temp != null){
                    if(temp.length > 0){
                        for(var i = 0; i < temp.length; i++){
                            api.getImage(temp[i], function(err, img){
                                if (err) console.log(err)
                                else{
                                    image_list.push(img);
                                }
                            })
                        }
                    }
                }
            });
        });

        // Adds click function to the sign up/in box
        document.getElementById('signinbox').addEventListener('click', function(f){
            f.preventDefault();
            var signupform = document.getElementById("sign");
            if(signupform.style.display == "block"){
                signupform.style.display = "none";
            }
            else{
                signupform.style.display = "block";
            }
        });

        // Adds click function to the signout box
        document.getElementById('signoutbox').addEventListener('click', function(f){
            f.preventDefault();
            api.signout(function(err, res){
                if (err) console.log(err);
                else{
                    document.getElementById('select_user_form').style.display = "none";
                    document.getElementById('sign').style.display = "none";
                    document.getElementById('signinbox').style.display = "block";
                    document.getElementById('signoutbox').style.display = "none";
                    document.getElementById("add_image_form").style.display = "none";
                    document.getElementById("box3").style.display = "none";
                    ClearImage();
                    ClearComments();
                    document.cookie += '=;expires=Mon, 10 Aug 2001 00:20:00 GMT;';
                }
            })
        })

        // Adds the user signed up to the database
        document.getElementById('signup').addEventListener('click', function(f){
            f.preventDefault();
            var usr = document.getElementById("username").value;
            var pass = document.getElementById("password").value;
            api.signup(usr, pass, function(err, res){
                if (err) alert(err);
                else{
                    document.getElementById('sign').reset();
                    alert(usr + " has successfully signed up!");
                }
                document.querySelector("#select_username").innerHTML = '';
                api.getUsernames(function(err, usernames){
                    if (err) console.log(err);
                    else{
                        if (usernames.length != 0) usernames.forEach(insertUsername);
                    }
                });
            });
        });

        // Logs in with the user and password
        document.getElementById('signin').addEventListener('click', function(f){
            f.preventDefault();
            var usr = document.getElementById("username").value;
            var pass = document.getElementById("password").value;
            api.signin(usr, pass, function(err, res){
                if (err) alert(err);
                else{
                    // Can only sign out once signed in
                    document.getElementById('sign').reset();
                    document.getElementById('sign').style.display = "none";
                    document.getElementById('signinbox').style.display = "none";
                    document.getElementById('signoutbox').style.display = "block";
                    // Can select a user or upload a picture now
                    document.getElementById("add_image_form").style.display = "block";
                    document.getElementById('select_user_form').style.display = "block";
                    var username = api.getCurrentUser();
                    setup(username);
                    image_list = [];
                    // Populates the current gallery into image_list
                    api.getAllImageIds(username, function(err, temp){
                        if(temp != null){
                            if(temp.length > 0){
                                for(var i = 0; i < temp.length; i++){
                                    api.getImage(temp[i], function(err, img){
                                        if (err) console.log(err)
                                        else{
                                            image_list.push(img);
                                        }
                                    })
                                }
                            }
                        }
                    });

                    // Loads the slect with list of users
                    document.querySelector("#select_username").innerHTML = '';
                    api.getUsernames(function(err, usernames){
                        if (err) console.log(err);
                        else{
                            if (usernames.length != 0) usernames.forEach(insertUsername);
                            document.getElementById("select_username").value = username;
                        }
                    });
                }
            });
        });
        


        // Adding a photo
        document.getElementById('add_image_form').addEventListener('submit', function(x){

            x.preventDefault();
            var title = document.getElementById("title_name").value;
            file = document.getElementById("file").file;
            var file = document.querySelector('#add_image_form input[name="file"]').files[0];
            api.addImage(title, file, function(err, temp){
                if (err) console.log(err);
                else {
                    api.getImage(temp._id, function(err, img){
                        if (err) console.log(err);
                        setImage(img);
                        image_list.push(img);
                    });
                    currId = temp._id;
                }
            });

            document.getElementById("add_image_form").reset();

            // This code was gotten from w3 schools, I changed it a little
            // https://www.w3schools.com/howto/howto_js_toggle_hide_show.asp
            var images = document.getElementById("box2");
            images.style.display = "block";

            var comments = document.getElementById("box3");
            if(comments.style.display == "none"){
                comments.style.display = "block";
            }
            ClearComments();
        });

        // Show button toggles the display of the form
        document.getElementById('show').addEventListener('click', function(f){
            f.preventDefault();

            // This code was gotten from w3 schools, I changed it a little
            // https://www.w3schools.com/howto/howto_js_toggle_hide_show.asp
            var form = document.getElementById("box");
            if(form.style.display == "block"){
                form.style.display = "none";
            }
            else{
                form.style.display = "block";
            }
            
        });


        // Submit a comment
        document.getElementById('create_message_form').addEventListener('submit', function(e){
            e.preventDefault();
            var content = document.getElementById("post_content_2").value;
            document.getElementById("create_message_form").reset();
            api.addComment(currId, content, function(err, test){
                if(err) console.log(err);
                setCurrPage(currId, currPage);
            });
        });

        // Delete an image with all it's comments
        document.getElementById('del').addEventListener('click', function(e){
            e.preventDefault();
            ClearComments();
            // Loops through all the image id's to find current imageId
            var entered = false;
            // Removes the image from the data base
            api.deleteImage(currId, function(err, img){
                if(err) console.log(err);
            });

            for(var i = 0; i < image_list.length; i++){
                if(image_list[i] != null){

                    if(image_list[i]._id == currId && entered == false){
                        var commentbox = document.getElementById("box3");
                        // Sets the image to the next image in the list
                        if(image_list[i+1] != null){
                            entered = true;
                            currId = image_list[i+1]._id;
                            setImage(image_list[i+1]);
                            image_list.splice(i, 1);
                            setCurrPage(currId, currPage);
                            commentbox.style.display = "block";
                        }
                        // If there's no next, sets to a previous image
                        else if(image_list[i-1] != null){
                            entered = true
                            currId = image_list[i-1]._id;
                            setImage(image_list[i-1]);
                            image_list.splice(i, 1);
                            setCurrPage(currId, currPage);
                            commentbox.style.display = "block";
                        }
                        // If there's no next or previous goes to starting options
                        else{
                            entered = true
                            ClearImage();
                            commentbox.style.display = "none";
                        }
                    }
                }

            }
            // Sets the page number to 1 for the next page
            currPage = api.setPageNum(0);
            var pagenumber = document.getElementById("pagenumber");
            pagenumber.innerHTML = `Page ${currPage +1}`;
        })
        
        // Goes to a previous image
        // If you're at the first image, goes to the last image
        document.getElementById('left').addEventListener('click', function(f){
            f.preventDefault();
            var entered = false;
            currPage = api.setPageNum(0);
            for(var i = 0; i < image_list.length; i++){
                if(image_list[i]._id == currId && entered == false){

                    if(image_list[i-1] != null){
                        entered = true;
                        var image = image_list[i-1];
                        currId = image._id;
                        setImage(image);
                        ClearComments();
                        setCurrPage(currId, currPage);
                    }
                    else{
                        entered = true;
                        var last_image = image_list[image_list.length - 1];
                        currId = last_image._id;
                        setImage(last_image);
                        ClearComments();
                        setCurrPage(currId, currPage);
                    }
                }
            }
            entered = false;
            var pagenumber = document.getElementById("pagenumber");
            pagenumber.innerHTML = `Page ${currPage +1}`;
        });

        // Goes to the next image
        // If there's no next, it goes to the first image
        document.getElementById('right').addEventListener('click', function(f){
            f.preventDefault();
            var entered = false;
            currPage = api.setPageNum(0);
            for(var i = 0; i < image_list.length; i++){
                if(image_list[i]._id == currId && entered == false){

                    if(image_list[i+1] != null){
                        entered = true;
                        var image = image_list[i +1];
                        currId = image._id;
                        setImage(image);
                        ClearComments();
                        setCurrPage(currId, currPage);
                    }
                    else{
                        entered = true;
                        var first_image = image_list[0];
                        currId = first_image._id;
                        setImage(first_image);
                        ClearComments();
                        setCurrPage(currId, currPage);
                    }
                }
            }
            entered = false;
            var pagenumber = document.getElementById("pagenumber");
            pagenumber.innerHTML = `Page ${currPage +1}`;
            
        });

        // Goes to the previous comment page
        document.getElementById('last_comment_page').addEventListener('click', function(f){
            api.getallComments(currId, function(err, comment_list){
                if(currPage != 0){
                    if(comment_list.length > 10){
                        ClearComments();
                        currPage--;
                        api.setPageNum(currPage);
                        setCurrPage(currId, currPage);
                    }
                    var pagenumber = document.getElementById("pagenumber");
                    pagenumber.innerHTML = `Page ${currPage +1}`;
                }
            });   
        });

        // Goes to the next comment page
        document.getElementById('next_comment_page').addEventListener('click', function(f){
            api.getallComments(currId, function(err, comment_list){
                if(comment_list.length > ((currPage+1) * 10)){
                    ClearComments();
                    currPage++;
                    api.setPageNum(currPage);
                    setCurrPage(currId, currPage);
                }
                var pagenumber = document.getElementById("pagenumber");
                pagenumber.innerHTML = `Page ${currPage +1}`;
            });
        });
    }
}());


