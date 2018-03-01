var api = (function(){
    "use strict"

    function sendFiles(method, url, data, callback){
        var formdata = new FormData();
        Object.keys(data).forEach(function(key){
            var value = data[key];
            formdata.append(key, value);
        });
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        xhr.send(formdata);
    }

    function send(method, url, data, callback){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    var date = new Date();
    var module = {};


    if(!localStorage.getItem('currPage')){
        localStorage.setItem('currPage', JSON.stringify(0));
    }

    module.setPageNum = function(page){
        var currPage = JSON.parse(localStorage.getItem('currPage'));
        currPage = page;
        localStorage.setItem('currPage', JSON.stringify(page));
        return currPage;
    }

    module.getPageNum = function(){
        var currPage = JSON.parse(localStorage.getItem('currPage'))
        return currPage;
    }

    /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) _id 
            - (String) title
            - (String) author
            - (String) url
            - (Date) date
    
        comment objects must have the following attributes
            - (String) _id
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date
    
    ****************************** */ 

    // This is for the front end to get the current user
    module.getCurrentUser = function(){
        var l = document.cookie.split("username=");
        if (l.length > 1) return l[1];
        return null;
    }

    // creates a user
    module.signup = function(username, password, callback){
        send("POST", "/signup/", {username: username, password: password}, callback);
    }

    // starts the session
    module.signin = function(username, password, callback){
        send("POST", "/signin/", {username: username, password: password}, callback);
    }

    // ends the session
    module.signout = function(callback){
        send("GET", "/signout/", null, callback);
    }

    // get all usernames (no pagination)
    module.getUsernames = function(callback){
        send("GET", "/api/usernames/", null, callback);
    }

    // add an image to the gallery
    module.addImage = function(title, file, callback){
        sendFiles("POST", "/api/images/", {title: title, date: date, file: file}, callback);
    }

    // delete an image from the gallery given its imageId
    module.deleteImage = function(imageId, callback){
        send("DELETE", "/api/images/" + imageId + "/", null, callback);
    }
    
    // get an image from the gallery given its imageId
    module.getImage = function(imageId, callback){
        send("GET", "/api/image/" + imageId + "/", null, callback);
    }

    // get all imageIds for a given username's gallery (no pagination)
    module.getAllImageIds = function(username, callback){
        send("GET", "/api/images/" + username + "/", null, callback);
    }

    // get all imageIds from the gallery
    module.getAllImageIdz = function(callback){
        send("GET", "/api/images/", null, callback);
    }

    // add a comment to an image
    module.addComment = function(imageId, content, callback){
        send("POST", "/api/comments/", {content: content, imageId: imageId, date: date}, callback);
    }

    // delete a comment to an image
    module.deleteComment = function(commentId, callback){
        send("DELETE", "/api/comments/" + commentId + "/", null, callback);
    }

    // get 10 latest comments given an offset 
    module.getComments = function(imageId, offset, callback){
        send("GET", "/api/comments/"+  imageId + "/" + "?offset=" + offset, null, callback);
    }

    module.getallComments = function(imageId, callback){
        send("GET", "/api/comments/"+  imageId + "/" + "all", null, callback);
    }


    return module;
})();
